"""Transaction Pydantic schemas."""

from datetime import date, datetime
from typing import Optional
from decimal import Decimal

from pydantic import BaseModel, Field


class TransactionBase(BaseModel):
    type: str = Field(..., pattern="^(income|expense)$")
    amount: Decimal = Field(..., gt=0, decimal_places=2)
    category_id: int
    description: Optional[str] = Field(None, max_length=255)
    transaction_date: date
    currency: Optional[str] = Field("USD", max_length=3)


class TransactionCreate(TransactionBase):
    is_recurring: bool = False
    recurrence_rule: Optional[str] = None


class TransactionUpdate(BaseModel):
    type: Optional[str] = Field(None, pattern="^(income|expense)$")
    amount: Optional[Decimal] = Field(None, gt=0, decimal_places=2)
    category_id: Optional[int] = None
    description: Optional[str] = Field(None, max_length=255)
    transaction_date: Optional[date] = None
    currency: Optional[str] = Field(None, max_length=3)


class TransactionResponse(TransactionBase):
    id: int
    user_id: int
    created_at: datetime
    category_name: Optional[str] = None
    category_icon: Optional[str] = None
    category_color: Optional[str] = None

    class Config:
        from_attributes = True
