# 🧠 NeuroAdapt

> **An AI-powered adaptive learning and engagement platform tailored for neurodivergent learners (ADHD, Autism Spectrum, Dyslexia).**

NeuroAdapt continuously monitors real-time behavioral telemetry (interaction cadence, task latency, window switching, retry attempts, and self-reports) to quantify learner engagement and cognitive load. When disengagement, sensory overload, or frustration is detected, NeuroAdapt triggers dynamic, personalized micro-interventions—such as content re-chunking, visual modality switching, interactive exploration, difficulty scaffolding, and timed micro-breaks.

---

## 🌟 Key Features

- **Real-Time Behavioral Telemetry**: Non-intrusive tracking of learner interactions (time on task, idle periods, retry frequency, tab/window switching).
- **Rule-Based Engagement Engine**: Quantifies engagement risk using a composite scoring model and identifies learning bottlenecks in real time.
- **Automated Dynamic Interventions**:
  - 🧩 **Re-Chunking**: Deconstructs complex questions into smaller, bite-sized sub-tasks.
  - 🎨 **Modality Switching**: Transitions seamlessly between standard text, visual diagrams, and interactive exploration modes.
  - ☕ **Micro-Breaks**: Suggests short sensory and cognitive rest intervals when high fatigue is detected.
  - 🪜 **Difficulty Scaffolding**: Steps down task complexity dynamically and introduces hints to avoid frustration.
- **Multi-Stakeholder Dashboards**:
  - **Student View**: Low-distraction, accessible task runner with progress tracking and calendar.
  - **Teacher Dashboard**: Real-time class analytics, engagement trend charts, and students needing attention.
  - **Parent Dashboard**: High-level learning summaries, intervention histories, and scheduled check-ins.
- **Secure Architecture**: Supabase JWT authentication, strict role boundaries (Student, Teacher, Parent), and PostgreSQL Row-Level Security (RLS).

---

## 🏗️ Architecture Overview

```
                                  +-----------------------------+
                                  |   NeuroAdapt Web Frontend   |
                                  |  (React 18 + Vite + TS)     |
                                  +--------------+--------------+
                                                 |
                       Telemetry Events & HTTP   |   Supabase Auth (JWT)
                                                 v
+------------------------+        +--------------+--------------+
|      Groq LLM API      |<-------|   Adaptive Tutor Backend    |
| (Content Generation &  |        |      (FastAPI + Python)     |
|   Dynamic Scaffolding) |        +--------------+--------------+
+------------------------+                       |
                                                 | SQLModel ORM
                                                 v
                                  +--------------+--------------+
                                  |     Supabase PostgreSQL     |
                                  |   (Auth, Database, RLS)     |
                                  +-----------------------------+
```

---

## 📁 Repository Structure

