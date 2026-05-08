"""User ORM model."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Boolean, DateTime, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    full_name: Mapped[Optional[str]] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(default=True)
    is_verified: Mapped[bool] = mapped_column(default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())

    # Gamification fields
    current_xp: Mapped[int] = mapped_column(Integer, default=0)
    current_level: Mapped[int] = mapped_column(Integer, default=1)
    total_xp_earned: Mapped[int] = mapped_column(Integer, default=0)

    # Currency
    default_currency: Mapped[str] = mapped_column(String(3), default="USD")

    # Relationships
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="user", lazy="dynamic")
    achievements: Mapped[List["UserAchievement"]] = relationship(back_populates="user", lazy="dynamic")
    streaks: Mapped[List["Streak"]] = relationship(back_populates="user", lazy="dynamic")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="user", lazy="dynamic")
    goals: Mapped[List["Goal"]] = relationship(back_populates="user", lazy="dynamic")
    xp_records: Mapped[List["XPRecord"]] = relationship(back_populates="user", lazy="dynamic")
    notifications: Mapped[List["Notification"]] = relationship(back_populates="user", lazy="dynamic")
    notification_prefs: Mapped[Optional["NotificationPreference"]] = relationship(back_populates="user", uselist=False)
    friendships_sent: Mapped[List["Friendship"]] = relationship(
        foreign_keys="Friendship.requester_id", back_populates="requester", lazy="dynamic"
    )
    friendships_received: Mapped[List["Friendship"]] = relationship(
        foreign_keys="Friendship.addressee_id", back_populates="addressee", lazy="dynamic"
    )
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(back_populates="user", lazy="dynamic")
    user_settings: Mapped[Optional["UserSettings"]] = relationship(back_populates="user", uselist=False)
    categories: Mapped[List["Category"]] = relationship(back_populates="user", lazy="dynamic")
