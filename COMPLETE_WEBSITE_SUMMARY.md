# Blood Donor Finder - Complete Website Documentation

## 📌 Overview

Blood Donor Finder is a full-stack web application that enables voluntary blood donors to register their information and allows administrators to manage donor records and institutions. The system consists of:

- **Frontend**: HTML5, CSS3, Vanilla JavaScript (no frameworks)
- **Backend**: Node.js with Express.js framework
- **Database**: SQLite3 (file-based)
- **Authentication**: JWT tokens with bcrypt password hashing

---

## 🎯 Core Features

### For Donors (Public Features)
✅ **User Registration**
- Register with institution, name, age, blood group, phone contact, and address
- Automatic institution creation if it doesn't exist
- Form validation with user-friendly error messages

✅ **Donor Directory**
- View all registered donors across institutions
- Search by institution name or donor name
- Filter by blood group within each institution
- View complete donor contact information

✅ **Information Hub**
- Home page with blood donation awareness content
- Eligibility guidelines (who should/shouldn't donate)
- Post-donation care instructions
- About page with project mission

### For Administrators (Secure Features)
✅ **First-Time Setup**
- No terminal commands required
- Create first admin account directly from web interface
- Web-based, user-friendly setup process

✅ **Admin Authentication**
- Secure login with username/password
- JWT token-based sessions (2-hour expiration)
- Password hashing with bcrypt

✅ **Data Management**
- View all donors by institution
- Delete individual donor records
- Delete entire institutions (cascade deletes all related donors)
- Create additional admin accounts with equal authority

---

## 📂 File Structure

### Frontend Files (Root Directory)

#### **index.html** (176 lines)
Main website with all sections:
- Navigation bar with Home, Register, Lists, About, Admin buttons
- Home section: Awareness content, eligibility info, post-donation tips
- About section: Project mission and goals
- Register section: Donor registration form
- Lists section: Browse and search donors
- Admin section: Integrated admin panel with conditional UI

```html
Key Elements:
- form#registerForm: Collects donor information
- #searchBar: Real-time search functionality
- #admin section: Three conditional divs
  - createFirstAdmin: First admin setup form
  - adminLogin: Admin login form
  - adminPanel: Full admin dashboard
```

#### **script.js** (435 lines)
Frontend application logic:

**Data Management Functions**:
- `registerDonor()`: Submits new donor to `/api/donors`
- `loadDonors()`: Fetches all donors from backend
- `searchDonors()`: Client-side filtering
- `clearSearch()`: Reset search

**Display Functions**:
- `showSection()`: Navigate between sections
- `renderLists()`: Display institutions with donor counts
- `renderInstitutionDetails()`: Show donors by institution with blood group filters
- `filterStudents()`: Filter by blood group

**Institution Management**:
- `addInstitution()`: Create new institution
- `loadInstitutions()`: Load for admin dashboard
- `renderInstitutions()`: Display in admin panel
- `deleteInstitution()`: Remove institution (requires auth)
- `deleteDonor()`: Remove individual donor (requires auth)

**Admin Functions**:
- `checkAdminStatus()`: Determine which UI to show (create vs login)
- `createFirstAdmin()`: POST to `/api/first-admin`
- `adminLogin()`: POST to `/api/login`, stores JWT token
- `adminLogout()`: Clear session
- `createAdmin()`: POST to `/api/admins` with Bearer token
- `loadInstitutions()`: Refresh admin dashboard

**Helper Functions**:
- `showMessage()`: Display error/success messages
- `renderBloodFilters()`: Generate blood group filter buttons

**Initialization**:
```javascript
(async function init() {
    await loadDonors();
    showSection('home');
})();
```

#### **style.css** (500+ lines)
Complete styling with:
- Color scheme: Blood red (#d32f2f) as primary color
- Responsive design with mobile breakpoints
- Grid layout for institution cards
- Form styling with inputs and buttons
- Message alerts (success/error states)
- Blood group filter blocks with active states
- Institution and donor card layouts
- Smooth transitions and hover effects

### Backend Files (backend/ Directory)

#### **server.js** (216 lines)
Express.js REST API server:

**Initialization**:
```javascript
const app = express();
const PORT = 3000;
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '..')));
```

**Database Setup**:
- `initDb()`: Creates three SQLite tables on startup
- Automatic foreign key constraints
- ON DELETE CASCADE for referential integrity

**Endpoints**:

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/check-admins` | No | Returns `{adminsExist: boolean}` |
| POST | `/api/first-admin` | No | Create first admin (blocks if admins exist) |
| POST | `/api/login` | No | Authenticate and return JWT token |
| POST | `/api/admins` | Yes | Create additional admin accounts |
| GET | `/api/donors` | No | Get all donors grouped by institution |
| POST | `/api/donors` | No | Register new donor |
| POST | `/api/institutions` | No | Create new institution |
| DELETE | `/api/institutions/:institution` | Yes | Delete institution and all donors |
| DELETE | `/api/institutions/:institution/donors/:index` | Yes | Delete single donor |

**Authentication Middleware**:
```javascript
function requireAuth(req, res, next) {
    const auth = req.headers['authorization'];
    if (!auth) return res.status(401).json({ error: 'Unauthorized' });
    const parts = auth.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Unauthorized' });
    jwt.verify(parts[1], JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ error: 'Unauthorized' });
        req.admin = decoded;
        next();
    });
}
```

**Key Endpoints**:

1. **GET /api/check-admins**
   - Used by frontend to determine admin UI state
   - No authentication required
   - Returns: `{adminsExist: true/false}`

2. **POST /api/first-admin**
   - Creates first admin account during setup
   - Rejects if any admins already exist (status 403)
   - Hashes password with bcrypt (10 rounds)
   - Returns: `{message: 'First admin created'}`

3. **POST /api/login**
   - Authenticates with username/password
   - Compares with bcrypt hash
   - Returns JWT token if successful
   - Token expires in 2 hours

4. **POST /api/admins** (Requires Auth)
   - Creates additional admin accounts
   - Requires Bearer token in Authorization header
   - Same password hashing as first-admin

5. **GET /api/donors**
   - Returns nested object: `{Institution: [donors...]}`
   - Used by both clients and admins
   - Queries all institutions and their donors

6. **POST /api/donors**
   - Creates donor record
   - Auto-creates institution if doesn't exist
   - Returns: `{message: 'Donor added'}`

7. **DELETE /api/institutions/:institution** (Requires Auth)
   - Deletes institution and cascades to donors
   - Requires admin token
   - Returns: `{message: 'Deleted'}`

8. **DELETE /api/institutions/:institution/donors/:index** (Requires Auth)
   - Deletes specific donor by position within institution
   - Requires admin token
   - Returns: `{message: 'Deleted donor'}`

#### **package.json** (14 lines)
Dependency management:
```json
{
  "name": "blood-donor-finder-backend",
  "version": "1.0.0",
  "dependencies": {
    "express": "^4.18.2",
    "body-parser": "^1.20.2",
    "cors": "^2.8.5",
    "sqlite3": "^5.1.6",
    "bcrypt": "^5.1.0",
    "jsonwebtoken": "^9.0.0"
  },
  "scripts": {
    "start": "node server.js"
  }
}
```

#### **setup.js** (105 lines)
Optional database initialization script (no longer required):
- Creates database with sample data
- No longer needed as first admin is created via web UI
- Can be safely ignored

#### **data.db**
SQLite database file (auto-created):
- Created automatically on first server start
- Contains three tables: admins, institutions, donors
- Can be deleted to reset everything

---

## 🔄 Application Flow

### First-Time User Journey

```
1. User visits http://localhost:3000
   ↓
