@echo off
echo ===================================================
echo   Clarity Adaptive Learning - Frontend Quick Setup
echo ===================================================
echo.

:: 1. Check Node.js
node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 18+ from https://nodejs.org and retry.
    pause
    exit /b 1
)

:: 2. Setup .env if missing
if not exist ".env" (
    echo [1/3] Creating .env from .env.example...
    if exist ".env.example" (
        copy .env.example .env
    ) else (
        echo VITE_SUPABASE_URL=https://your-project.supabase.co > .env
        echo VITE_SUPABASE_ANON_KEY=your-anon-key >> .env
        echo VITE_API_URL=http://localhost:8000/api >> .env
    )
    echo [WARNING] Please update .env with your Supabase credentials!
) else (
    echo [1/3] .env file found.
)

:: 3. Install dependencies
echo [2/3] Installing frontend dependencies via npm...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)

:: 4. Verify test suite
echo [3/3] Running tests to verify installation...
call npm test

echo.
echo ===================================================
echo   Frontend Setup Complete!
echo   To start development server, run:
echo     start.bat   OR   npm run dev
echo ===================================================
echo.
pause
