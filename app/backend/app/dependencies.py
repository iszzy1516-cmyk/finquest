"""FastAPI dependency injection container."""

from fastapi import Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.auth.dependencies import get_current_active_user


# Re-export commonly used dependencies
DbSession = Depends(get_db)
CurrentUser = Depends(get_current_active_user)
