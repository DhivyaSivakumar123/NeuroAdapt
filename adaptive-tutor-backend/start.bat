@echo off
echo Starting Clarity Backend Server...
if exist "venv\Scripts\activate.bat" (
    call venv\Scripts\activate.bat
)
uvicorn app.main:app --reload --port 8000
pause
