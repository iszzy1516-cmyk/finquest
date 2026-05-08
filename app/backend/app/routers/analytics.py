"""Analytics endpoints."""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta

from app.database import get_db
from app.models.transaction import Transaction
from app.models.category import Category
from app.auth.dependencies import get_current_active_user
from app.schemas.api import ApiResponse

router = APIRouter()


@router.get("/dashboard", response_model=ApiResponse[dict])
def dashboard(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    now = datetime.utcnow()
    start_of_month = now.replace(day=1).date()
    thirty_days_ago = (now - timedelta(days=30)).date()

    monthly_income = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "income",
        Transaction.transaction_date >= start_of_month,
    ).scalar() or 0

    monthly_expense = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.transaction_date >= start_of_month,
    ).scalar() or 0

    tx_count_30d = db.query(Transaction).filter(
        Transaction.user_id == current_user.id,
        Transaction.transaction_date >= thirty_days_ago,
    ).count()

    savings_rate = ((float(monthly_income) - float(monthly_expense)) / float(monthly_income) * 100) if float(monthly_income) > 0 else 0

    category_spending = db.query(
        Category.name, Category.color, func.sum(Transaction.amount).label("total")
    ).join(Transaction, Category.id == Transaction.category_id).filter(
        Transaction.user_id == current_user.id,
        Transaction.type == "expense",
        Transaction.transaction_date >= thirty_days_ago,
    ).group_by(Category.id).order_by(func.sum(Transaction.amount).desc()).all()

    monthly_trend = []
    for i in range(5, -1, -1):
        d = datetime(now.year, now.month, 1)
        month = d.month - i
        year = d.year
        while month <= 0:
            month += 12
            year -= 1
        month_start = datetime(year, month, 1).date()
        if month == 12:
            month_end = datetime(year + 1, 1, 1).date()
        else:
            month_end = datetime(year, month + 1, 1).date()
        month_label = month_start.strftime("%b %Y")

        inc = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == current_user.id, Transaction.type == "income",
            Transaction.transaction_date >= month_start, Transaction.transaction_date < month_end,
        ).scalar() or 0

        exp = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == current_user.id, Transaction.type == "expense",
            Transaction.transaction_date >= month_start, Transaction.transaction_date < month_end,
        ).scalar() or 0

        monthly_trend.append({"month": month_label, "income": float(inc), "expense": float(exp)})

    recent_tx = db.query(Transaction, Category).join(Category, Transaction.category_id == Category.id).filter(
        Transaction.user_id == current_user.id
    ).order_by(Transaction.transaction_date.desc()).limit(5).all()

    return ApiResponse(data={
        "summary": {
            "monthly_income": float(monthly_income),
            "monthly_expense": float(monthly_expense),
            "net_savings": float(monthly_income) - float(monthly_expense),
            "savings_rate": round(max(0, savings_rate), 2),
            "transaction_count_30d": tx_count_30d,
        },
        "category_spending": [
            {"name": name or "Unknown", "color": color or "#3b82f6", "amount": float(total)}
            for name, color, total in category_spending
        ],
        "monthly_trend": monthly_trend,
        "recent_transactions": [
            {
                "id": tx.id, "type": tx.type, "amount": float(tx.amount),
                "description": tx.description, "transaction_date": tx.transaction_date,
                "category_name": cat.name if cat else None,
                "category_icon": cat.icon if cat else None,
                "category_color": cat.color if cat else None,
            }
            for tx, cat in recent_tx
        ],
    })


@router.get("/spending-by-category", response_model=ApiResponse[list[dict]])
def spending_by_category(
    start_date: str | None = Query(None),
    end_date: str | None = Query(None),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    query = db.query(Category.name, Category.color, func.sum(Transaction.amount).label("total")).join(
        Transaction, Category.id == Transaction.category_id
    ).filter(Transaction.user_id == current_user.id, Transaction.type == "expense")

    if start_date:
        query = query.filter(Transaction.transaction_date >= start_date)
    if end_date:
        query = query.filter(Transaction.transaction_date <= end_date)

    results = query.group_by(Category.id).order_by(func.sum(Transaction.amount).desc()).all()
    total = sum(float(r[2]) for r in results) or 1

    return ApiResponse(data=[
        {
            "name": name or "Unknown",
            "color": color or "#3b82f6",
            "amount": float(amount),
            "percentage": round((float(amount) / total) * 100, 2),
        }
        for name, color, amount in results
    ])


@router.get("/monthly-trend", response_model=ApiResponse[list[dict]])
def monthly_trend(
    months: int = Query(6, ge=1, le=24),
    current_user = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    now = datetime.utcnow()
    data = []
    for i in range(months - 1, -1, -1):
        month = now.month - i
        year = now.year
        while month <= 0:
            month += 12
            year -= 1
        month_start = datetime(year, month, 1).date()
        if month == 12:
            month_end = datetime(year + 1, 1, 1).date()
        else:
            month_end = datetime(year, month + 1, 1).date()
        month_label = month_start.strftime("%b")

        inc = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == current_user.id, Transaction.type == "income",
            Transaction.transaction_date >= month_start, Transaction.transaction_date < month_end,
        ).scalar() or 0

        exp = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
            Transaction.user_id == current_user.id, Transaction.type == "expense",
            Transaction.transaction_date >= month_start, Transaction.transaction_date < month_end,
        ).scalar() or 0

        data.append({"month": month_label, "income": float(inc), "expense": float(exp)})

    return ApiResponse(data=data)
