@echo off
REM Setup script for Windows
REM This script automates the setup process

echo ========================================
echo Django + React Project Setup (Windows)
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.11+ from https://www.python.org/
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

echo [1/6] Creating Python virtual environment...
python -m venv venv
if errorlevel 1 (
    echo ERROR: Failed to create virtual environment
    pause
    exit /b 1
)

echo [2/6] Activating virtual environment...
call venv\Scripts\activate.bat
if errorlevel 1 (
    echo ERROR: Failed to activate virtual environment
    pause
    exit /b 1
)

echo [3/6] Installing Python dependencies...
pip install -r requirements.txt
if errorlevel 1 (
    echo ERROR: Failed to install Python dependencies
    pause
    exit /b 1
)

echo [4/6] Checking if .env file exists...
if not exist .env (
    echo Creating .env from .env.example...
    copy .env.example .env
    echo NOTE: Please edit .env with your configuration!
)

echo [5/6] Running Django migrations...
python manage.py migrate
if errorlevel 1 (
    echo ERROR: Migration failed
    pause
    exit /b 1
)

echo [6/6] Installing Node dependencies...
cd frontend
call npm install
if errorlevel 1 (
    echo ERROR: Failed to install Node dependencies
    cd ..
    pause
    exit /b 1
)
cd ..

echo.
echo ========================================
echo Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Edit .env file with your configuration
echo 2. Create superuser: python manage.py createsuperuser
echo 3. Run Backend: python manage.py runserver
echo 4. Run Frontend: cd frontend && npm start
echo.
pause
