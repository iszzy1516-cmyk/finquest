"""Transaction ORM model."""

from datetime import datetime, date
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Numeric, Date, DateTime, ForeignKey, func, Boolean, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Transaction(Base):
    __tablename__ = "transactions"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)
    type: Mapped[str] = mapped_column(String(10))  # "income" | "expense"
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    category_id: Mapped[int] = mapped_column(ForeignKey("categories.id"))
    description: Mapped[Optional[str]] = mapped_column(String(255))
    transaction_date: Mapped[date] = mapped_column(Date, default=func.current_date())
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    # Multi-currency
    currency: Mapped[str] = mapped_column(String(3), default="USD")
    original_amount: Mapped[Optional[Decimal]] = mapped_column(Numeric(12, 2), nullable=True)
    exchange_rate: Mapped[Optional[Decimal]] = mapped_column(Numeric(10, 6), nullable=True)

    # Recurring
    is_recurring: Mapped[bool] = mapped_column(Boolean, default=False)
    recurrence_rule: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    parent_transaction_id: Mapped[Optional[int]] = mapped_column(ForeignKey("transactions.id"), nullable=True)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    user: Mapped["User"] = relationship(back_populates="transactions")
    category: Mapped["Category"] = relationship(back_populates="transactions")
