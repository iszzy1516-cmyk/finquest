"""Gamification endpoints."""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth.dependencies import get_current_active_user
from app.schemas.api import ApiResponse
from app.services.gamification_service import (
    process_gamification_event,
    get_gamification_progress,
    get_user_achievements,
)
from app.models.user import User

router = APIRouter()


@router.get("/progress", response_model=ApiResponse[dict])
def progress(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return ApiResponse(data=get_gamification_progress(db, current_user.id))


@router.get("/achievements", response_model=ApiResponse[dict])
def achievements(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    return ApiResponse(data=get_user_achievements(db, current_user.id))


@router.get("/dashboard", response_model=ApiResponse[dict])
def dashboard(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    prog = get_gamification_progress(db, current_user.id)
    ach = get_user_achievements(db, current_user.id)
    return ApiResponse(data={
        "progress": prog,
        "achievements": ach,
        "recent_xp_records": prog["recent_xp_records"],
    })


@router.post("/process-daily", response_model=ApiResponse[dict])
def process_daily(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    delta = process_gamification_event(db, current_user.id, "daily_login")
    return ApiResponse(data=delta)


@router.get("/leaderboard", response_model=ApiResponse[list[dict]])
def leaderboard(
    period: str = "all",
    metric: str = "xp",
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    users = db.query(User).order_by(User.total_xp_earned.desc()).limit(50).all()
    results = []
    for idx, u in enumerate(users, 1):
        results.append({
            "rank": idx,
            "user_id": u.id,
            "name": u.username,
            "level": u.current_level,
            "xp": u.total_xp_earned,
            "streak": 0,
            "longest_streak": 0,
        })
    return ApiResponse(data=results)
