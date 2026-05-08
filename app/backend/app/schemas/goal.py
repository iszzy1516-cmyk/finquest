"""Goal Pydantic schemas."""

from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel, Field


class GoalCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    target_amount: Decimal = Field(..., gt=0, decimal_places=2)
    deadline: Optional[date] = None


class GoalUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    target_amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    deadline: Optional[date] = None


class GoalResponse(BaseModel):
    id: int
    user_id: int
    name: str
    target_amount: Decimal
    current_amount: Decimal
    deadline: Optional[date]
    created_at: datetime

    class Config:
        from_attributes = True
