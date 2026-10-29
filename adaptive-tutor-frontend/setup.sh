#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  Clarity Adaptive Learning - Frontend Quick Setup"
echo "==================================================="
echo ""

# 1. Check Node.js
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed or not in PATH."
    exit 1
fi

# 2. Environment file
if [ ! -f ".env" ]; then
    echo "[1/3] Creating .env from .env.example..."
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo "VITE_SUPABASE_URL=https://your-project.supabase.co" > .env
        echo "VITE_SUPABASE_ANON_KEY=your-anon-key" >> .env
        echo "VITE_API_URL=http://localhost:8000/api" >> .env
    fi
    echo "[WARNING] Please check and update .env with your Supabase credentials!"
else
    echo "[1/3] .env file found."
fi

# 3. Install dependencies
echo "[2/3] Installing dependencies with npm install..."
npm install

# 4. Verify test suite
echo "[3/3] Running tests to verify installation..."
npm test

echo ""
echo "==================================================="
echo "  Frontend Setup Complete!"
echo "  To start the application, run:"
echo "    ./start.sh   OR   npm run dev"
echo "==================================================="
