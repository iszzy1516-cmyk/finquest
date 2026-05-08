"""Category Pydantic schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    type: str = Field(..., pattern="^(income|expense)$")
    icon: Optional[str] = Field("Circle", max_length=50)
    color: Optional[str] = Field("#3b82f6", max_length=7)


class CategoryResponse(BaseModel):
    id: int
    user_id: Optional[int]
    name: str
    type: str
    icon: str
    color: str
    is_default: bool
    created_at: datetime

    class Config:
        from_attributes = True