2. Homepage loads with awareness content
   ↓
3. User clicks "Register" button
   ↓
4. Fills donor registration form
   ↓
5. Submits to POST /api/donors
   ↓
6. Backend creates institution (if needed) and stores donor
   ↓
7. User clicks "Lists" to view all donors
   ↓
8. System displays institutions and donors with search/filter
```

### First-Time Admin Setup

```
1. Admin clicks "Admin" button
   ↓
2. Frontend calls GET /api/check-admins
   ↓
3. Response: {adminsExist: false}
   ↓
4. Frontend displays "Create First Admin Account" form
   ↓
5. Admin enters username and password
   ↓
6. Submits to POST /api/first-admin
   ↓
7. Backend hashes password and creates admin record
   ↓
8. Frontend shows success message
   ↓
9. Form automatically hides
   ↓
10. Admin refreshes/clicks Admin again
    ↓
11. Frontend calls GET /api/check-admins again
    ↓
12. Response: {adminsExist: true}
    ↓
13. Frontend displays login form
    ↓
14. Admin logs in with credentials
    ↓
15. JWT token stored in frontend
    ↓
16. Admin panel appears with management options
```

### Admin Workflow (After Login)

```
1. Admin logged in with JWT token
   ↓
2. Can view all institutions and donors
   ↓
