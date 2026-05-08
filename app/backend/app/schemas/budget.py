"""Budget Pydantic schemas."""

from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category_id: Optional[int] = None
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    period_start: date
    period_end: date
    alert_threshold: Optional[int] = Field(80, ge=1, le=100)


class BudgetResponse(BaseModel):
    id: int
    user_id: int
    name: str
    category_id: Optional[int]
    amount: Decimal
    period_start: date
    period_end: date
    alert_threshold: int
    created_at: datetime

    class Config:
        from_attributes = True


class BudgetStatus(BaseModel):
    budget: BudgetResponse
    spent: float
    remaining: float
    percentage: float
    days_remaining: int
