#!/usr/bin/env bash
set -e

echo "==================================================="
echo "  Clarity Adaptive Learning - Backend Quick Setup"
echo "==================================================="
echo ""

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python 3 is not installed or not in PATH."
    exit 1
fi

# 2. Virtual Environment
if [ ! -d "venv" ]; then
    echo "[1/5] Creating Python virtual environment (venv)..."
    python3 -m venv venv
else
    echo "[1/5] Virtual environment (venv) already exists."
fi

# 3. Activate Virtual Environment
echo "[2/5] Activating virtual environment..."
source venv/bin/activate

# 4. Install Dependencies
echo "[3/5] Installing dependencies from requirements.txt..."
pip install --upgrade pip
pip install -r requirements.txt

# 5. Environment File
if [ ! -f ".env" ]; then
    echo "[4/5] Creating .env from .env.example..."
    cp .env.example .env
    echo "[WARNING] Please check and update .env with your Supabase database and API keys!"
else
    echo "[4/5] .env file found."
fi

# 6. Database Migrations
echo "[5/5] Running database migrations (alembic upgrade head)..."
alembic upgrade head || echo "[WARNING] Check DATABASE_URL in .env if migration failed."

# 7. Seed Tasks
echo "Seeding initial learning tasks and curriculum into database..."
python -m app.seed.seed_tasks || echo "[WARNING] Seeding failed. Check database connection."

echo ""
echo "==================================================="
echo "  Backend Setup Complete!"
echo "  To start the server, run:"
echo "    ./start.sh   OR   uvicorn app.main:app --reload --port 8000"
echo "==================================================="
