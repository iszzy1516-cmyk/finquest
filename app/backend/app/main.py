"""FastAPI application factory."""

import time
import uuid
from contextlib import asynccontextmanager

import os
from fastapi import FastAPI, Request, status, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.constants import DEFAULT_CATEGORIES, ACHIEVEMENT_DEFINITIONS
from app.models import *  # noqa: F401, F403 — ensure all models register with Base
from app.middleware import RateLimitMiddleware, SecurityHeadersMiddleware

from app.routers import auth, users, transactions, budgets, categories, goals, gamification, analytics, notifications, export_import


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    Base.metadata.create_all(bind=engine)
    _seed_data()
    yield
    # Shutdown


def _seed_data():
    from sqlalchemy.orm import Session
    from app.models.category import Category
    from app.models.gamification import Achievement

    db = Session(bind=engine)
    try:
        # Seed default categories
        for cat in DEFAULT_CATEGORIES:
            exists = db.query(Category).filter(Category.name == cat["name"], Category.is_default == True).first()
            if not exists:
                db.add(Category(**cat, is_default=True))

        # Seed achievements
        for ach in ACHIEVEMENT_DEFINITIONS:
            exists = db.query(Achievement).filter(Achievement.name == ach["name"]).first()
            if not exists:
                db.add(Achievement(**ach))

        db.commit()
    except Exception as e:
        db.rollback()
        print(f"[seed] error: {e}")
    finally:
        db.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title=settings.APP_NAME,
        version=settings.VERSION,
        docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
        redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH"],
        allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
        max_age=600,
    )

    # Rate limiting (per IP)
    app.add_middleware(RateLimitMiddleware)

    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)

    # Request ID & timing middleware
    @app.middleware("http")
    async def add_request_metadata(request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        start_time = time.time()

        response = await call_next(request)

        duration = (time.time() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time-Ms"] = str(int(duration))
        return response

    # Exception handlers
    @app.exception_handler(Exception)
    async def generic_exception_handler(request: Request, exc: Exception):
        request_id = getattr(request.state, "request_id", str(uuid.uuid4()))
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "error": {
                    "code": "INTERNAL_ERROR",
                    "message": "An unexpected error occurred",
                    "details": [],
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "request_id": request_id,
                }
            },
        )

    # Routers
    app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
    app.include_router(users.router, prefix="/api/v1/users", tags=["users"])
    app.include_router(transactions.router, prefix="/api/v1/transactions", tags=["transactions"])
    app.include_router(budgets.router, prefix="/api/v1/budgets", tags=["budgets"])
    app.include_router(categories.router, prefix="/api/v1/categories", tags=["categories"])
    app.include_router(goals.router, prefix="/api/v1/goals", tags=["goals"])
    app.include_router(gamification.router, prefix="/api/v1/gamification", tags=["gamification"])
    app.include_router(analytics.router, prefix="/api/v1/analytics", tags=["analytics"])
    app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["notifications"])
    app.include_router(export_import.router, prefix="/api/v1/export", tags=["export/import"])

    @app.get("/health")
    async def health_check():
        return {
            "status": "healthy",
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT,
        }

    # Static files & SPA fallback (production)
    static_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../dist/public"))
    if os.path.isdir(static_dir):
        app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

        @app.get("/{full_path:path}")
        async def serve_spa(full_path: str):
            if full_path.startswith("api/") or full_path in ("health", "docs", "redoc", "openapi.json"):
                raise HTTPException(status_code=404)
            index_file = os.path.join(static_dir, "index.html")
            if os.path.exists(index_file):
                return FileResponse(index_file)
            raise HTTPException(status_code=404)

    return app


app = create_app()
