"""Category ORM model."""

from datetime import datetime
from typing import List, Optional

from sqlalchemy import String, Boolean, DateTime, func, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"), index=True, nullable=True)
    name: Mapped[str] = mapped_column(String(50))
    type: Mapped[str] = mapped_column(String(10))  # "income" | "expense"
    icon: Mapped[str] = mapped_column(String(50), default="Circle")
    color: Mapped[str] = mapped_column(String(7), default="#3b82f6")
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=func.now())

    user: Mapped[Optional["User"]] = relationship(back_populates="categories")
    transactions: Mapped[List["Transaction"]] = relationship(back_populates="category")
    budgets: Mapped[List["Budget"]] = relationship(back_populates="category")
