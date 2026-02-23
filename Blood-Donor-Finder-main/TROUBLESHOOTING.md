# Troubleshooting Guide - Blood Donor Finder Backend

## Problem: npm is not running

### ✅ **SOLUTION 1: Check if Node.js is Installed**

**Step 1:** Open Command Prompt or PowerShell and run:
```
node --version
```

**Expected Output:**
```
v16.0.0  (or any version v14 and above)
```

**If you see an error like "node is not recognized":**
- **Node.js is NOT installed**
- Go to https://nodejs.org/
- Download the LTS version (Long Term Support)
- Run the installer and follow the steps
- **Restart Command Prompt after installation**

---

### ✅ **SOLUTION 2: Check if npm is Installed**

**Step 1:** Open Command Prompt and run:
```
npm --version
```

**Expected Output:**
```
8.0.0  (or any version)
```

**If you see an error like "npm is not recognized":**
- npm should be installed with Node.js
- Try reinstalling Node.js from https://nodejs.org/

---

### ✅ **SOLUTION 3: Clear npm Cache and Reinstall**

**If npm is installed but not working:**

**Step 1:** Open Command Prompt as Administrator
- Right-click on Command Prompt
- Select "Run as administrator"

**Step 2:** Clear npm cache:
```
npm cache clean --force
```

**Step 3:** Navigate to backend folder:
```
cd "C:\Users\DELL\Desktop\my vs\Blood donor finder\Blood-Donor-Finder-main\backend"
```

**Step 4:** Delete node_modules (if it exists):
```
rmdir /s /q node_modules
```

**Step 5:** Delete package-lock.json:
```
del package-lock.json
```

**Step 6:** Reinstall dependencies:
```
npm install
```

**Step 7:** Run setup:
```
node setup.js
```

**Step 8:** Start server:
```
npm start
```

---

### ✅ **SOLUTION 4: Use Alternative - No npm Needed!**

If npm still doesn't work, you can run the server WITHOUT npm:

**Step 1:** Navigate to backend folder:
```
cd "C:\Users\DELL\Desktop\my vs\Blood donor finder\Blood-Donor-Finder-main\backend"
```

**Step 2:** Initialize database directly:
```
node setup.js
```

**Step 3:** Start server directly:
```
node server.js
```

---

### ✅ **SOLUTION 5: Use VS Code Terminal**

Instead of Command Prompt, use VS Code's built-in terminal:

**Step 1:** Open VS Code
**Step 2:** Open the project folder
**Step 3:** Press `Ctrl + ~` to open terminal
**Step 4:** Run:
```
cd backend
npm install
node setup.js
npm start
```

---

### ✅ **SOLUTION 6: Check Path Issues**

If you're getting "path too long" or similar errors:

**Step 1:** The path has spaces in it:
```
C:\Users\DELL\Desktop\my vs\Blood donor finder\Blood-Donor-Finder-main\backend
                              ^^  ^^       ^^           ^^            ^^
```

**Solution:** Rename folder to remove spaces:
- Rename "my vs" to "my_vs"
- Rename "Blood donor finder" to "blood-donor-finder"

Then try again:
```
cd "C:\Users\DELL\Desktop\my_vs\blood-donor-finder\Blood-Donor-Finder-main\backend"
npm install
npm start
```

---

### ✅ **SOLUTION 7: Antivirus/Firewall Blocking npm**

**If npm hangs or stalls:**

**Step 1:** Temporarily disable antivirus
**Step 2:** Temporarily disable Windows Defender
**Step 3:** Run:
```
npm install
```

**Step 4:** Re-enable antivirus/firewall

---

### ✅ **SOLUTION 8: Nuclear Option - Complete Clean Install**

**If nothing works:**

**Step 1:** Uninstall Node.js
- Go to Control Panel > Programs and Features
- Find "Node.js"
- Click Uninstall

**Step 2:** Completely remove npm cache:
```
rmdir /s /q %AppData%\npm
rmdir /s /q %AppData%\npm-cache
```

**Step 3:** Reinstall Node.js from https://nodejs.org/
- Download LTS version
- During install, let it set PATH automatically
- Choose default options

**Step 4:** Restart computer

**Step 5:** Try again:
```
cd "C:\Users\DELL\Desktop\my vs\Blood donor finder\Blood-Donor-Finder-main\backend"
npm install
npm start
```

---

## ✅ **Quick Test - Is Everything Working?**

After running `npm start`, you should see:
```
Server running on http://localhost:3000
```

Then:
1. Open browser
2. Go to http://localhost:3000
3. Click "Owner Panel"
4. Login with:
   - Username: MITHUN M
   - Password: BABBLU0124

---

## ❓ Still Not Working?

Try this diagnostic command:
```
npm list
```

Copy the output and check it for errors.

Or use direct node commands:
```
cd "C:\Users\DELL\Desktop\my vs\Blood donor finder\Blood-Donor-Finder-main\backend"
node server.js
```

This will run the server WITHOUT npm and show you the actual error.

---

## 📞 Common Errors and Fixes

**Error:** "npm: command not found"
- **Fix:** Node.js not installed. Install from nodejs.org

**Error:** "Cannot find module 'express'"
- **Fix:** Run `npm install` in backend folder

**Error:** "Port 3000 already in use"
- **Fix:** Change PORT in server.js or kill process using port 3000

**Error:** "SQLITE_CANTOPEN"
- **Fix:** Run `node setup.js` to initialize database

---

## ✅ Final Checklist

- [ ] Node.js installed (check: `node --version`)
- [ ] npm working (check: `npm --version`)
- [ ] In backend folder (check path)
- [ ] Run `npm install`
- [ ] Run `node setup.js`
- [ ] Run `npm start` (or `node server.js`)
- [ ] See "Server running on http://localhost:3000"
- [ ] Visit http://localhost:3000
- [ ] Click "Owner Panel"
- [ ] Login works

Good luck! 🚀
