@echo off
REM Blood Donor Finder - Simple Backend Startup
REM This version avoids sqlite3 build issues

echo.
echo ========================================
echo   Blood Donor Finder - Backend Setup
echo ========================================
echo.

cd backend

REM Check if node_modules exists
if not exist node_modules (
    echo Installing minimal dependencies...
    echo.
    call npm install express cors body-parser bcrypt jsonwebtoken
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: npm install failed
        echo Try running as Administrator
        pause
        exit /b 1
    )
    echo.
    echo ✅ Dependencies installed!
    echo.
)

REM Start the simple server
echo Starting backend server...
echo.
call node simple-server.js
