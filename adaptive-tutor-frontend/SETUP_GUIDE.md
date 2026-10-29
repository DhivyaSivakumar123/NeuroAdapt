# 🎨 Clarity Frontend Setup Guide

This guide walks you through setting up, configuring, and running the **Clarity Adaptive Learning Frontend Web Application**.

---

## 📋 Prerequisites
- **Node.js 18+ or 20+**
- **npm** (comes with Node.js)
- **Clarity Backend API** running at `http://localhost:8000`

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
1. Verifies Node.js installation.
2. Creates `.env` from `.env.example` if missing.
3. Installs all frontend dependencies via `npm install`.
4. Runs unit and integration test suite (`npm test`).

---

## ⚙️ Manual Step-by-Step Setup

### 1. Install Node Dependencies
```bash
npm install
```

### 2. Configure Environment Variables (`.env`)
Create a `.env` file in `frontend/`:
```env
VITE_SUPABASE_URL=https://[YOUR-PROJECT-ID].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR-SUPABASE-ANON-KEY]
VITE_API_URL=http://localhost:8000/api
```

### 3. Run Automated Tests
```bash
npm test
```

### 4. Start Development Server
```bash
# Windows quick runner:
start.bat

# Or direct npm command:
npm run dev
```
- App URL: `http://localhost:5173`

### 5. Build for Production
```bash
npm run build
```
The optimized bundle will be compiled into the `dist/` directory.
