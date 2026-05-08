"""Budgets endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime

from app.database import get_db
from app.models.budget import Budget
from app.models.transaction import Transaction
from app.models.category import Category
from app.auth.dependencies import get_current_active_user
from app.schemas.budget import BudgetCreate, BudgetResponse, BudgetStatus
from app.schemas.api import ApiResponse
from app.services.gamification_service import process_gamification_event

router = APIRouter()


@router.get("", response_model=ApiResponse[list[BudgetStatus]])
def list_budgets(active: bool | None = None, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    query = db.query(Budget, Category).outerjoin(Category, Budget.category_id == Category.id).filter(
        Budget.user_id == current_user.id
    )
    results = []
    for b, cat in query.all():
        spent_result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == current_user.id,
            Transaction.type == "expense",
            Transaction.category_id == b.category_id if b.category_id else True,
        ).scalar()
        spent = float(spent_result or 0)
        amount = float(b.amount)
        percentage = (spent / amount * 100) if amount > 0 else 0
        days_remaining = max(0, (b.period_end - datetime.utcnow().date()).days)
        status_str = "exceeded" if percentage >= 100 else "warning" if percentage >= b.alert_threshold else "good"

        results.append(BudgetStatus(
            budget=BudgetResponse(
                id=b.id, user_id=b.user_id, name=b.name, category_id=b.category_id,
                amount=b.amount, period_start=b.period_start, period_end=b.period_end,
                alert_threshold=b.alert_threshold, created_at=b.created_at,
            ),
            spent=spent, remaining=amount - spent,
            percentage=round(percentage, 2), days_remaining=days_remaining,
        ))

    if active:
        today = datetime.utcnow().date()
        results = [r for r in results if r.budget.period_start <= today <= r.budget.period_end]

    return ApiResponse(data=results)


@router.post("", response_model=ApiResponse[BudgetResponse], status_code=status.HTTP_201_CREATED)
def create_budget(body: BudgetCreate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    b = Budget(
        user_id=current_user.id,
        name=body.name,
        category_id=body.category_id,
        amount=body.amount,
        period_start=body.period_start,
        period_end=body.period_end,
        alert_threshold=body.alert_threshold or 80,
    )
    db.add(b)
    db.commit()
    db.refresh(b)
    return ApiResponse(data=BudgetResponse.model_validate(b))


@router.put("/{budget_id}", response_model=ApiResponse[BudgetResponse])
def update_budget(budget_id: int, body: BudgetCreate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    b.name = body.name
    b.category_id = body.category_id
    b.amount = body.amount
    b.period_start = body.period_start
    b.period_end = body.period_end
    b.alert_threshold = body.alert_threshold or b.alert_threshold
    db.commit()
    db.refresh(b)
    return ApiResponse(data=BudgetResponse.model_validate(b))


@router.delete("/{budget_id}", response_model=ApiResponse[dict])
def delete_budget(budget_id: int, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")
    db.delete(b)
    db.commit()
    return ApiResponse(data={"success": True})


@router.get("/{budget_id}/status", response_model=ApiResponse[BudgetStatus])
def get_budget_status(budget_id: int, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    b = db.query(Budget).filter(Budget.id == budget_id, Budget.user_id == current_user.id).first()
    if not b:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Budget not found")

    spent_result = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.category_id == b.category_id if b.category_id else True,
    ).scalar()
    spent = float(spent_result or 0)
    amount = float(b.amount)
    percentage = (spent / amount * 100) if amount > 0 else 0
    days_remaining = max(0, (b.period_end - datetime.utcnow().date()).days)

    return ApiResponse(data=BudgetStatus(
        budget=BudgetResponse.model_validate(b),
        spent=spent, remaining=amount - spent,
        percentage=round(percentage, 2), days_remaining=days_remaining,
    ))
