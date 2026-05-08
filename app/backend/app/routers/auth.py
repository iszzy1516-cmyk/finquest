"""Auth endpoints."""

from datetime import timedelta
from fastapi import APIRouter, Depends, Response, Request, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.models.refresh_token import RefreshToken
from app.auth.security import get_password_hash, verify_password, create_access_token, create_refresh_token, decode_token
from app.auth.dependencies import get_current_active_user
from app.config import settings
from app.schemas.api import ApiResponse
from app.schemas.user import UserResponse

router = APIRouter()


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=8)
    full_name: str | None = None


class LoginRequest(BaseModel):
    username: str
    password: str


class RefreshRequest(BaseModel):
    refresh_token: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


@router.post("/register", response_model=ApiResponse[dict])
def register(body: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(
        (User.email == body.email) | (User.username == body.username)
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="User already exists")

    user = User(
        email=body.email,
        username=body.username,
        hashed_password=get_password_hash(body.password),
        full_name=body.full_name,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    rt = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_str,
        expires_at=__import__("datetime").datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()

    return ApiResponse(data={
        "user": UserResponse.model_validate(user).model_dump(),
        "access_token": access_token,
        "refresh_token": refresh_token_str,
    })


@router.post("/login", response_model=ApiResponse[TokenResponse])
def login(body: LoginRequest, response: Response, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == body.username).first()
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token_str = create_refresh_token({"sub": str(user.id)})

    rt = RefreshToken(
        user_id=user.id,
        token_hash=refresh_token_str,
        expires_at=__import__("datetime").datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(rt)
    db.commit()

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.SECURE_COOKIES,
        samesite=settings.SAME_SITE,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )

    return ApiResponse(data=TokenResponse(access_token=access_token, refresh_token=refresh_token_str))


@router.post("/refresh", response_model=ApiResponse[TokenResponse])
def refresh(body: RefreshRequest, db: Session = Depends(get_db)):
    payload = decode_token(body.refresh_token)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    user_id = int(payload.get("sub"))
    rt = db.query(RefreshToken).filter(
        RefreshToken.user_id == user_id,
        RefreshToken.token_hash == body.refresh_token,
        RefreshToken.revoked == False,
    ).first()

    if not rt or rt.expires_at < __import__("datetime").datetime.utcnow():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token expired or revoked")

    # Rotate refresh token
    rt.revoked = True
    new_access = create_access_token({"sub": str(user_id)})
    new_refresh = create_refresh_token({"sub": str(user_id)})

    new_rt = RefreshToken(
        user_id=user_id,
        token_hash=new_refresh,
        expires_at=__import__("datetime").datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
    )
    db.add(new_rt)
    db.commit()

    return ApiResponse(data=TokenResponse(access_token=new_access, refresh_token=new_refresh))


@router.post("/logout", response_model=ApiResponse[dict])
def logout(request: Request, response: Response, db: Session = Depends(get_db)):
    token = request.cookies.get("access_token")
    response.delete_cookie("access_token")

    if token:
        payload = decode_token(token)
        if payload:
            user_id = int(payload.get("sub"))
            db.query(RefreshToken).filter(
                RefreshToken.user_id == user_id
            ).update({"revoked": True})
            db.commit()

    return ApiResponse(data={"success": True})


@router.get("/me", response_model=ApiResponse[UserResponse])
def me(current_user: User = Depends(get_current_active_user)):
    return ApiResponse(data=UserResponse.model_validate(current_user))
