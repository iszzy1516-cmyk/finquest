"""Currency ORM model."""

from datetime import datetime
from typing import Optional
from decimal import Decimal

from sqlalchemy import String, Numeric, DateTime, func, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class ExchangeRate(Base):
    __tablename__ = "exchange_rates"
    __table_args__ = (UniqueConstraint("base_currency", "target_currency", name="uq_exchange_rate"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    base_currency: Mapped[str] = mapped_column(String(3))
    target_currency: Mapped[str] = mapped_column(String(3))
    rate: Mapped[Decimal] = mapped_column(Numeric(10, 6))
    source: Mapped[str] = mapped_column(String(20), default="api")
    fetched_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)
