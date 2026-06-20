#!/usr/bin/env python3
"""Seed test users with realistic financial data for demos."""

import os
import sys
from datetime import datetime, timedelta, date
from decimal import Decimal

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, engine, Base
from app.models import (
    User, Transaction, Category, Budget, Goal,
    Achievement, UserAchievement, XPRecord, RefreshToken,
    NotificationPreference,
)
from app.auth.security import get_password_hash
from app.services.gamification_service import process_gamification_event
from app.constants import DEFAULT_CATEGORIES, ACHIEVEMENT_DEFINITIONS


def seed():
    # Ensure all database tables exist
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Seed default categories
        for cat in DEFAULT_CATEGORIES:
            exists = db.query(Category).filter(Category.name == cat["name"], Category.is_default == True).first()
            if not exists:
                db.add(Category(**cat, is_default=True))

        # Seed achievements
        for ach in ACHIEVEMENT_DEFINITIONS:
            exists = db.query(Achievement).filter(Achievement.name == ach["name"]).first()
            if not exists:
                db.add(Achievement(**ach))

        db.commit()

        # Create test users
        test_usernames = ["alice", "bob", "charlie", "demo"]
        for uname in test_usernames:
            existing = db.query(User).filter(User.username == uname).first()
            if existing:
                print(f"User '{uname}' already exists, skipping...")
                continue

            user = _create_user(db, uname)
            _create_transactions(db, user)
            _create_budgets(db, user)
            _create_goals(db, user)
            _create_achievements(db, user)
            _create_notifications(db, user)
            db.commit()
            print(f"Created user '{uname}' (id={user.id}) with full test data")

        print("\nDone! You can log in with any of these accounts:")
        for uname in test_usernames:
            print(f"  Username: {uname}  |  Password: password123")
    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