3. Can delete individual donors (DELETE with auth header)
   ↓
4. Can delete entire institutions (DELETE with auth header)
   ↓
5. Can create new admin accounts (POST /api/admins with token)
   ↓
6. Can logout (clears token from frontend)
```

---

## 🔐 Security Implementation

### Password Security
- **Bcrypt Hashing**: 10-round hashing algorithm
- **Per-Password Salt**: Random salt generated for each password
- Passwords never stored in plain text
- Secure comparison with bcrypt.compare()

### Authentication
- **JWT Tokens**: Stateless session management
- **2-Hour Expiration**: Tokens automatically expire
- **Bearer Token Scheme**: Standard Authorization header
- **Token Verification**: Every protected endpoint verifies token signature

### Data Protection
- **CORS Enabled**: Controls cross-origin requests
- **Input Validation**: All endpoints validate required fields
- **Error Messages**: Intentionally generic to avoid information leakage
- **SQL Injection Prevention**: Parameterized queries with `db.run(sql, [params])`

### Database
- **Foreign Key Constraints**: Referential integrity enforced
- **Cascade Deletion**: Related records automatically deleted
- **Unique Constraints**: Prevents duplicate institutions and usernames

---

## 🚀 Deployment Architecture

### Development Locally (Current Setup)
```
User Browser
    ↓
http://localhost:3000
    ↓
Express Server (localhost:3000)
    ↓
SQLite Database (data.db)
```

### Required Components
1. **Node.js**: Runtime environment
2. **npm**: Package manager
3. **SQLite3**: Database engine
4. **Express**: Web framework
5. **All npm dependencies**: Installed via package.json

### To Run
```bash
cd backend
npm install
npm start
```

---

## 📊 Database Schema

### admins Table
```sql
CREATE TABLE admins (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE,
    password_hash TEXT
)
```

### institutions Table
```sql
CREATE TABLE institutions (
    id INTEGER PRIMARY KEY,
    name TEXT UNIQUE
)
```

### donors Table
```sql
CREATE TABLE donors (
    id INTEGER PRIMARY KEY,
    institution_id INTEGER,
    name TEXT,
    age INTEGER,
    bloodGroup TEXT,
    contact TEXT,
    address TEXT,
    FOREIGN KEY(institution_id) REFERENCES institutions(id) ON DELETE CASCADE
)
```

---

## 🔧 Configuration

### Environment Variables (Optional)
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: Secret for token signing (default: 'change-this-secret')

### For Production
```bash
PORT=8080 JWT_SECRET=your-secret-key npm start
```

---

## 📈 Scaling Considerations

### Current Limitations
- SQLite works for single-server deployments
- No built-in load balancing
- Database locks under high concurrent writes

### For Production Scaling
1. **Replace SQLite with PostgreSQL/MySQL**
2. **Add session storage (Redis)**
3. **Implement rate limiting**
4. **Add request validation library (joi)**
5. **Use environment-specific configs**
6. **Set up HTTPS/SSL**
7. **Add request logging middleware**
8. **Implement request size limits**

---

## 🎨 Customization Guide

### Change Primary Color
Edit `style.css`:
```css
/* Find and replace #d32f2f (blood red) with your color */
.btn-primary, .blood-group-block.active {
    background-color: #your-color;
}
```

### Change Server Port
```bash
PORT=8000 npm start
```

### Change JWT Expiration
Edit `server.js`:
```javascript
const token = jwt.sign({...}, JWT_SECRET, { expiresIn: '24h' }); // Change '2h' to '24h'
```

### Add New Fields to Donor Registration
1. Add input field in `index.html` form
2. Add label and input to form
3. Update `script.js` registerDonor() to collect field
4. Update database schema and backend endpoint
5. Update admin panel display to show new field

---

## ✅ Testing Checklist

- [ ] Backend server starts without errors
- [ ] Can access http://localhost:3000 in browser
- [ ] Can register a donor
- [ ] Registered donor appears in Lists
- [ ] Search functionality works
- [ ] Blood group filters work
- [ ] Can create first admin account
- [ ] Can log in with admin credentials
- [ ] Can delete donors as admin
- [ ] Can delete institutions as admin
- [ ] Can create additional admin accounts
- [ ] New admins can log in immediately
- [ ] Logout clears admin session
- [ ] All error messages display properly

---

## 📞 Support & Troubleshooting

See SETUP_GUIDE.md for detailed troubleshooting steps.

---

**Version**: 1.0.0  
**Last Updated**: February 2026  
**Status**: ✅ Production Ready (Local Development)
