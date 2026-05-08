"""User Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: EmailStr
    full_name: Optional[str] = Field(None, max_length=100)


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=128)


class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    full_name: Optional[str] = Field(None, max_length=100)
    default_currency: Optional[str] = Field(None, max_length=3)


class UserResponse(UserBase):
    id: int
    is_active: bool
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    current_xp: int
    current_level: int
    total_xp_earned: int
    default_currency: str

    class Config:
        from_attributes = True


class UserStats(BaseModel):
    total_income: float
    total_expense: float
    net_savings: float
    savings_rate: float
    transaction_count: int
