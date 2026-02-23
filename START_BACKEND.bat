@echo off
REM Blood Donor Finder - Backend Startup Script
REM This script will set up and start the backend server

echo.
echo ========================================
echo   Blood Donor Finder - Backend Setup
echo ========================================
echo.

REM Navigate to backend folder
cd backend

REM Check if node_modules exists
if not exist node_modules (
    echo Installing dependencies... (this may take a minute)
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: npm install failed
        echo Please ensure Node.js is installed: https://nodejs.org/
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependencies installed successfully!
    echo.
)

REM Check if database exists
if not exist data.db (
    echo Initializing database...
    echo.
    call node setup.js
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Database setup failed
        pause
        exit /b 1
    )
    echo.
    echo ✅ Database initialized with default admin account!
    echo    Username: MITHUN M
    echo    Password: BABBLU0124
    echo.
)

REM Start the server
echo Starting backend server...
echo.
call npm start
