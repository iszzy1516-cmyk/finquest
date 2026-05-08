"""Gamification engine: XP, levels, achievements, streaks."""

from datetime import date, datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.transaction import Transaction
from app.models.gamification import XPRecord, Achievement, UserAchievement, Streak
from app.models.goal import Goal
from app.constants import XP_TABLE, calculate_level, xp_to_next_level, xp_progress_to_next_level


def ensure_streak(db: Session, user_id: int) -> Streak:
    streak = db.query(Streak).filter(Streak.user_id == user_id).first()
    if not streak:
        streak = Streak(user_id=user_id, current_streak=0, longest_streak=0)
        db.add(streak)
        db.commit()
        db.refresh(streak)
    return streak


def update_streak(db: Session, user_id: int):
    streak = ensure_streak(db, user_id)
    today = date.today()

    if streak.last_login_date is None:
        streak.current_streak = 1
        streak.longest_streak = 1
    elif streak.last_login_date == today:
        return {"streak": streak.current_streak, "xp_gained": 0, "bonus_xp": 0, "is_milestone": False}
    elif streak.last_login_date == today - timedelta(days=1):
        streak.current_streak += 1
        if streak.current_streak > streak.longest_streak:
            streak.longest_streak = streak.current_streak
    else:
        streak.streak_broken_at = datetime.utcnow()
        streak.current_streak = 1

    streak.last_login_date = today
    db.commit()

    xp_gained = XP_TABLE.get("daily_login", 20)
    bonus_xp = 0
    if streak.current_streak == 7:
        bonus_xp = XP_TABLE.get("streak_7", 50)
    elif streak.current_streak == 30:
        bonus_xp = XP_TABLE.get("streak_30", 200)
    elif streak.current_streak == 100:
        bonus_xp = XP_TABLE.get("streak_100", 1000)

    total = xp_gained + bonus_xp
    if total > 0:
        add_xp(db, user_id, total, f"streak_{streak.current_streak}", f"Daily streak: {streak.current_streak} days")

    return {"streak": streak.current_streak, "xp_gained": total, "bonus_xp": bonus_xp, "is_milestone": bonus_xp > 0}


def add_xp(db: Session, user_id: int, amount: int, source: str, description: str):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return None

    new_total = user.total_xp_earned + amount
    new_level = calculate_level(new_total)
    level_up = new_level > user.current_level

    db.add(XPRecord(user_id=user_id, amount=amount, source=source, description=description))
    user.current_xp = new_total
    user.total_xp_earned = new_total
    user.current_level = new_level
    db.commit()

    return {"xp_gained": amount, "total_xp": new_total, "current_level": new_level, "level_up": level_up}


def check_achievements(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    unlocked_list = []
    total_xp = 0

    already = db.query(UserAchievement.achievement_id).filter(UserAchievement.user_id == user_id).all()
    already_ids = {a[0] for a in already}

    achievements = db.query(Achievement).all()

    tx_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
    unique_cats = db.query(Transaction.category_id).filter(Transaction.user_id == user_id).distinct().count()

    income = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id, Transaction.type == "income"
    ).scalar() or 0
    expense = db.query(func.coalesce(func.sum(Transaction.amount), 0)).filter(
        Transaction.user_id == user_id, Transaction.type == "expense"
    ).scalar() or 0
    savings_rate = ((float(income) - float(expense)) / float(income) * 100) if float(income) > 0 else 0

    goal_count = db.query(Goal).filter(Goal.user_id == user_id).count()
    completed_goals = db.query(Goal).filter(Goal.user_id == user_id, Goal.current_amount >= Goal.target_amount).count()

    streak = ensure_streak(db, user_id)

    for ach in achievements:
        if ach.id in already_ids:
            continue
        unlock = False
        if ach.condition_type == "count":
            if ach.category == "transaction":
                if ach.name == "Category Explorer":
                    unlock = unique_cats >= ach.condition_value
                else:
                    unlock = tx_count >= ach.condition_value
            elif ach.category == "goal":
                if ach.name == "Goal Setter":
                    unlock = goal_count >= ach.condition_value
                elif ach.name == "Goal Crusher":
                    unlock = completed_goals >= ach.condition_value
        elif ach.condition_type == "streak":
            unlock = streak.current_streak >= ach.condition_value
        elif ach.condition_type == "level":
            unlock = user.current_level >= ach.condition_value
        elif ach.condition_type == "percentage":
            unlock = savings_rate >= ach.condition_value

        if unlock:
            db.add(UserAchievement(user_id=user_id, achievement_id=ach.id))
            unlocked_list.append({
                "id": ach.id, "name": ach.name, "description": ach.description,
                "icon": ach.icon, "xp_reward": ach.xp_reward,
            })
            total_xp += ach.xp_reward

    if total_xp > 0:
        add_xp(db, user_id, total_xp, "achievement_unlock", f"Unlocked {len(unlocked_list)} achievement(s)")

    db.commit()
    return {"achievements_unlocked": unlocked_list, "total_xp_gained": total_xp}


