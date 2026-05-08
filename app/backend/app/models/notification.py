"""Notification ORM models."""

from datetime import datetime, time
from typing import Optional

from sqlalchemy import String, Boolean, DateTime, ForeignKey, func, Text, JSON, Time
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    email_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    email_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    push_sent: Mapped[bool] = mapped_column(Boolean, default=False)
    push_sent_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    read_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
    dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="notifications")


class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    email_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    push_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    budget_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    streak_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    achievement_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    weekly_summary: Mapped[bool] = mapped_column(Boolean, default=True)
    recurring_reminders: Mapped[bool] = mapped_column(Boolean, default=True)
    ai_insights: Mapped[bool] = mapped_column(Boolean, default=True)
    social_notifications: Mapped[bool] = mapped_column(Boolean, default=True)
    security_alerts: Mapped[bool] = mapped_column(Boolean, default=True)
    quiet_hours_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    quiet_hours_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    timezone: Mapped[str] = mapped_column(String(50), default="UTC")
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="notification_prefs")


class PushToken(Base):
    __tablename__ = "push_tokens"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    token: Mapped[str] = mapped_column(String(255))
    platform: Mapped[str] = mapped_column(String(20))
    device_info: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    last_used: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
