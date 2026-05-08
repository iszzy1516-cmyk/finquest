"""Custom middleware: rate limiting, security headers."""

import time
from fastapi import Request, Response
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Dict, Tuple

from app.config import settings


class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiter per IP."""

    def __init__(self, app, max_requests: int = 100, window_seconds: int = 60):
        super().__init__(app)
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.requests: Dict[str, list] = {}

    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        now = time.time()

        # Clean old entries
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < self.window_seconds]

        # Check auth endpoints for stricter limits
        is_auth_endpoint = request.url.path.startswith("/api/v1/auth")
        max_req = 5 if is_auth_endpoint else self.max_requests
        window = 900 if is_auth_endpoint else self.window_seconds  # 15 min for auth

        self.requests[client_ip] = [t for t in self.requests[client_ip] if now - t < window]

        if len(self.requests[client_ip]) >= max_req:
            return Response(
                content='{"success":false,"error":{"code":"RATE_LIMIT","message":"Rate limit exceeded. Please try again later."}}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(window)},
            )

        self.requests[client_ip].append(now)
        response = await call_next(request)
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses."""

    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        if settings.ENVIRONMENT == "production":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response
