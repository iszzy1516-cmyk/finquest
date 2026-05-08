"""Transactions endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import desc, and_
from decimal import Decimal

from app.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.auth.dependencies import get_current_active_user
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse
from app.schemas.api import ApiResponse, PaginatedResponse
from app.services.gamification_service import process_gamification_event

router = APIRouter()


class TransactionListParams(BaseModel):
    page: int = Query(1, ge=1)
    limit: int = Query(20, ge=1, le=100)
    type: str | None = Query(None, pattern="^(income|expense)$")
    category_id: int | None = Query(None)
    start_date: str | None = Query(None)
    end_date: str | None = Query(None)
    sort_by: str = Query("transaction_date")
    sort_order: str = Query("desc", pattern="^(asc|desc)$")


@router.get("", response_model=ApiResponse[PaginatedResponse[TransactionResponse]])
def list_transactions(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    type: str | None = Query(None),
    category_id: int | None = Query(None),
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    sort_order: str = Query("desc"),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction, Category).join(Category, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id
    )
    if type:
        query = query.filter(Transaction.type == type)
    if category_id:
        query = query.filter(Transaction.category_id == category_id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    total = query.count()
    query = query.order_by(desc(Transaction.transaction_date) if sort_order == "desc" else Transaction.transaction_date)
    query = query.offset((page - 1) * limit).limit(limit)

    items = []
    for tx, cat in query.all():
        items.append(TransactionResponse(
            id=tx.id,
            user_id=tx.user_id,
            type=tx.type,
            amount=tx.amount,
            category_id=tx.category_id,
            description=tx.description,
            transaction_date=tx.transaction_date,
            currency=tx.currency,
            created_at=tx.created_at,
            category_name=cat.name if cat else None,
            category_icon=cat.icon if cat else None,
            category_color=cat.color if cat else None,
        ))

    return ApiResponse(data=PaginatedResponse(
        items=items, total=total, page=page, pages=(total + limit - 1) // limit
    ))


@router.post("", response_model=ApiResponse[dict], status_code=status.HTTP_201_CREATED)
def create_transaction(body: TransactionCreate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    tx = Transaction(
        user_id=current_user.id,
        type=body.type,
        amount=body.amount,
        category_id=body.category_id,
        description=body.description,
        transaction_date=body.transaction_date,
        currency=body.currency or "USD",
        is_recurring=body.is_recurring,
        recurrence_rule=body.recurrence_rule,
    )
    db.add(tx)
    db.commit()
    db.refresh(tx)

    # Gamification
    delta = process_gamification_event(db, current_user.id, "transaction_created")

    cat = db.query(Category).filter(Category.id == tx.category_id).first()
    return ApiResponse(data={
        "transaction": TransactionResponse(
            id=tx.id, user_id=tx.user_id, type=tx.type, amount=tx.amount,
            category_id=tx.category_id, description=tx.description,
            transaction_date=tx.transaction_date, currency=tx.currency,
            created_at=tx.created_at, category_name=cat.name if cat else None,
            category_icon=cat.icon if cat else None, category_color=cat.color if cat else None,
        ),
        "gamification_delta": delta,
    })


@router.get("/{transaction_id}", response_model=ApiResponse[TransactionResponse])
def get_transaction(transaction_id: int, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    cat = db.query(Category).filter(Category.id == tx.category_id).first()
    return ApiResponse(data=TransactionResponse(
        id=tx.id, user_id=tx.user_id, type=tx.type, amount=tx.amount,
        category_id=tx.category_id, description=tx.description,
        transaction_date=tx.transaction_date, currency=tx.currency,
        created_at=tx.created_at, category_name=cat.name if cat else None,
        category_icon=cat.icon if cat else None, category_color=cat.color if cat else None,
    ))


@router.put("/{transaction_id}", response_model=ApiResponse[TransactionResponse])
def update_transaction(transaction_id: int, body: TransactionUpdate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")

    if body.type is not None:
        tx.type = body.type
    if body.amount is not None:
        tx.amount = body.amount
    if body.category_id is not None:
        tx.category_id = body.category_id
    if body.description is not None:
        tx.description = body.description
    if body.transaction_date is not None:
        tx.transaction_date = body.transaction_date
    if body.currency is not None:
        tx.currency = body.currency

    db.commit()
    db.refresh(tx)
    cat = db.query(Category).filter(Category.id == tx.category_id).first()
    return ApiResponse(data=TransactionResponse(
        id=tx.id, user_id=tx.user_id, type=tx.type, amount=tx.amount,
        category_id=tx.category_id, description=tx.description,
        transaction_date=tx.transaction_date, currency=tx.currency,
        created_at=tx.created_at, category_name=cat.name if cat else None,
        category_icon=cat.icon if cat else None, category_color=cat.color if cat else None,
    ))


@router.delete("/{transaction_id}", response_model=ApiResponse[dict])
def delete_transaction(transaction_id: int, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    tx = db.query(Transaction).filter(Transaction.id == transaction_id, Transaction.user_id == current_user.id).first()
    if not tx:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Transaction not found")
    db.delete(tx)
    db.commit()
    return ApiResponse(data={"success": True})


@router.get("/stats/summary", response_model=ApiResponse[dict])
def transaction_stats(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Transaction).filter(Transaction.user_id == current_user.id)
    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    income = sum(float(t.amount) for t in query.all() if t.type == "income")
    expense = sum(float(t.amount) for t in query.all() if t.type == "expense")

    return ApiResponse(data={
        "total_income": income,
        "total_expense": expense,
        "net_savings": income - expense,
        "transaction_count": query.count(),
    })
