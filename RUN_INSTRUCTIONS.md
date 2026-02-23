Run instructions — Blood Donor Finder
=================================

Quick steps to run the site locally (static front-end) and the optional Node backend.

1) Serve the front-end (recommended: VS Code Live Server)

- Option A — VS Code Live Server extension (click "Go Live")

- Option B — simple Python HTTP server (works on Windows with Python installed):

```bash
cd "c:/Users/DELL/Desktop/my vs/Blood donor finder/Blood-Donor-Finder-main"
python -m http.server 5500
```

Then open http://localhost:5500 (or the port Live Server uses).

2) Optional: Start the backend (for API features)

The backend lives in the `backend` folder. If you plan to use API features, start it.

```bash
cd "c:/Users/DELL/Desktop/my vs/Blood donor finder/Blood-Donor-Finder-main/backend"
npm install
node setup.js    # run once to initialize local DB/data (optional)
npm start        # or run START_SERVER.bat on Windows
```

By default the front-end will try to reach `http://localhost:3000` for API calls (Live Server often runs on 5500). If the backend is not running, the site works fully offline using `localStorage`.

3) Useful shortcuts and notes

- Owner/Admin panel: open the site and click "Admin Login" or the footer link. Default credentials (offline):

  Username: MITHUN M
  Password: BABBLU0124

- To reset sample data or clear local state, open browser DevTools → Application → Local Storage and remove `bloodDonorInstitutions`, `bloodDonorAdmins`, `authToken`, `manualMode`, or simply clear site storage.

- If images appear missing, the front-end hides broken images automatically. To add your own images, place them in the project root and update `index.html` image filenames.

4) Troubleshooting

- If navigation or functionality does not work, open DevTools Console (F12) and share errors with me.
- For CORS or network errors while calling the backend, ensure the backend is running on port 3000 and that your browser allows requests from the front-end origin.

That's it — the site is ready to run on Live Server and also works offline using localStorage.
