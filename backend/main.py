from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func
import os
from dotenv import load_dotenv

load_dotenv()

import models
from database import engine, SessionLocal, get_db

from routers import auth, users, services, bookings, reviews, calendar, notifications, availability

# Create all DB tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SkillBridge API",
    description="Two-sided service marketplace — connect service providers with users",
    version="1.0.0",
)

# CORS — read comma-separated origins from env (supports multiple Vercel URLs)
_cors_env = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173,http://localhost:3000"
)
allowed_origins = [o.strip() for o in _cors_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(reviews.router)
app.include_router(calendar.router)
app.include_router(notifications.router)
app.include_router(availability.router)


@app.get("/")
def root():
    return {"message": "SkillBridge API is running 🚀", "docs": "/docs"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.get("/stats")
def get_platform_stats(db: Session = Depends(get_db)):
    """Return real platform-wide stats for the landing page."""
    total_services = db.query(func.count(models.Service.id)).scalar() or 0
    total_providers = (
        db.query(func.count(models.User.id))
        .filter(models.User.role == "provider")
        .scalar() or 0
    )
    avg_result = db.query(func.avg(models.Review.rating)).scalar()
    avg_rating = round(float(avg_result), 1) if avg_result else 0.0

    return {
        "total_services": total_services,
        "total_providers": total_providers,
        "avg_rating": avg_rating,
    }
