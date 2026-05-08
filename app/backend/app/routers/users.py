"""User endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.transaction import Transaction
from app.models.user_settings import UserSettings
from app.auth.dependencies import get_current_active_user
from app.schemas.user import UserResponse, UserStats
from app.schemas.api import ApiResponse
from sqlalchemy import func

router = APIRouter()


class UserUpdateRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = Field(None, max_length=100)
    default_currency: str | None = Field(None, max_length=3)


class ThemeUpdateRequest(BaseModel):
    mode: str = Field(..., pattern="^(manual|system|auto|schedule)$")
    manual_theme: str | None = Field(None, pattern="^(light|dark)$")
    schedule_start: str | None = None
    schedule_end: str | None = None
    latitude: float | None = None
    longitude: float | None = None


@router.get("/me", response_model=ApiResponse[UserResponse])
def get_me(current_user: User = Depends(get_current_active_user)):
    return ApiResponse(data=UserResponse.model_validate(current_user))


@router.put("/me", response_model=ApiResponse[UserResponse])
def update_me(body: UserUpdateRequest, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if body.email:
        current_user.email = body.email
    if body.full_name is not None:
        current_user.full_name = body.full_name
    if body.default_currency:
        current_user.default_currency = body.default_currency
    db.commit()
    db.refresh(current_user)
    return ApiResponse(data=UserResponse.model_validate(current_user))


@router.get("/me/stats", response_model=ApiResponse[UserStats])
def get_stats(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    income_result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == current_user.id, Transaction.type == "income"
    ).scalar()
    expense_result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == current_user.id, Transaction.type == "expense"
    ).scalar()

    total_income = float(income_result or 0)
    total_expense = float(expense_result or 0)
    net_savings = total_income - total_expense
    savings_rate = ((total_income - total_expense) / total_income) * 100 if total_income > 0 else 0

    tx_count = db.query(Transaction).filter(Transaction.user_id == current_user.id).count()

    return ApiResponse(data=UserStats(
        total_income=total_income,
        total_expense=total_expense,
        net_savings=net_savings,
        savings_rate=round(max(0, savings_rate), 2),
        transaction_count=tx_count,
    ))


@router.get("/me/theme", response_model=ApiResponse[dict])
def get_theme(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        return ApiResponse(data={"theme": "light", "mode": "system"})
    return ApiResponse(data={
        "theme": settings.manual_theme if settings.theme_mode == "manual" else "light",
        "mode": settings.theme_mode,
        "schedule_start": settings.schedule_start,
        "schedule_end": settings.schedule_end,
        "latitude": settings.latitude,
        "longitude": settings.longitude,
    })


@router.put("/me/theme", response_model=ApiResponse[dict])
def update_theme(body: ThemeUpdateRequest, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    settings = db.query(UserSettings).filter(UserSettings.user_id == current_user.id).first()
    if not settings:
        settings = UserSettings(user_id=current_user.id)
        db.add(settings)

    settings.theme_mode = body.mode
    if body.manual_theme:
        settings.manual_theme = body.manual_theme
    if body.schedule_start:
        from datetime import datetime as dt
        settings.schedule_start = dt.strptime(body.schedule_start, "%H:%M").time()
    if body.schedule_end:
        from datetime import datetime as dt
        settings.schedule_end = dt.strptime(body.schedule_end, "%H:%M").time()
    if body.latitude is not None:
        settings.latitude = body.latitude
    if body.longitude is not None:
        settings.longitude = body.longitude

    db.commit()
    return ApiResponse(data={"mode": settings.theme_mode, "theme": settings.manual_theme})
