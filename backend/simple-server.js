const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = 'blood-donor-secret-key';
const DATA_DIR = path.join(__dirname, 'data');

// Create data directory if it doesn't exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));

// Helper functions for JSON file storage
function readData(filename) {
    const filepath = path.join(DATA_DIR, `${filename}.json`);
    if (!fs.existsSync(filepath)) {
        return [];
    }
    try {
        return JSON.parse(fs.readFileSync(filepath, 'utf8'));
    } catch (err) {
        return [];
    }
}

function writeData(filename, data) {
    const filepath = path.join(DATA_DIR, `${filename}.json`);
    fs.writeFileSync(filepath, JSON.stringify(data, null, 2), 'utf8');
}

// Initialize default data
function initData() {
    if (!fs.existsSync(path.join(DATA_DIR, 'admins.json'))) {
        const hashedPassword = bcrypt.hashSync('BABBLU0124', 10);
        writeData('admins', [
            { id: 1, username: 'MITHUN M', password_hash: hashedPassword }
        ]);
    }
    if (!fs.existsSync(path.join(DATA_DIR, 'institutions.json'))) {
        writeData('institutions', [
            { id: 1, name: 'Red Cross Blood Bank' },
            { id: 2, name: 'City Hospital Blood Center' },
            { id: 3, name: 'Community Blood Donation Center' }
        ]);
    }
    if (!fs.existsSync(path.join(DATA_DIR, 'donors.json'))) {
        writeData('donors', [
            { id: 1, institution_id: 1, name: 'John Doe', age: 28, bloodGroup: 'O+', contact: '9876543210', address: 'New York' },
            { id: 2, institution_id: 1, name: 'Jane Smith', age: 32, bloodGroup: 'B+', contact: '9876543211', address: 'New York' },
            { id: 3, institution_id: 2, name: 'Mike Johnson', age: 25, bloodGroup: 'AB+', contact: '9876543212', address: 'Boston' }
        ]);
    }
}

initData();

// Routes

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend server is running' });
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    const admins = readData('admins');
    const admin = admins.find(a => a.username === username);
    
    if (!admin) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const isValid = bcrypt.compareSync(password, admin.password_hash);
    
    if (!isValid) {
        return res.status(401).json({ error: 'Invalid username or password' });
    }
    
    const token = jwt.sign({ id: admin.id, username: admin.username }, JWT_SECRET);
    res.json({ token, message: 'Login successful' });
});

// Get all institutions
app.get('/api/institutions', (req, res) => {
    const institutions = readData('institutions');
    res.json(institutions);
});

// Get institutions with donors
app.get('/api/institutions-with-donors', (req, res) => {
    const institutions = readData('institutions');
    const donors = readData('donors');
    
    const result = institutions.map(inst => ({
        ...inst,
        donors: donors.filter(d => d.institution_id === inst.id)
    }));
    
    res.json(result);
});

// Get donors
app.get('/api/donors', (req, res) => {
    const donors = readData('donors');
    res.json(donors);
});

// Create new institution
app.post('/api/institutions', (req, res) => {
    const { name } = req.body;
    
    if (!name) {
        return res.status(400).json({ error: 'Institution name required' });
    }
    
    const institutions = readData('institutions');
    const newInst = {
        id: Math.max(...institutions.map(i => i.id), 0) + 1,
        name
    };
    
    institutions.push(newInst);
    writeData('institutions', institutions);
    res.json(newInst);
});

// Create new donor
app.post('/api/donors', (req, res) => {
    const { institution_id, name, age, bloodGroup, contact, address } = req.body;
    
    if (!institution_id || !name || !age || !bloodGroup) {
        return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const donors = readData('donors');
    const newDonor = {
        id: Math.max(...donors.map(d => d.id), 0) + 1,
        institution_id,
        name,
        age,
        bloodGroup,
        contact: contact || '',
        address: address || ''
    };
    
    donors.push(newDonor);
    writeData('donors', donors);
    res.json(newDonor);
});

// Create new admin - requires valid token
app.post('/api/admins/create', (req, res) => {
    const { username, password } = req.body;
    const auth = req.headers['authorization'];
    
    if (!auth) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    
    try {
        const token = auth.split(' ')[1];
        jwt.verify(token, JWT_SECRET);
    } catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }
    
    const admins = readData('admins');
    
    if (admins.find(a => a.username === username)) {
        return res.status(400).json({ error: 'Username already exists' });
    }
    
    const hashedPassword = bcrypt.hashSync(password, 10);
    const newAdmin = {
        id: Math.max(...admins.map(a => a.id), 0) + 1,
        username,
        password_hash: hashedPassword
    };
    
    admins.push(newAdmin);
    writeData('admins', admins);
    res.json({ message: 'Admin created successfully' });
});

// Start server
app.listen(PORT, () => {
    console.log(`✅ Server running on http://localhost:${PORT}`);
    console.log(`📁 Data stored in: ${DATA_DIR}`);
    console.log(`🔐 Default login: MITHUN M / BABBLU0124`);
});
