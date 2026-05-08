"""Recurring transaction ORM model."""

from datetime import datetime, date
from typing import Optional

from sqlalchemy import DateTime, ForeignKey, func, Date, String
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class RecurrenceLog(Base):
    __tablename__ = "recurrence_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    parent_transaction_id: Mapped[int] = mapped_column(ForeignKey("transactions.id"))
    generated_transaction_id: Mapped[Optional[int]] = mapped_column(ForeignKey("transactions.id"), nullable=True)
    scheduled_date: Mapped[date] = mapped_column(Date)
    generated_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    status: Mapped[str] = mapped_column(String(20), default="pending")
