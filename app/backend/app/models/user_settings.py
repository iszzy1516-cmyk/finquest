"""User settings ORM model."""

from datetime import datetime, time
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, DateTime, ForeignKey, func, Time, Numeric
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class UserSettings(Base):
    __tablename__ = "user_settings"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    theme_pref: Mapped[str] = mapped_column(String(10), default="light")
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    notifications: Mapped[bool] = mapped_column(default=True)
    theme_mode: Mapped[str] = mapped_column(String(20), default="system")
    manual_theme: Mapped[str] = mapped_column(String(10), default="light")
    schedule_start: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    schedule_end: Mapped[Optional[time]] = mapped_column(Time, nullable=True)
    latitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 8), nullable=True)
    longitude: Mapped[Optional[Decimal]] = mapped_column(Numeric(11, 8), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship(back_populates="user_settings")
