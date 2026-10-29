#!/usr/bin/env bash
echo "Starting Clarity Backend Server..."
if [ -d "venv" ]; then
    source venv/bin/activate
fi
uvicorn app.main:app --reload --port 8000
