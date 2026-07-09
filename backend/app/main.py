# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.api.v1.auth import router as auth_router
from app.api.v1.builders import router as builders_router
from app.api.v1.projects import router as projects_router
from app.api.v1.teams import router as teams_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.hackathons import router as hackathons_router
from app.api.v1.ai import router as ai_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan manager handling app startup and shutdown tasks."""
    # Startup: Verify Database Connectivity
    print(f"Starting up {settings.app_name} API service...")
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("Database connection verified successfully.")
    except Exception as e:
        print(f"Warning: Database connection verification failed during startup: {e}")
    yield
    # Shutdown
    print(f"Shutting down {settings.app_name} API service...")


app = FastAPI(
    title=f"{settings.app_name} API",
    description="Production-ready FastAPI Backend for student collaboration and hackathon team formation.",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Enable CORS (Cross-Origin Resource Sharing)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API v1 routes
app.include_router(auth_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")
app.include_router(builders_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")
app.include_router(projects_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")
app.include_router(teams_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")
app.include_router(notifications_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")
app.include_router(hackathons_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")
app.include_router(ai_router, prefix=settings.api_v1_str if hasattr(settings, 'api_v1_str') else "/api/v1")



@app.get("/", tags=["system"])
async def root():
    """Welcome route directing clients to API documentation."""
    return {
        "message": f"Welcome to the {settings.app_name} API backend",
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", status_code=status.HTTP_200_OK, tags=["system"])
async def health_check():
    """Verify backend system status and database engine connectivity."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {
            "status": "healthy",
            "database": "connected",
            "app": settings.app_name
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Database connection error: {str(e)}"
        )