```
NeuroAdapt/
├── adaptive-tutor-backend/           # FastAPI backend application
│   ├── alembic/                      # Database migrations
│   ├── app/
│   │   ├── core/                     # JWT security, logging, settings
│   │   ├── db/                       # Database engine and session lifecycle
│   │   ├── models/                   # SQLModel table definitions
│   │   ├── routers/                  # API endpoints (auth, tasks, sessions, etc.)
│   │   ├── schemas/                  # Pydantic DTO request/response schemas
│   │   ├── seed/                     # Curriculum and task seeding scripts
│   │   ├── services/                 # Engagement engine, intervention orchestration
│   │   └── main.py                   # FastAPI application entry point
│   ├── tests/                        # Unit and integration test suites
│   ├── Dockerfile                    # Container definition
│   ├── requirements.txt              # Python dependencies
│   └── setup.bat / setup.sh          # Quick automated setup scripts
│
├── adaptive-tutor-frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/               # Common reusable UI components
│   │   ├── context/                  # Auth and Theme React Contexts
│   │   ├── hooks/                    # Custom hooks for telemetry, sessions, tasks
│   │   ├── routes/
│   │   │   ├── auth/                 # Login & Signup flows
│   │   │   ├── dashboard/            # Teacher, Parent, and Student dashboards
│   │   │   └── student/              # Task runner, renderers (Interactive, Visual, Text)
│   │   └── types/                    # TypeScript data type definitions
│   ├── tests/                        # Vitest unit & E2E tests
│   ├── tailwind.config.ts            # Tailwind CSS styling configuration
│   └── package.json                  # Node.js dependencies and scripts
│
└── .gitignore                        # Global repository ignore rules
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** & **npm**
- A **[Supabase](https://supabase.com/)** project (PostgreSQL database & Auth)
- *(Optional)* A **[Groq Cloud](https://groq.com/)** API Key for dynamic LLM content scaffolding

---

### 1. Backend Setup (`adaptive-tutor-backend`)

1. **Navigate to the backend directory**:
   ```bash
   cd adaptive-tutor-backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   # Windows (PowerShell)
   python -m venv venv
   .\venv\Scripts\Activate.ps1

   # macOS / Linux
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install --upgrade pip
   pip install -r requirements.txt
   ```

4. **Configure environment variables**:
   Create a `.env` file in `adaptive-tutor-backend/` based on `.env.example`:
   ```env
   ENVIRONMENT=development
   DATABASE_URL=postgresql+psycopg2://postgres.<project-ref>:<password>@<host>:6543/postgres?sslmode=require
   SUPABASE_URL=https://<your-project-id>.supabase.co
   SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-supabase-service-role-key>
   GROQ_API_KEY=<your-groq-api-key>
   ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
   ```

5. **Apply database migrations**:
   ```bash
   alembic upgrade head
   ```

6. **Seed tasks and curriculum data**:
   ```bash
   python -m app.seed.seed_tasks
   # Optionally seed Parquet-based task bank:
   python -m app.seed.seed_parquet_tasks
   ```

7. **Start the backend development server**:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```
   - API endpoints: `http://localhost:8000`
   - Interactive Swagger API docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup (`adaptive-tutor-frontend`)

1. **Navigate to the frontend directory**:
   ```bash
   cd ../adaptive-tutor-frontend
   ```

2. **Install Node dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   Create a `.env` file in `adaptive-tutor-frontend/`:
   ```env
   VITE_SUPABASE_URL=https://<your-project-id>.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   VITE_API_BASE_URL=http://localhost:8000
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```
   - Application URL: `http://localhost:5173`

---

## 🧪 Running Tests

### Backend Tests
```bash
cd adaptive-tutor-backend

# Run fast unit tests (no external database required)
pytest tests/unit

# Run integration tests (with test database active)
pytest tests/integration
```

### Frontend Tests
```bash
cd adaptive-tutor-frontend

# Run Vitest unit tests
npm run test

# Run E2E user flow tests
npm run test:e2e
```

---

## 📈 Engagement Scoring Model

The engagement engine evaluates interactions over sliding time windows:

$$\text{Risk Score} = 0.30 \times \text{Latency Ratio} + 0.25 \times \text{Switch Rate} + 0.25 \times \text{Abandonment Rate} + 0.20 \times \text{Inverse Self-Report}$$

- **Score $< 0.40$**: Normal flow — learner is attentive and engaged.
- **Score $0.40 - 0.70$**: Moderate risk — flagged for telemetry monitoring.
- **Score $> 0.70$**: High risk — automatically triggers an adaptive intervention.

---

## 🛡️ Role-Based Access Control (RBAC)

| Role | Permissions & Access Scope |
|------|-----------------------------|
| **Student** | Access assigned tasks, submit answers, log self-reports, view own progress. |
| **Teacher** | Access class-wide analytics, monitor student risk trends, manage tasks and assignments. |
| **Parent** | View designated child's high-level completion reports, engagement history, and intervention logs. |

---

## 🤝 Contributing

1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## 📝 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
