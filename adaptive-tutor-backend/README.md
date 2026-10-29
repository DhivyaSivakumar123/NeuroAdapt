# Adaptive Tutoring System — Backend (`adaptive-tutor-backend`)

FastAPI + PostgreSQL (Supabase) backend powering **NeuroAdapt**, an adaptive tutoring system for neurodivergent learners.
Detects engagement patterns from real-time behavioral signals and responds with targeted interventions.

## Quick Start

### Prerequisites
- Python 3.11+
- Supabase project or PostgreSQL instance
- Docker (optional, for local integration test database)

### Setup
```bash
# Clone and enter directory
cd adaptive-tutor-backend

# Create virtual environment
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY

# Run database migrations
alembic upgrade head

# Seed initial curriculum and tasks
python -m app.seed.seed_tasks

# Optionally seed Parquet-extracted tasks
python -m app.seed.seed_parquet_tasks

# Run the server
uvicorn app.main:app --reload --port 8000
# Interactive docs available at: http://localhost:8000/docs
```

## Running Tests

### Unit tests (isolated, fast, no external DB needed)
```bash
pytest tests/unit
```

### Integration tests (requires Docker Postgres test DB)
```bash
# Start test DB container
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
pytest tests/integration
```

## Architecture

```
app/
  main.py              FastAPI app, middleware, router mounting, static files
  config.py            Pydantic Settings (environment variables)
  deps.py              FastAPI dependencies: get_db, get_current_user, require_role
  core/
    security.py        Supabase JWT verification and auth helpers
    logging.py         Structured logging configuration
  models/              SQLModel table definitions
  schemas/             Pydantic request/response DTOs
  routers/             API routers (auth, dashboard, engagement, events, interventions, sessions, tasks)
  services/
    task_service.py          Task CRUD and sequencing
    engagement_engine.py     Rule-based engagement risk scoring
    intervention_engine.py   Intervention triggers and orchestration
    content_generator.py     Groq API wrapper for scaffolding and re-chunking
    dashboard_service.py     Student, parent, and teacher analytics queries
  seed/                Task seeding scripts and curriculum datasets
```

## Engagement Engine

Composite risk score formula:
```
score = 0.30 × latency_ratio + 0.25 × switch_rate + 0.25 × abandonment + 0.20 × inverse_self_report
```

Thresholds:
- `> 0.70` → Trigger automated intervention
- `0.40 – 0.70` → Flag for continuous telemetry monitoring
- `< 0.40` → Normal learning flow (no action)

## Interventions

| Type | Trigger Condition | Adaptation Strategy |
|------|-------------------|---------------------|
| `re_chunk` | High latency + high switch rate | Deconstruct task into bite-sized steps |
| `modality_switch` | High retry + moderate latency | Switch modality (text ↔ visual diagram ↔ interactive) |
| `break_task` | High idle time or abandonment | Offer a sensory/cognitive micro-break |
| `difficulty_step_down` | High retry + negative self-report | Provide scaffolded sub-task with hints |
