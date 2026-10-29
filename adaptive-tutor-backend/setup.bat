@echo off
echo ===================================================
echo   Clarity Adaptive Learning - Backend Quick Setup
echo ===================================================
echo.

:: 1. Check Python installation
python --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Python is not installed or not in PATH.
    echo Please install Python 3.11 or 3.12 and retry.
    pause
    exit /b 1
)

:: 2. Create Virtual Environment if not exists
if not exist "venv" (
    echo [1/5] Creating Python virtual environment (venv)...
    python -m venv venv
) else (
    echo [1/5] Virtual environment (venv) already exists.
)

:: 3. Activate Virtual Environment
echo [2/5] Activating virtual environment...
call venv\Scripts\activate.bat

:: 4. Install Dependencies
echo [3/5] Installing dependencies from requirements.txt...
python -m pip install --upgrade pip
pip install -r requirements.txt

:: 5. Setup .env file if missing
if not exist ".env" (
    echo [4/5] Creating .env from .env.example...
    copy .env.example .env
    echo [WARNING] Please update .env with your Supabase database and API credentials!
) else (
    echo [4/5] .env file found.
)

:: 6. Run Alembic Database Migrations
echo [5/5] Running database migrations (alembic upgrade head)...
alembic upgrade head
if %ERRORLEVEL% NEQ 0 (
    echo [WARNING] Database migration encountered an issue. Check your DATABASE_URL in .env.
) else (
    echo [SUCCESS] Database migrations completed.
)

:: 7. Seed Tasks and Curriculum Data
echo Seeding initial learning tasks and curriculum into database...
python -m app.seed.seed_tasks

echo.
echo ===================================================
echo   Backend Setup Complete!
echo   To start the backend server, run:
echo     start.bat   OR   uvicorn app.main:app --reload --port 8000
echo ===================================================
echo.
pause
