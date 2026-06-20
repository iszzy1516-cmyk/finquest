"""Application configuration."""

import secrets
from typing import List

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # App
    APP_NAME: str = "FinQuest"
    ENVIRONMENT: str = "development"
    VERSION: str = "1.0.0"

    # Security
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_hex(32), min_length=32)
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # Database
    DATABASE_URL: str = "sqlite:///./finquest.db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    # Rate limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60

    # Cookies
    SECURE_COOKIES: bool = False
    SAME_SITE: str = "Lax"

    # Logging
    LOG_LEVEL: str = "INFO"

    # Static files (for production SPA serving)
    STATIC_FILES_DIR: str | None = None

    @property
    def cors_origins_list(self) -> List[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
