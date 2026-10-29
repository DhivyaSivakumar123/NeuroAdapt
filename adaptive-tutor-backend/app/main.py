"""
FastAPI application entry point.

Mounts all routers, configures CORS, initializes Sentry and logging on startup.
"""

from contextlib import asynccontextmanager

import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.core.logging import configure_logging, init_sentry
from app.db.session import get_engine
from app.models import *  # noqa: F403
from app.routers import auth, dashboard, engagement, events, interventions, meetings, sessions, students, tasks
from datetime import date
from sqlmodel import SQLModel, Session, select


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown hooks."""
    configure_logging()
    init_sentry()
    try:
        engine = get_engine()
        Meeting.__table__.create(bind=engine, checkfirst=True)
        with Session(engine) as session:
            mock_links = [
                "https://meet.google.com/vcx-sja-siam-mostafiz",
                "https://meet.google.com/phy-laws-motion-clarity",
                "https://meet.google.com/bio-cells-mitosis-room",
            ]
            mocks = session.execute(
                select(Meeting).where(Meeting.meeting_link.in_(mock_links))
            ).scalars().all()
            for m in mocks:
                session.delete(m)
            session.commit()
    except Exception as e:
        print(f"Warning: Meeting table initialization skipped or encountered error: {e}")
    yield
    # Shutdown: nothing to clean up for V1 (connection pool handled by SQLAlchemy)


settings = get_settings()

app = FastAPI(
    title="Adaptive Tutoring System API",
    description=(
        "Backend API for an adaptive tutoring system for neurodivergent learners (ADHD, autism spectrum). "
        "Detects engagement patterns from behavioral signals and responds with targeted interventions."
    ),
    version="0.1.0",
    lifespan=lifespan,
    # Swagger UI available at /docs, ReDoc at /redoc
    docs_url="/docs",
    redoc_url="/redoc",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
def get_cors_origins() -> list[str]:
    raw = getattr(settings, "cors_origins", "") or ""
    configured = [origin.strip() for origin in raw.split(",") if origin.strip()]
    defaults = [
        "https://neurodivergent.vercel.app",
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
    ]
    return list(set(configured + defaults))

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def global_exception_handler(request, exc: Exception):
    origin = request.headers.get("origin", "*")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal Server Error", "message": str(exc)},
        headers={
            "Access-Control-Allow-Origin": origin if origin else "*",
            "Access-Control-Allow-Credentials": "true",
        },
    )

# ── Static Files ─────────────────────────────────────────────────────────────
static_dir = os.path.join(os.path.dirname(__file__), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(tasks.router)
app.include_router(sessions.router)
app.include_router(events.router)
app.include_router(engagement.router)
app.include_router(interventions.router)
app.include_router(dashboard.router)
app.include_router(meetings.router)


@app.get("/health", tags=["health"])
async def health_check():
    """Simple health check endpoint — confirms the app is running."""
    return {"status": "ok", "env": settings.app_env}
