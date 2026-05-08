"""Generic API response schemas."""

from datetime import datetime
from typing import Generic, Optional, TypeVar, List

from pydantic import BaseModel, Field

T = TypeVar("T")


class PaginationMeta(BaseModel):
    page: int
    limit: int
    total: int
    pages: int


class ResponseMeta(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    request_id: Optional[str] = None
    pagination: Optional[PaginationMeta] = None


class ApiResponse(BaseModel, Generic[T]):
    success: bool = True
    data: T
    meta: ResponseMeta = Field(default_factory=ResponseMeta)


class ErrorDetail(BaseModel):
    field: Optional[str] = None
    message: str


class ErrorResponse(BaseModel):
    success: bool = False
    error: dict


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    page: int
    pages: int
