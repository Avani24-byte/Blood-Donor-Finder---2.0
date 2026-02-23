const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sqlite3 = require('sqlite3').verbose();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'change-this-secret';

// Google OAuth setup
const {OAuth2Client} = require('google-auth-library');
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);


app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

const DB_FILE = path.join(__dirname, 'data.db');
const db = new sqlite3.Database(DB_FILE);

function initDb() {
    db.serialize(() => {
        // table for Google‑authenticated users
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY,
            googleId TEXT UNIQUE,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            name TEXT,
            isAdmin INTEGER DEFAULT 0
        )`);
        // ensure phone column exists on older installs
        db.run(`PRAGMA table_info(users)`, (err, rows) => {
            if (!err && rows && !rows.find(r => r.name === 'phone')) {
                db.run(`ALTER TABLE users ADD COLUMN phone TEXT UNIQUE`);
            }
        });

        // legacy admin table (kept for compatibility but not used by OAuth flow)
        db.run(`CREATE TABLE IF NOT EXISTS admins (
            id INTEGER PRIMARY KEY,
            username TEXT UNIQUE,
            password_hash TEXT
        )`);

        db.run(`CREATE TABLE IF NOT EXISTS institutions (
            id INTEGER PRIMARY KEY,
            name TEXT UNIQUE
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS donors (
            id INTEGER PRIMARY KEY,
            institution_id INTEGER,
            name TEXT,
            age INTEGER,
            bloodGroup TEXT,
            contact TEXT,
            address TEXT,
            FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE
        )`);
    });
}
initDb();

// Health check endpoint (no auth required)
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});

// ------------------------------------------------------------------
// authentication helpers

function requireAuth(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(parts[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.user = decoded; // { id, email, isAdmin }
        next();
    });
}

function requireAdmin(req, res, next) {
    requireAuth(req, res, () => {
        if (!req.user.isAdmin) return res.status(403).json({ error: 'Forbidden' });
        next();
    });
}

// POST /api/auth/google - accept ID token from client, verify with Google,
// create or update a user record and return a JWT embedding isAdmin flag.
app.post('/api/auth/google', async (req, res) => {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ error: 'Missing ID token' });
    try {
        const ticket = await googleClient.verifyIdToken({ idToken, audience: GOOGLE_CLIENT_ID });
        const payload = ticket.getPayload();
        const googleId = payload.sub;
        const email = payload.email;
        const name = payload.name;
        if (!googleId || !email) return res.status(400).json({ error: 'Invalid token payload' });

        db.get('SELECT * FROM users WHERE googleId = ?', [googleId], (err, user) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            const upsertUser = () => {
                // retrieve the record again so we can sign
                db.get('SELECT * FROM users WHERE googleId = ?', [googleId], (err, u) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    const token = jwt.sign({ id: u.id, email: u.email, isAdmin: !!u.isAdmin }, JWT_SECRET, { expiresIn: '2h' });
                    res.json({ token, isAdmin: !!u.isAdmin });
                });
            };
            if (user) {
                // update name/email in case they changed
                db.run('UPDATE users SET email=?, name=? WHERE googleId=?', [email, name, googleId], (err) => {
                    if (err) console.error('could not update user', err);
                    upsertUser();
                });
            } else {
                db.run('INSERT INTO users (googleId, email, name) VALUES (?,?,?)', [googleId, email, name], function (err) {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    upsertUser();
                });
            }
        });
    } catch (err) {
        console.error('Google verify error', err);
        res.status(401).json({ error: 'Invalid ID token' });
    }
});

// POST /api/auth/manual - simple name+phone login without OAuth
app.post('/api/auth/manual', (req, res) => {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ error: 'Missing fields' });
    if (!/^\+?[0-9]{6,15}$/.test(phone)) {
        return res.status(400).json({ error: 'Phone format invalid' });
    }
    const normalized = phone;
    db.get('SELECT * FROM users WHERE phone = ?', [normalized], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        const upsert = () => {
            db.get('SELECT * FROM users WHERE phone = ?', [normalized], (err, u) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                const token = jwt.sign({ id: u.id, email: u.email, phone: u.phone, isAdmin: !!u.isAdmin }, JWT_SECRET, { expiresIn: '2h' });
                res.json({ token, isAdmin: !!u.isAdmin });
            });
        };
        if (user) {
            db.run('UPDATE users SET name=? WHERE id=?', [name, user.id], err => {
                if (err) console.error(err);
                upsert();
            });
        } else {
            db.run('INSERT INTO users (googleId, phone, name) VALUES (NULL,?,?)', [normalized, name], function (err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                upsert();
            });
        }
    });
});

// simple status endpoint to let front‑end know if any admin exists yet
app.get('/api/admins/status', (req, res) => {
    db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        res.json({ exists: row.count > 0 });
    });
});

// create a new admin account using username/password (requires existing admin)
app.post('/api/admins/create', requireAdmin, (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    bcrypt.hash(password, 10, (err, hash) => {
        if (err) return res.status(500).json({ error: 'Server error' });
        db.run('INSERT INTO admins (username, password_hash) VALUES (?,?)', [username, hash], function(err) {
            if (err) {
                if (err.code === 'SQLITE_CONSTRAINT') {
                    return res.status(409).json({ error: 'Username already exists' });
                }
                return res.status(500).json({ error: 'Database error' });
            }
            res.status(201).json({ message: 'Admin account created' });
        });
    });
});

// promote an existing (or new) user to admin - only visible to admins
app.post('/api/admins', requireAdmin, (req, res) => {
    const { email, phone, name } = req.body;
    if (!email && !phone) return res.status(400).json({ error: 'Provide email or phone' });
    const query = email ? 'email = ?' : 'phone = ?';
    const value = email || phone;
    db.get(`SELECT * FROM users WHERE ${query}`, [value], (err, user) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (user) {
            db.run('UPDATE users SET isAdmin=1 WHERE id=?', [user.id], function (err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ message: 'User promoted to admin' });
            });
        } else {
            const phoneVal = phone || null;
            const emailVal = email || null;
            db.run('INSERT INTO users (email, phone, name, isAdmin) VALUES (?,?,?,1)', [emailVal, phoneVal, name || null], function (err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ message: 'Admin placeholder created' });
            });
        }
    });
});


// Create first admin (no auth required)
app.post('/api/first-admin', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing fields' });
    
    // Check if any admins already exist
    db.get('SELECT COUNT(*) as count FROM admins', (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (row.count > 0) return res.status(403).json({ error: 'Admins already exist' });
        
        // Hash and create first admin
        bcrypt.hash(password, 10, (err, hash) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            db.run('INSERT INTO admins (username, password_hash) VALUES (?,?)', [username, hash], function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(409).json({ error: 'Username already exists' });
                    }
                    return res.status(500).json({ error: 'Database error' });
                }
                res.status(201).json({ message: 'First admin created' });
            });
        });
    });
});

app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Missing credentials' });
    db.get('SELECT * FROM admins WHERE LOWER(username) = LOWER(?)', [username], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(401).json({ error: 'Invalid credentials' });
        bcrypt.compare(password, row.password_hash, (err, match) => {
            if (err) return res.status(500).json({ error: 'Server error' });
            if (!match) return res.status(401).json({ error: 'Invalid credentials' });
            const token = jwt.sign({ id: row.id, username: row.username, isAdmin: true }, JWT_SECRET, { expiresIn: '2h' });
            res.json({ token });
        });
    });
});

app.get('/api/donors', requireAuth, (req, res) => {
    db.serialize(() => {
        db.all('SELECT id, name FROM institutions', (err, instRows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            const result = {};
            if (instRows.length === 0) return res.json(result);
            let count = 0;
            instRows.forEach(inst => {
                db.all('SELECT name, age, bloodGroup, contact, address FROM donors WHERE institution_id = ?', [inst.id], (err, donRows) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    result[inst.name] = donRows;
                    count++;
                    if (count === instRows.length) {
                        res.json(result);
                    }
                });
            });
        });
    });
});

app.post('/api/donors', requireAuth, (req, res) => {
    const { institution, name, age, bloodGroup, contact, address } = req.body;
    if (!institution || !name || !age || !bloodGroup || !contact || !address) {
        return res.status(400).json({ error: 'Missing fields' });
    }
    db.serialize(() => {
        db.get('SELECT id FROM institutions WHERE name = ?', [institution], (err, row) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            const insertDonor = instId => {
                db.run('INSERT INTO donors (institution_id, name, age, bloodGroup, contact, address) VALUES (?, ?, ?, ?, ?, ?)',
                    [instId, name, age, bloodGroup, contact, address], function (err) {
                        if (err) return res.status(500).json({ error: 'Database error' });
                        res.status(201).json({ message: 'Donor added' });
                    });
            };
            if (row) {
                insertDonor(row.id);
            } else {
                db.run('INSERT INTO institutions (name) VALUES (?)', [institution], function (err) {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    insertDonor(this.lastID);
                });
            }
        });
    });
});

app.post('/api/institutions', (req, res) => {
    const { name } = req.body;
    if (!name) return res.status(400).json({ error: 'Missing name' });
    db.run('INSERT INTO institutions (name) VALUES (?)', [name], function (err) {
        if (err) {
            if (err.code === 'SQLITE_CONSTRAINT') {
                return res.status(409).json({ error: 'Institution already exists' });
            }
            return res.status(500).json({ error: 'Database error' });
        }
        res.status(201).json({ message: 'Institution created' });
    });
});

app.delete('/api/institutions/:institution', requireAdmin, (req, res) => {
    const inst = req.params.institution;
    db.run('DELETE FROM institutions WHERE name = ?', [inst], function (err) {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
        res.json({ message: 'Deleted' });
    });
});

app.delete('/api/institutions/:institution/donors/:index', requireAdmin, (req, res) => {
    const inst = req.params.institution;
    const idx = parseInt(req.params.index, 10);
    if (isNaN(idx)) return res.status(400).json({ error: 'Bad index' });
    db.get('SELECT id FROM institutions WHERE name = ?', [inst], (err, row) => {
        if (err) return res.status(500).json({ error: 'Database error' });
        if (!row) return res.status(404).json({ error: 'Not found' });
        db.all('SELECT id FROM donors WHERE institution_id = ?', [row.id], (err, donRows) => {
            if (err) return res.status(500).json({ error: 'Database error' });
            if (idx < 0 || idx >= donRows.length) return res.status(404).json({ error: 'Not found' });
            const donorId = donRows[idx].id;
            db.run('DELETE FROM donors WHERE id = ?', [donorId], function (err) {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ message: 'Deleted donor' });
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});