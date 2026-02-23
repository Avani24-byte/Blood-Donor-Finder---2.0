@echo off
REM Blood Donor Finder - Quick Start Script for Windows

echo.
echo ===============================================
echo   Blood Donor Finder - Backend Server
echo ===============================================
echo.

REM Check if Node.js is installed
echo [1/4] Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is NOT installed!
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo 1. Download the LTS version
    echo 2. Run the installer
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do echo   Found Node.js: %%i

REM Check if npm is installed
echo.
echo [2/4] Checking if npm is installed...
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm is NOT installed!
    echo.
    echo Please reinstall Node.js from: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('npm --version') do echo   Found npm: %%i

REM Install dependencies
echo.
echo [3/4] Installing dependencies (may take a minute)...
call npm install
if %errorlevel% neq 0 (
    echo.
    echo ERROR: npm install failed!
    echo.
    echo Try running as Administrator:
    echo - Right-click Command Prompt
    echo - Select "Run as Administrator"
    echo - Remove node_modules folder: rmdir /s /q node_modules
    echo - Remove package-lock.json: del package-lock.json
    echo - Try again: npm install
    echo.
    pause
    exit /b 1
)

REM Initialize database
echo.
echo [4/4] Initializing database...
call node setup.js
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Database setup failed!
    echo.
    pause
    exit /b 1
)

REM Start server
echo.
echo ===============================================
echo   Starting Server...
echo ===============================================
echo.
echo Server will run on: http://localhost:3000
echo.
echo KEEP THIS WINDOW OPEN while using the app!
echo.
echo To stop the server: Press Ctrl+C
echo.
echo ===============================================
echo.

call npm start
