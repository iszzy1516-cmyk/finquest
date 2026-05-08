"""Budget ORM model."""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, func, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Budget(Base):
    __tablename__ = "budgets"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    name: Mapped[str] = mapped_column(String(100))
    category_id: Mapped[Optional[int]] = mapped_column(ForeignKey("categories.id"), nullable=True)
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    alert_threshold: Mapped[int] = mapped_column(Integer, default=80)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped["User"] = relationship(back_populates="budgets")
    category: Mapped[Optional["Category"]] = relationship(back_populates="budgets")
