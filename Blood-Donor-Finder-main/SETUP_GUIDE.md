# Blood Donor Finder - Complete Setup Guide

## ✅ Prerequisites

Before starting, you must have **Node.js** installed on your computer.

### Install Node.js (if not already installed)
1. Download Node.js from: https://nodejs.org/
2. Choose the **LTS (Long Term Support)** version
3. Run the installer and follow the steps
4. **Restart your computer** after installation
5. Open a new terminal/PowerShell window to verify installation:
   ```bash
   node --version
   npm --version
   ```

---

## 🚀 Quick Start (3 Steps)

### Step 1: Install Backend Dependencies
Open PowerShell and navigate to the backend folder:
```bash
cd "c:\Users\NITHIN T\Downloads\Blood-Donor-Finder-Website-main\Blood-Donor-Finder-Website-main\backend"
npm install
```
Wait for installation to complete (this may take 1-2 minutes).

### Step 2: Start the Backend Server
In the same backend folder, run:
```bash
npm start
```

> To reset the database (and reseed sample donors) delete `backend/data.db` and run the
> setup script again:
>
> ```bash
> cd backend
> rm data.db        # or PowerShell: Remove-Item data.db
> node setup.js
> ```


You should see:
```
Server running on http://localhost:3000
```

**IMPORTANT:** Keep this terminal window open! The server must be running for the website to work.

### Step 3: Access the Website
Open your web browser and go to:
```
http://localhost:3000
```

> **Note:** The site assumes the backend API runs on port 3000. If you serve the static files using a tool like **VSCode Live Server** (commonly on port 5500), the JavaScript automatically proxies requests to `http://localhost:3000`. You still must start the backend as described above; simply opening the HTML files alone will not provide the API endpoints.


---

## 📋 Admin Setup (First Time Only)

When you first visit the Admin section:

1. **Click "Admin"** button in the navigation
2. You'll see **"Create First Admin Account"** form
3. Enter a **username** and **password** (any values you choose)
4. Click **"Create Admin Account"**
5. You'll see success message ✓
6. Click Admin again and log in with your credentials
7. Now you have full admin access to manage donors and institutions

---

## 🎯 Features Guide

### For Regular Users
- **Register as Donor**: Enter institution, name, age, blood group, contact, address
- **View Donor Lists**: Browse all registered donors by institution
- **Search Functionality**: Find donors by institution or name
- **Filter by Blood Group**: View specific blood types within each institution

### For Administrators
- **Login**: Access admin panel via the Owner Panel button on the main site
- **Manage Institutions**: Delete institutions (cascade deletes all donors from it)
- **Manage Donors**: Delete individual donor records
- **Create More Admins**: Add additional administrators without needing setup scripts

---

## 🔧 Troubleshooting

### Error: "npm: The term 'npm' is not recognized"
**Solution**: You haven't installed Node.js yet. Download and install from https://nodejs.org/, then restart your terminal.

### Error: "Unexpected end of JSON input"
**Solution**: Make sure the backend server is running (terminal shows "Server running on http://localhost:3000")

### Error: "Cannot find module"
**Solution**: Run `npm install` in the backend folder again to install all dependencies.

### Server crashes on startup
**Solution**: The database file may be corrupted. Delete the `backend/data.db` file and restart the server:
```bash
Remove-Item "c:\Users\NITHIN T\Downloads\Blood-Donor-Finder-Website-main\Blood-Donor-Finder-Website-main\backend\data.db"
npm start
```

### Can't log in as admin
**Solution**: If you forgot the password, delete the database file as shown above and create a new admin account.

---

## 📁 Project Structure

```
Blood-Donor-Finder-Website-main/
├── index.html              (Single-page frontend – includes owner/admin dashboard)
├── script.js               (Frontend logic)
├── style.css               (Styling)
├── SETUP_GUIDE.md          (This file)
├── README.md               (Project documentation)
└── backend/
    ├── server.js           (Express API server)
    ├── package.json        (Dependencies list)
    ├── data.db             (Auto-created database)
    └── node_modules/       (Auto-created after npm install)
```

---

## 🌐 API Endpoints

The backend provides these REST API endpoints:

| Method | Endpoint | Auth Required | Purpose |
|--------|----------|---------------|---------|
| GET | `/api/check-admins` | No | Check if any admins exist |
| POST | `/api/first-admin` | No | Create first admin account |
| POST | `/api/login` | No | Admin login, returns JWT token |
| POST | `/api/admins` | Yes | Create additional admin accounts |
| GET | `/api/donors` | No | Get all donors by institution |
| POST | `/api/donors` | No | Register new donor |
| POST | `/api/institutions` | No | Create new institution |
| DELETE | `/api/institutions/:name` | Yes | Delete institution |
| DELETE | `/api/institutions/:name/donors/:index` | Yes | Delete specific donor |

---

## 💾 Database Information

The system uses **SQLite** (file-based database):

### Tables
- **admins**: Stores admin credentials (username, hashed password)
- **institutions**: Stores institution/college names
- **donors**: Stores donor information with reference to institutions

### Database File
- Location: `backend/data.db`
- Auto-created on first server start
- You can delete it to reset everything and start fresh

---

## 🔒 Security Notes

- **Passwords**: Hashed with bcrypt (10 rounds) before storage
- **Authentication**: JWT tokens valid for 2 hours
- **All Admin Operations**: Require Bearer token authentication
- **Public Operations**: Anyone can register donors or view lists

---

## ⚡ Performance Tips

- Keep the backend server running in a dedicated terminal
- For production use, consider using environment variables for JWT_SECRET
- The database is stored locally; for multi-user setup, move to PostgreSQL/MySQL

---

## ❓ Support

If you encounter any issues:
1. Check the console (F12 in browser) for error messages
2. Check the terminal where server is running for backend errors
3. Verify Node.js is properly installed
4. Try deleting `backend/data.db` and restarting the server

---

**Congratulations!** Your Blood Donor Finder website is now ready to use! 🎉
