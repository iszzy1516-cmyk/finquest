"""Social ORM models."""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, DateTime, ForeignKey, func, Numeric, Date, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Friendship(Base):
    __tablename__ = "friendships"
    __table_args__ = (UniqueConstraint("requester_id", "addressee_id", name="uq_friendship"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    requester_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    addressee_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    status: Mapped[str] = mapped_column(String(20), default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    accepted_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    requester: Mapped["User"] = relationship(foreign_keys=[requester_id], back_populates="friendships_sent")
    addressee: Mapped["User"] = relationship(foreign_keys=[addressee_id], back_populates="friendships_received")


class SharedBudget(Base):
    __tablename__ = "shared_budgets"

    id: Mapped[int] = mapped_column(primary_key=True)
    budget_id: Mapped[int] = mapped_column(ForeignKey("budgets.id"))
    owner_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    name: Mapped[str] = mapped_column(String(100))
    total_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    members: Mapped[list["SharedBudgetMember"]] = relationship(back_populates="shared_budget")


class SharedBudgetMember(Base):
    __tablename__ = "shared_budget_members"

    id: Mapped[int] = mapped_column(primary_key=True)
    shared_budget_id: Mapped[int] = mapped_column(ForeignKey("shared_budgets.id"))
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    allocation: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    role: Mapped[str] = mapped_column(String(20), default="member")
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    shared_budget: Mapped["SharedBudget"] = relationship(back_populates="members")


class LeaderboardEntry(Base):
    __tablename__ = "leaderboard_entries"
    __table_args__ = (UniqueConstraint("user_id", "period", "metric", "period_start", name="uq_leaderboard_entry"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    period: Mapped[str] = mapped_column(String(20))
    metric: Mapped[str] = mapped_column(String(30))
    value: Mapped[Decimal] = mapped_column(Numeric(15, 2))
    rank: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now(), onupdate=func.now())
