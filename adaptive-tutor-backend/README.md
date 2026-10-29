# Adaptive Tutoring System — Backend

FastAPI + PostgreSQL (Supabase) backend for an adaptive tutoring system for neurodivergent learners.
Detects engagement patterns from behavioral signals and responds with targeted interventions.

## Quick Start

### Prerequisites
- Python 3.11+
- Docker (for integration test DB)

### Setup
```bash
# Clone and install
cd adaptive-tutor-backend
pip install -e ".[dev]"

# Configure environment
cp .env.example .env
# Fill in: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, GROQ_API_KEY

# Run the server
uvicorn app.main:app --reload
# → http://localhost:8000/docs
```

### Database Setup (Supabase)
```bash
# Once SUPABASE credentials are in .env:
alembic upgrade head

# Seed 25 Life Science tasks
python -m app.seed.seed_tasks
```

## Running Tests

### Unit tests (no DB, no network — fast)
```bash
pytest tests/unit
```

### Integration tests (requires Docker Postgres)
```bash
# Start test DB
docker-compose -f docker-compose.test.yml up -d

# Wait for healthy, then run
pytest tests/integration
```

## Architecture

```
app/
  main.py              FastAPI app, router mounting
  config.py            Pydantic Settings (all env vars)
  deps.py              FastAPI deps: get_db, get_current_user, require_role
  core/
    security.py        Supabase JWT verification
    logging.py         Sentry + structured logging
  models/              SQLModel table definitions (8 tables)
  schemas/             Pydantic request/response DTOs
  routers/             Thin routers (7 routers)
  services/
    task_service.py          Task CRUD + sequencing
    engagement_engine.py     Rule-based scoring (pure functions + DB wrapper)
    intervention_engine.py   Trigger rules + orchestration
    content_generator.py     Groq API wrapper + validation + retry
    dashboard_service.py     Parent/teacher dashboard queries
  seed/                25 hand-authored Life Science tasks
```

## Engagement Engine

Composite risk score:
```
score = 0.30 × latency_ratio + 0.25 × switch_rate + 0.25 × abandonment + 0.20 × inverse_self_report
```

**⚠ Weights are placeholder hypotheses** — to be tuned against pilot data (see docs/decisions.md).

Thresholds:
- `> 0.7` → trigger intervention
- `0.4–0.7` → flag for monitoring
- `< 0.4` → no action

## Interventions

| Type | Trigger | Method |
|------|---------|--------|
| `re_chunk` | High latency + high switch rate | Groq: split into sub-tasks |
| `modality_switch` | High retry + moderate latency | Groq: alternate content_type |
| `break_task` | High idle or abandonment | Pre-authored task (instant) |
| `difficulty_step_down` | High retry + negative self-report | Groq: easier scaffolded variant |

## Key Design Decisions

See [docs/decisions.md](docs/decisions.md) for all decisions and deviations.

## Day 1 Sign-Off Status

See [docs/decisions.md](docs/decisions.md) for sign-off checklist results.
