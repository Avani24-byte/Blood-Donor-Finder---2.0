# Blood Donor Finder

## Overview
Blood Donor Finder is a web-based platform that connects voluntary blood donors with people and institutions in need. The project now includes both a **client-facing interface** and a **backend server** for persistent storage, along with an **owner/admin dashboard**.

## Features
- **Home Section**: Information about blood donation and eligibility.
- **Register**: Users can sign up as donors; data is sent to the backend.
- **Donor Lists**: Browse donors by institution with search and filters.
- **Institution Details**: View donor details and filter by blood group.
- **Admin Panel**: Owners can log in to manage institutions and donors. (Now accessible directly from the main navigation.)

## Project Structure
```
Blood-Donor-Finder-Website-main/
├── backend/                # Node.js server code and SQLite database
│   ├── package.json
│   ├── server.js           # Express application
│   └── data.db             # SQLite database file (auto‑created)
├── index.html              # Single-page frontend (includes owner/admin dashboard)
├── script.js               # Frontend logic (all features combined)
├── style.css               # Shared stylesheet
└── README.md               # Documentation (this file)
```

## Backend Setup (Owner/Developer)
1. Make sure Node.js (v16+) is installed.
2. Open a terminal and navigate to `backend` folder:
   ```bash
   cd backend
   npm install
   ```
3. **Seed default admin accounts** (recommended on first setup):
   ```bash
   node setup.js
   ```
   This creates the database tables, populates default admin accounts, and adds a couple of
   sample institutions/donors so the admin dashboard isn’t empty on first visit.
4. Start the server:
   ```bash
   npm start
   ```
5. The server will listen on http://localhost:3000 and serve the static frontend files as well as API routes.

## Client Usage (Everyone)
1. Open a browser and navigate to `http://localhost:3000` (assuming the backend is running).
   - If you prefer to use a static file server such as **VSCode Live Server** (which serves pages on a port like 5500), it's fine – the frontend script will automatically send API requests to `http://localhost:3000`. Just make sure the backend is started first. Opening the HTML files directly with `file://` will not work for any feature that talks to the server.
2. Browse sections using the navigation buttons. A dedicated **Owner Panel** button in the header will open the integrated admin login/dashboard section.
3. Register a donor—information is sent to the server if you're logged in. If you're offline or not authenticated, the details are stored locally and will appear in the lists immediately; they will sync with the backend once you sign in.
4. View and search lists; results reflect backend data plus any locally cached entries.

## Admin Dashboard (Owner)

### Default Admin Credentials
The system comes with a **pre-configured admin account**. Use it to log in:

| Username | Password |
|----------|----------|
| `MITHUN M` | `BABBLU0124` |

### Using the Admin Panel
1. Click the **Owner Panel** button to open the admin section within the same page.
2. **First-time users**: If no admin accounts exist, you'll see a **"Create Your Admin Account"** form.
   - Enter a username and password and click **Create Admin Account**.
   - You will be automatically logged in and can manage data immediately.
3. **Regular login**: If admin accounts already exist, enter your username and password to log in.
4. Once logged in to the **Admin Dashboard**, you can:
   - **View all institutions and their registered donors** in a clean list format; counts are shown alongside the name.
   - **Delete institutions** - click the Delete button next to any institution (confirmation required).
   - **Delete individual donors** - each donor entry has an "x" button to remove it permanently.
   - **Create additional admin accounts** - use the "Create New Admin Account" section at the bottom.
   - **Manage data without page refreshes** - all deletions use AJAX for a smooth experience.
   - **Logout** - click the Logout button to securely exit.

### Admin Features
- ✅ Delete entire institutions (cascades to delete all associated donors)
- ✅ Delete specific donors from any institution
- ✅ Create new admin accounts (requires existing authentication)
- ✅ Protected endpoints (JWT token-based authentication)
- ✅ No page refresh on data changes (AJAX-based)
- ✅ Confirmation dialogs before destructive actions

## Technology Stack
- **Node.js + Express** – backend server and REST API.
- **SQLite database** – lightweight, file‑based persistence for donor records.
- **HTML/CSS/JavaScript** – frontend user interface.
- **bcrypt** – password hashing for admin accounts.
- **JWT** – token-based authentication for protected routes.

## Quick Start (Admin Access)
```bash
# Setup
cd backend
npm install
node setup.js
npm start

# Then visit
# Site (all features): http://localhost:3000
# Login to owner panel using the Owner Panel button
# Default admin login: MITHUN M / BABBLU0124
```

## Browser Support
Chrome, Firefox, Safari, Edge (modern versions).

## Data Storage
Donor data is stored on the server in a SQLite file `backend/data.db`. The schema is automatically created; you can back up this file or migrate to another database if needed.

## Future Improvements
- Use the SQLite database or migrate to a server-grade system (PostgreSQL, MongoDB, etc.) in the future.
- Add proper authentication and user accounts.
- Provide editing functionality for donors from the client.

## Copyright
© 2026 Blood Donor Finder. Saving Lives, One Donation at a Time.
