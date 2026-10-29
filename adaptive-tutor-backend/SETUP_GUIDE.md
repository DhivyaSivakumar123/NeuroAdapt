# 🛠️ Clarity Backend Setup Guide

This guide walks you through setting up, configuring, migrating, and running the **Clarity Adaptive Learning Backend API**.

---

## 📋 Prerequisites
- **Python 3.11 or 3.12+**
- **Git**
- A **Supabase project** (PostgreSQL database & Auth)

---

## ⚡ Quick Start (Automated Script)

### Windows
Double-click `setup.bat` or run in terminal:
```cmd
setup.bat
```

### macOS / Linux
Run in terminal:
```bash
chmod +x setup.sh start.sh
./setup.sh
```

The script automatically:
1. Creates a Python virtual environment (`venv`).
2. Installs all required dependencies from `requirements.txt`.
3. Sets up `.env` from `.env.example`.
4. Runs database migrations via `alembic upgrade head`.
5. Seeds initial adaptive tasks and curriculum via `python -m app.seed.seed_tasks`.

---

## ⚙️ Manual Step-by-Step Setup

### 1. Create Virtual Environment & Install Dependencies
```bash
# Create venv
python -m venv venv

# Activate venv:
# Windows (PowerShell/CMD):
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Upgrade pip & install dependencies
pip install --upgrade pip
pip install -r requirements.txt
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in the `backend/` directory:
```env
ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg2://postgres.[YOUR-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=require
SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
SUPABASE_SERVICE_ROLE_KEY=[YOUR-SUPABASE-SERVICE-ROLE-KEY]
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
```

### 3. Run Database Migrations
Apply all schema tables (`profiles`, `students`, `student_teacher`, `tasks`, `sessions`, `telemetry_events`, `interventions`, `self_reports`):
```bash
alembic upgrade head
```

### 4. Seed Initial Tasks and Curriculum
Populate the database with author-crafted tasks across ADHD, Dyslexia, Autism, and standard learning tracks:
```bash
python -m app.seed.seed_tasks
```

### 5. Start the Backend API Server
```bash
# Windows quick runner:
start.bat

# Or direct uvicorn command:
uvicorn app.main:app --reload --port 8000
```
- API Base URL: `http://localhost:8000`
- Interactive OpenAPI Docs: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`
