"""AI Insights ORM models."""

from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Text, Numeric, DateTime, ForeignKey, func, JSON, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AIInsight(Base):
    __tablename__ = "ai_insights"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(50))
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str] = mapped_column(Text)
    confidence: Mapped[Optional[Decimal]] = mapped_column(Numeric(3, 2), nullable=True)
    data: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    action_taken: Mapped[bool] = mapped_column(Boolean, default=False)
    dismissed: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)


class SpendingPattern(Base):
    __tablename__ = "spending_patterns"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    pattern_type: Mapped[Optional[str]] = mapped_column(String(50), nullable=True)
    avg_monthly_spend: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    trend_slope: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 6), nullable=True)
    seasonality: Mapped[Optional[dict]] = mapped_column(JSON, nullable=True)
    last_analyzed: Mapped[datetime] = mapped_column(DateTime, default=func.now())
