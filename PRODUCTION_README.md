# Blood Donor Finder — Production / Run Instructions

This document explains how to run the site locally in a production-like setup and includes quick security and deployment notes.

## Prerequisites
- Node.js 16+ (for backend)
- npm (bundled with Node.js)
- Optional: Python 3 (for a quick static server)

## Quick Local Run (frontend only)
If you only want to serve the static frontend (no backend API required):

PowerShell:
```powershell
# serve current folder on port 5500
python -m http.server 5500
# open http://localhost:5500
```

Alternatively, use the VS Code _Live Server_ extension and click **Go Live**.

Note: some features (API-backed registration, JWT auth) require the backend server to be running (see below).

## Start the Backend (API)
1. Open a terminal and change into the `backend` folder:

```powershell
cd backend
npm install
```

2. Initialize the database (one-time):

```powershell
node setup.js
```

3. Start the server:

```powershell
npm start
# backend listens on http://localhost:3000 by default
```

4. Open the site in your browser at `http://localhost:3000` (the backend serves the static frontend by default).

## Environment / Configuration
- `PORT` — port for the backend (default 3000)
- `JWT_SECRET` — change this in production; do not use the default value.

Set environment variables in your hosting environment or in a `.env` file (if you add dotenv). Do not commit secrets.

## Default Admin Credentials (development only)
- Username: `MITHUN M`
- Password: `BABBLU0124`

Change the default admin password before exposing the site publicly.

## Security & Production Tips
- Replace the default `JWT_SECRET` with a strong random secret.
- Serve the app behind HTTPS (use a reverse proxy like nginx or a hosting provider that provides TLS).
- Do not embed default credentials in public repos.
- Regularly back up `backend/data.db` (SQLite file) or migrate to a managed DB for production.

## Troubleshooting
- If the frontend shows no data, ensure the backend is running and reachable at `http://localhost:3000`.
- Clear browser storage (DevTools → Application → Local Storage) if stale sample data causes issues.

## Deploying to a Production Host
For simple deployments:
- Build a small server (Express or nginx) to serve the static files and proxy `/api` requests to the Node backend.
- Use a process manager such as `pm2` or run the backend as a systemd service.

## Where to Look Next
- Frontend: `index.html`, `script.js`, `style.css`
- Backend: `backend/server.js`, `backend/simple-server.js`

If you want, I can also create a small `start.ps1` script that launches both the frontend static server and the backend for local testing.

---
© 2026 Blood Donor Finder