def process_gamification_event(db: Session, user_id: int, event_type: str, metadata: dict = None):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return {"xp_gained": 0, "total_xp": 0, "current_level": 1, "xp_to_next_level": 100, "level_up": False, "achievements_unlocked": [], "streak_bonus": None}

    total_xp_gained = 0
    streak_result = update_streak(db, user_id)
    if streak_result["xp_gained"] > 0:
        total_xp_gained += streak_result["xp_gained"]

    if event_type == "transaction_created":
        xp = XP_TABLE.get("add_transaction", 10)
        add_xp(db, user_id, xp, "add_transaction", "Added a transaction")
        total_xp_gained += xp
    elif event_type == "budget_met":
        xp = XP_TABLE.get("budget_met", 25)
        add_xp(db, user_id, xp, "budget_met", "Stayed under budget")
        total_xp_gained += xp
    elif event_type == "goal_created":
        xp = 10
        add_xp(db, user_id, xp, "goal_created", "Created a goal")
        total_xp_gained += xp
    elif event_type == "goal_contributed":
        if metadata and metadata.get("milestone"):
            xp = XP_TABLE.get(f"goal_milestone_{metadata['milestone']}", 0)
            if xp:
                add_xp(db, user_id, xp, f"goal_milestone_{metadata['milestone']}", f"Goal milestone: {metadata['milestone']}%")
                total_xp_gained += xp
        if metadata and metadata.get("completed"):
            xp = XP_TABLE.get("goal_complete", 500)
            add_xp(db, user_id, xp, "goal_complete", "Completed a goal")
            total_xp_gained += xp

    ach_result = check_achievements(db, user_id)
    total_xp_gained += ach_result["total_xp_gained"]

    user = db.query(User).filter(User.id == user_id).first()
    current_level = user.current_level
    xp_for_next = xp_to_next_level(current_level)
    progress, _ = xp_progress_to_next_level(user.total_xp_earned, current_level)

    return {
        "xp_gained": total_xp_gained,
        "total_xp": user.total_xp_earned,
        "current_level": current_level,
        "xp_to_next_level": xp_for_next,
        "level_up": current_level > (metadata.get("old_level") if metadata else current_level),
        "achievements_unlocked": ach_result["achievements_unlocked"],
        "streak_bonus": streak_result if streak_result["xp_gained"] > 0 else None,
    }


def get_gamification_progress(db: Session, user_id: int):
    user = db.query(User).filter(User.id == user_id).first()
    streak = ensure_streak(db, user_id)
    xp_for_next = xp_to_next_level(user.current_level)
    progress, _ = xp_progress_to_next_level(user.total_xp_earned, user.current_level)
    percent = (progress / xp_for_next) * 100 if xp_for_next > 0 else 0

    recent_xp = db.query(XPRecord).filter(XPRecord.user_id == user_id).order_by(XPRecord.created_at.desc()).limit(10).all()

    return {
        "current_xp": user.current_xp,
        "current_level": user.current_level,
        "total_xp_earned": user.total_xp_earned,
        "xp_to_next_level": xp_for_next,
        "xp_progress": progress,
        "xp_progress_percent": round(percent, 2),
        "current_streak": streak.current_streak,
        "longest_streak": streak.longest_streak,
        "last_active_date": streak.last_login_date,
        "recent_xp_records": [{"id": x.id, "amount": x.amount, "source": x.source, "description": x.description, "created_at": x.created_at} for x in recent_xp],
    }


def get_user_achievements(db: Session, user_id: int):
    unlocked = db.query(UserAchievement, Achievement).join(Achievement, UserAchievement.achievement_id == Achievement.id).filter(
        UserAchievement.user_id == user_id
    ).all()

    all_achievements = db.query(Achievement).all()
    unlocked_ids = {ua.achievement_id for ua, _ in unlocked}

    user = db.query(User).filter(User.id == user_id).first()
    tx_count = db.query(Transaction).filter(Transaction.user_id == user_id).count()
    unique_cats = db.query(Transaction.category_id).filter(Transaction.user_id == user_id).distinct().count()
    streak = ensure_streak(db, user_id)

    locked = []
    for ach in all_achievements:
        if ach.id in unlocked_ids:
            continue
        progress = 0
        if ach.condition_type == "count":
            if ach.category == "transaction":
                progress = unique_cats if ach.name == "Category Explorer" else tx_count
        elif ach.condition_type == "streak":
            progress = streak.current_streak
        elif ach.condition_type == "level":
            progress = user.current_level
        percent = min(100, round((progress / ach.condition_value) * 100)) if ach.condition_value > 0 else 0
        locked.append({
            "id": ach.id, "name": ach.name, "description": ach.description,
            "icon": ach.icon, "xp_reward": ach.xp_reward, "category": ach.category,
            "condition_type": ach.condition_type, "condition_value": ach.condition_value,
            "progress": progress, "progress_percent": percent,
        })

    return {
        "unlocked": [
            {
                "id": ua.id, "achievement_id": ach.id, "name": ach.name,
                "description": ach.description, "icon": ach.icon, "xp_reward": ach.xp_reward,
                "category": ach.category, "unlocked_at": ua.unlocked_at,
            } for ua, ach in unlocked
        ],
        "locked": locked,
    }
