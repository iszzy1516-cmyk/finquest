"""Notification endpoints."""

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from typing import Optional

from app.database import get_db
from app.auth.dependencies import get_current_active_user
from app.models.user import User
from app.services.notification_service import NotificationService
from app.schemas.api import ApiResponse

router = APIRouter()


class PreferencesUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    budget_alerts: Optional[bool] = None
    streak_reminders: Optional[bool] = None
    achievement_notifications: Optional[bool] = None
    weekly_summary: Optional[bool] = None
    recurring_reminders: Optional[bool] = None
    ai_insights: Optional[bool] = None
    social_notifications: Optional[bool] = None
    security_alerts: Optional[bool] = None


@router.get("", response_model=ApiResponse[list[dict]])
def list_notifications(
    unread_only: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    svc = NotificationService(db)
    items = svc.get_notifications(current_user.id, unread_only)
    return ApiResponse(data=[
        {
            "id": n.id, "type": n.type, "title": n.title, "body": n.body,
            "data": n.data, "read": n.read, "read_at": n.read_at,
            "dismissed": n.dismissed, "created_at": n.created_at,
        }
        for n in items
    ])


@router.get("/preferences", response_model=ApiResponse[dict])
def get_preferences(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = NotificationService(db)
    prefs = svc.get_preferences(current_user.id)
    return ApiResponse(data={
        "email_enabled": prefs.email_enabled,
        "push_enabled": prefs.push_enabled,
        "budget_alerts": prefs.budget_alerts,
        "streak_reminders": prefs.streak_reminders,
        "achievement_notifications": prefs.achievement_notifications,
        "weekly_summary": prefs.weekly_summary,
        "recurring_reminders": prefs.recurring_reminders,
        "ai_insights": prefs.ai_insights,
        "social_notifications": prefs.social_notifications,
        "security_alerts": prefs.security_alerts,
    })


@router.put("/preferences", response_model=ApiResponse[dict])
def update_preferences(body: PreferencesUpdate, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = NotificationService(db)
    prefs = svc.update_preferences(current_user.id, body.model_dump(exclude_unset=True))
    return ApiResponse(data={
        "email_enabled": prefs.email_enabled,
        "push_enabled": prefs.push_enabled,
        "budget_alerts": prefs.budget_alerts,
        "streak_reminders": prefs.streak_reminders,
        "achievement_notifications": prefs.achievement_notifications,
        "weekly_summary": prefs.weekly_summary,
        "recurring_reminders": prefs.recurring_reminders,
        "ai_insights": prefs.ai_insights,
        "social_notifications": prefs.social_notifications,
        "security_alerts": prefs.security_alerts,
    })


@router.put("/{notification_id}/read", response_model=ApiResponse[dict])
def mark_read(notification_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = NotificationService(db)
    svc.mark_as_read(notification_id, current_user.id)
    return ApiResponse(data={"success": True})


@router.put("/read-all", response_model=ApiResponse[dict])
def mark_all_read(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = NotificationService(db)
    svc.mark_all_read(current_user.id)
    return ApiResponse(data={"success": True})


@router.put("/{notification_id}/dismiss", response_model=ApiResponse[dict])
def dismiss(notification_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = NotificationService(db)
    svc.dismiss_notification(notification_id, current_user.id)
    return ApiResponse(data={"success": True})


@router.delete("/{notification_id}", response_model=ApiResponse[dict])
def delete_notification(notification_id: int, current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    svc = NotificationService(db)
    svc.delete_notification(notification_id, current_user.id)
    return ApiResponse(data={"success": True})
