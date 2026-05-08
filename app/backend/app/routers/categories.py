"""Categories endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.category import Category
from app.auth.dependencies import get_current_active_user
from app.schemas.category import CategoryCreate, CategoryResponse
from app.schemas.api import ApiResponse

router = APIRouter()


@router.get("", response_model=ApiResponse[list[CategoryResponse]])
def list_categories(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    items = db.query(Category).filter(
        (Category.user_id == current_user.id) | (Category.is_default == True)
    ).all()
    return ApiResponse(data=[CategoryResponse.model_validate(i) for i in items])


@router.post("", response_model=ApiResponse[CategoryResponse], status_code=status.HTTP_201_CREATED)
def create_category(body: CategoryCreate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    cat = Category(
        user_id=current_user.id,
        name=body.name,
        type=body.type,
        icon=body.icon or "Circle",
        color=body.color or "#3b82f6",
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return ApiResponse(data=CategoryResponse.model_validate(cat))


@router.delete("/{category_id}", response_model=ApiResponse[dict])
def delete_category(category_id: int, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    cat = db.query(Category).filter(Category.id == category_id, Category.user_id == current_user.id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    db.delete(cat)
    db.commit()
    return ApiResponse(data={"success": True})
