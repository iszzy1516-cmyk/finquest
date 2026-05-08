"""Export/Import service."""

import csv
import json
from io import StringIO
from datetime import datetime, date
from typing import Optional
from sqlalchemy.orm import Session

from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.models.goal import Goal


class ExportService:
    def __init__(self, db: Session):
        self.db = db

    def export_transactions_csv(self, user_id: int, start_date: Optional[date] = None, end_date: Optional[date] = None) -> str:
        query = self.db.query(Transaction).filter(Transaction.user_id == user_id)
        if start_date:
            query = query.filter(Transaction.transaction_date >= start_date)
        if end_date:
            query = query.filter(Transaction.transaction_date <= end_date)
        transactions = query.order_by(Transaction.transaction_date.desc()).all()

        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Date", "Type", "Category", "Amount", "Currency", "Description", "Created At"])
        for tx in transactions:
            cat = self.db.query(Category).filter(Category.id == tx.category_id).first()
            writer.writerow([
                tx.transaction_date.isoformat() if tx.transaction_date else "",
                tx.type,
                cat.name if cat else "",
                str(tx.amount),
                tx.currency or "USD",
                tx.description or "",
                tx.created_at.isoformat() if tx.created_at else "",
            ])
        return output.getvalue()

    def export_full_json(self, user_id: int) -> dict:
        transactions = self.db.query(Transaction).filter(Transaction.user_id == user_id).all()
        categories = self.db.query(Category).filter(
            (Category.user_id == user_id) | (Category.is_default == True)
        ).all()
        budgets = self.db.query(Budget).filter(Budget.user_id == user_id).all()
        goals = self.db.query(Goal).filter(Goal.user_id == user_id).all()

        return {
            "export_metadata": {
                "version": "1.0",
                "exported_at": datetime.utcnow().isoformat(),
                "user_id": user_id,
            },
            "transactions": [
                {
                    "id": tx.id, "type": tx.type, "amount": str(tx.amount),
                    "currency": tx.currency or "USD",
                    "category_id": tx.category_id,
                    "description": tx.description,
                    "transaction_date": tx.transaction_date.isoformat() if tx.transaction_date else None,
                    "created_at": tx.created_at.isoformat() if tx.created_at else None,
                }
                for tx in transactions
            ],
            "categories": [
                {"id": c.id, "name": c.name, "type": c.type, "icon": c.icon, "color": c.color}
                for c in categories
            ],
            "budgets": [
                {"id": b.id, "name": b.name, "amount": str(b.amount), "period_start": b.period_start.isoformat() if b.period_start else None, "period_end": b.period_end.isoformat() if b.period_end else None}
                for b in budgets
            ],
            "goals": [
                {"id": g.id, "name": g.name, "target_amount": str(g.target_amount), "current_amount": str(g.current_amount), "deadline": g.deadline.isoformat() if g.deadline else None}
                for g in goals
            ],
        }


class ImportService:
    def __init__(self, db: Session):
        self.db = db

    def import_csv(self, user_id: int, csv_content: str) -> dict:
        results = {"imported": 0, "errors": [], "skipped": 0}
        reader = csv.DictReader(StringIO(csv_content))
        for row_num, row in enumerate(reader, 2):
            try:
                date_str = row.get("Date", "")
                amount_str = row.get("Amount", "")
                if not date_str or not amount_str:
                    results["errors"].append(f"Row {row_num}: Missing required fields")
                    continue

                category_name = row.get("Category", "Uncategorized")
                category = self.db.query(Category).filter(
                    Category.name == category_name,
                    (Category.user_id == user_id) | (Category.is_default == True)
                ).first()
                if not category:
                    category = Category(name=category_name, type="expense", user_id=user_id)
                    self.db.add(category)
                    self.db.flush()

                tx = Transaction(
                    user_id=user_id,
                    type=row.get("Type", "expense").lower(),
                    amount=amount_str,
                    category_id=category.id,
                    description=row.get("Description"),
                    transaction_date=datetime.strptime(date_str, "%Y-%m-%d").date(),
                    currency=row.get("Currency", "USD"),
                )
                self.db.add(tx)
                results["imported"] += 1
            except Exception as e:
                results["errors"].append(f"Row {row_num}: {str(e)}")
        self.db.commit()
        return results

    def import_json(self, user_id: int, data: dict) -> dict:
        results = {"imported": {"transactions": 0, "categories": 0, "budgets": 0, "goals": 0}}

        for cat_data in data.get("categories", []):
            existing = self.db.query(Category).filter(
                Category.name == cat_data["name"], Category.user_id == user_id
            ).first()
            if not existing:
                category = Category(
                    name=cat_data["name"], type=cat_data.get("type", "expense"),
                    icon=cat_data.get("icon"), color=cat_data.get("color"), user_id=user_id
                )
                self.db.add(category)
                results["imported"]["categories"] += 1
        self.db.flush()

        for tx_data in data.get("transactions", []):
            category = self.db.query(Category).filter(
                Category.name == tx_data.get("category"), Category.user_id == user_id
            ).first()
            tx = Transaction(
                user_id=user_id, type=tx_data["type"], amount=str(tx_data["amount"]),
                currency=tx_data.get("currency", "USD"),
                category_id=category.id if category else None,
                description=tx_data.get("description"),
                transaction_date=datetime.fromisoformat(tx_data["transaction_date"]).date() if tx_data.get("transaction_date") else datetime.utcnow().date(),
            )
            self.db.add(tx)
            results["imported"]["transactions"] += 1

        for b_data in data.get("budgets", []):
            budget = Budget(
                user_id=user_id, name=b_data["name"], amount=str(b_data["amount"]),
                period_start=datetime.fromisoformat(b_data["period_start"]).date() if b_data.get("period_start") else datetime.utcnow().date(),
                period_end=datetime.fromisoformat(b_data["period_end"]).date() if b_data.get("period_end") else datetime.utcnow().date(),
            )
            self.db.add(budget)
            results["imported"]["budgets"] += 1

        for g_data in data.get("goals", []):
            goal = Goal(
                user_id=user_id, name=g_data["name"], target_amount=str(g_data["target_amount"]),
                current_amount=str(g_data.get("current_amount", "0")),
                deadline=datetime.fromisoformat(g_data["deadline"]).date() if g_data.get("deadline") else None,
            )
            self.db.add(goal)
            results["imported"]["goals"] += 1

        self.db.commit()
        return results