def _create_user(db, username: str) -> User:
    user = User(
        email=f"{username}@example.com",
        username=username,
        hashed_password=get_password_hash("password123"),
        full_name=username.capitalize(),
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Create notification preferences
    prefs = NotificationPreference(
        user_id=user.id,
        email_enabled=True,
        push_enabled=False,
        budget_alerts=True,
        streak_reminders=True,
        achievement_notifications=True,
        weekly_summary=True,
        recurring_reminders=False,
        ai_insights=True,
        social_notifications=False,
        security_alerts=True,
    )
    db.add(prefs)
    db.commit()
    return user


def _create_transactions(db, user: User):
    # Get categories
    cats = db.query(Category).all()
    cat_map = {c.name: c for c in cats}

    # Income transactions
    incomes = [
        ("Salary", date(2026, 1, 1), "5000.00"),
        ("Salary", date(2026, 2, 1), "5000.00"),
        ("Salary", date(2026, 3, 1), "5000.00"),
        ("Salary", date(2026, 4, 1), "5000.00"),
        ("Salary", date(2026, 5, 1), "5000.00"),
        ("Freelance", date(2026, 1, 15), "800.00"),
        ("Freelance", date(2026, 2, 20), "1200.00"),
        ("Freelance", date(2026, 3, 18), "600.00"),
        ("Investments", date(2026, 4, 10), "350.00"),
    ]

    for name, date_str, amount in incomes:
        cat = cat_map.get(name)
        tx = Transaction(
            user_id=user.id,
            type="income",
            amount=Decimal(amount),
            category_id=cat.id if cat else None,
            description=f"{name} payment",
            transaction_date=date_str,
            currency="USD",
        )
        db.add(tx)
        db.commit()
        process_gamification_event(db, user.id, "transaction_created")

    # Expense transactions
    expenses = [
        ("Food", date(2026, 1, 2), "45.00", "Grocery run"),
        ("Food", date(2026, 1, 5), "12.50", "Lunch"),
        ("Food", date(2026, 1, 10), "85.00", "Weekly groceries"),
        ("Food", date(2026, 1, 12), "8.00", "Coffee"),
        ("Food", date(2026, 1, 18), "120.00", "Dinner out"),
        ("Food", date(2026, 2, 1), "60.00", "Groceries"),
        ("Food", date(2026, 2, 8), "15.00", "Lunch"),
        ("Food", date(2026, 3, 5), "95.00", "Groceries"),
        ("Food", date(2026, 4, 12), "22.00", "Takeout"),
        ("Food", date(2026, 5, 3), "55.00", "Groceries"),
        ("Transport", date(2026, 1, 3), "40.00", "Gas"),
        ("Transport", date(2026, 1, 20), "35.00", "Gas"),
        ("Transport", date(2026, 2, 15), "42.00", "Gas"),
        ("Transport", date(2026, 3, 10), "38.00", "Gas"),
        ("Transport", date(2026, 4, 25), "45.00", "Gas"),
        ("Entertainment", date(2026, 1, 8), "25.00", "Movie night"),
        ("Entertainment", date(2026, 2, 14), "60.00", "Concert tickets"),
        ("Entertainment", date(2026, 3, 22), "15.00", "Streaming sub"),
        ("Entertainment", date(2026, 4, 30), "45.00", "Game purchase"),
        ("Shopping", date(2026, 1, 15), "120.00", "New shoes"),
        ("Shopping", date(2026, 2, 28), "85.00", "Clothes"),
        ("Shopping", date(2026, 4, 5), "200.00", "Electronics"),
        ("Bills", date(2026, 1, 1), "120.00", "Electric bill"),
        ("Bills", date(2026, 1, 1), "80.00", "Internet"),
        ("Bills", date(2026, 2, 1), "115.00", "Electric bill"),
        ("Bills", date(2026, 2, 1), "80.00", "Internet"),
        ("Bills", date(2026, 3, 1), "130.00", "Electric bill"),
        ("Bills", date(2026, 3, 1), "80.00", "Internet"),
        ("Bills", date(2026, 4, 1), "110.00", "Electric bill"),
        ("Bills", date(2026, 4, 1), "80.00", "Internet"),
        ("Bills", date(2026, 5, 1), "125.00", "Electric bill"),
        ("Bills", date(2026, 5, 1), "80.00", "Internet"),
        ("Health", date(2026, 1, 25), "50.00", "Pharmacy"),
        ("Health", date(2026, 3, 15), "120.00", "Doctor visit"),
        ("Education", date(2026, 2, 1), "200.00", "Online course"),
        ("Education", date(2026, 4, 20), "50.00", "Books"),
    ]

    for name, date_str, amount, desc in expenses:
        cat = cat_map.get(name)
        tx = Transaction(
            user_id=user.id,
            type="expense",
            amount=Decimal(amount),
            category_id=cat.id if cat else None,
            description=desc,
            transaction_date=date_str,
            currency="USD",
        )
        db.add(tx)
        db.commit()
        process_gamification_event(db, user.id, "transaction_created")


def _create_budgets(db, user: User):
    budgets = [
        ("Food Budget", 4, Decimal("400.00"), date(2026, 5, 1), date(2026, 5, 31), 0.8),
        ("Transport Budget", 5, Decimal("200.00"), date(2026, 5, 1), date(2026, 5, 31), 0.75),
        ("Entertainment Budget", 6, Decimal("150.00"), date(2026, 5, 1), date(2026, 5, 31), 0.9),
        ("Shopping Budget", 7, Decimal("300.00"), date(2026, 5, 1), date(2026, 5, 31), 0.85),
    ]
    for name, cat_id, amount, start, end, threshold in budgets:
        b = Budget(
            user_id=user.id,
            name=name,
            category_id=cat_id,
            amount=amount,
            period_start=start,
            period_end=end,
            alert_threshold=threshold,
        )
        db.add(b)
    db.commit()


def _create_goals(db, user: User):
    goals = [
        ("Emergency Fund", Decimal("5000.00"), Decimal("2500.00"), date(2026, 12, 31)),
        ("Vacation to Japan", Decimal("3000.00"), Decimal("800.00"), date(2026, 9, 1)),
        ("New Laptop", Decimal("1500.00"), Decimal("1500.00"), date(2026, 6, 30)),
        ("Car Down Payment", Decimal("10000.00"), Decimal("2000.00"), date(2027, 3, 1)),
    ]
    for name, target, current, deadline in goals:
        g = Goal(
            user_id=user.id,
            name=name,
            target_amount=target,
            current_amount=current,
            deadline=deadline,
        )
        db.add(g)
    db.commit()


def _create_achievements(db, user: User):
    # Unlock a few achievements for variety
    achievements = db.query(Achievement).limit(3).all()
    for ach in achievements:
        exists = db.query(UserAchievement).filter(
            UserAchievement.user_id == user.id,
            UserAchievement.achievement_id == ach.id,
        ).first()
        if not exists:
            ua = UserAchievement(
                user_id=user.id,
                achievement_id=ach.id,
            )
            db.add(ua)
            # XP record
            xp = XPRecord(
                user_id=user.id,
                amount=ach.xp_reward,
                source="achievement_unlocked",
                description=f"Unlocked: {ach.name}",
            )
            db.add(xp)
    db.commit()


def _create_notifications(db, user: User):
    from app.models.notification import Notification
    notifications = [
        ("welcome", "Welcome to FinQuest!", "Start tracking your finances and earn XP."),
        ("achievement", "Achievement Unlocked!", "You've earned your first badge."),
        ("budget_alert", "Budget Alert", "You're at 80% of your Food Budget."),
        ("streak", "Streak Started!", "You've started a 1-day login streak."),
    ]
    for notif_type, title, body in notifications:
        n = Notification(
            user_id=user.id,
            type=notif_type,
            title=title,
            body=body,
            data={},
            read=notif_type == "welcome",
        )
        db.add(n)
    db.commit()


if __name__ == "__main__":
    seed()
