"""Gamification ORM models."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import String, Integer, DateTime, ForeignKey, func, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class XPRecord(Base):
    __tablename__ = "xp_records"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    amount: Mapped[int]
    source: Mapped[str] = mapped_column(String(50))
    description: Mapped[Optional[str]] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship(back_populates="xp_records")


class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100), unique=True)
    description: Mapped[str] = mapped_column(String(255))
    icon: Mapped[str] = mapped_column(String(50))
    xp_reward: Mapped[int]
    condition_type: Mapped[str] = mapped_column(String(50))
    condition_value: Mapped[int]
    category: Mapped[str] = mapped_column(String(50))

    user_achievements: Mapped[list["UserAchievement"]] = relationship(back_populates="achievement")


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    achievement_id: Mapped[int] = mapped_column(ForeignKey("achievements.id"))
    unlocked_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    xp_awarded: Mapped[bool] = mapped_column(default=False)

    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="user_achievements")


class Streak(Base):
    __tablename__ = "streaks"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True)
    current_streak: Mapped[int] = mapped_column(default=0)
    longest_streak: Mapped[int] = mapped_column(default=0)
    last_login_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    streak_broken_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="streaks")
