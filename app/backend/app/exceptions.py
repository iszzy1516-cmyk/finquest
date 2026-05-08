"""Custom exception classes."""

from fastapi import HTTPException, status


class FinQuestException(HTTPException):
    """Base application exception."""

    def __init__(self, status_code: int, code: str, message: str, details: list = None):
        super().__init__(status_code=status_code, detail={
            "success": False,
            "error": {
                "code": code,
                "message": message,
                "details": details or [],
            }
        })


class ValidationError(FinQuestException):
    def __init__(self, message: str = "Invalid input data", details: list = None):
        super().__init__(status.HTTP_422_UNPROCESSABLE_ENTITY, "VALIDATION_ERROR", message, details)


class AuthenticationError(FinQuestException):
    def __init__(self, message: str = "Authentication required"):
        super().__init__(status.HTTP_401_UNAUTHORIZED, "AUTHENTICATION_ERROR", message)


class AuthorizationError(FinQuestException):
    def __init__(self, message: str = "Insufficient permissions"):
        super().__init__(status.HTTP_403_FORBIDDEN, "AUTHORIZATION_ERROR", message)


class NotFoundError(FinQuestException):
    def __init__(self, resource: str = "Resource"):
        super().__init__(status.HTTP_404_NOT_FOUND, "NOT_FOUND", f"{resource} not found")


class ConflictError(FinQuestException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(status.HTTP_409_CONFLICT, "CONFLICT", message)


class RateLimitError(FinQuestException):
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(status.HTTP_429_TOO_MANY_REQUESTS, "RATE_LIMIT", message)
