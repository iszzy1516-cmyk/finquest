"""Notification service."""

from datetime import datetime, timedelta, time
from typing import Optional, List
from sqlalchemy.orm import Session

from app.models.notification import Notification, NotificationPreference
from app.models.user import User


class NotificationService:
    def __init__(self, db: Session):
        self.db = db

    def get_preferences(self, user_id: int) -> NotificationPreference:
        prefs = self.db.query(NotificationPreference).filter(
            NotificationPreference.user_id == user_id
        ).first()
        if not prefs:
            prefs = NotificationPreference(user_id=user_id)
            self.db.add(prefs)
            self.db.commit()
            self.db.refresh(prefs)
        return prefs

    def update_preferences(self, user_id: int, data: dict) -> NotificationPreference:
        prefs = self.get_preferences(user_id)
        for key, value in data.items():
            if hasattr(prefs, key):
                setattr(prefs, key, value)
        prefs.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(prefs)
        return prefs

    def create_notification(self, user_id: int, type: str, title: str, body: str, data: dict = None) -> Notification:
        prefs = self.get_preferences(user_id)
        type_enabled = getattr(prefs, f"{type}_enabled", True)
        if not type_enabled:
            return None

        notif = Notification(
            user_id=user_id,
            type=type,
            title=title,
            body=body,
            data=data or {},
            expires_at=datetime.utcnow() + timedelta(days=7),
        )
        self.db.add(notif)
        self.db.commit()
        self.db.refresh(notif)
        return notif

    def get_notifications(self, user_id: int, unread_only: bool = False) -> List[Notification]:
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.read == False)
        return query.order_by(Notification.created_at.desc()).all()

    def mark_as_read(self, notification_id: int, user_id: int) -> Optional[Notification]:
        notif = self.db.query(Notification).filter(
            Notification.id == notification_id, Notification.user_id == user_id
        ).first()
        if notif:
            notif.read = True
            notif.read_at = datetime.utcnow()
            self.db.commit()
        return notif

    def mark_all_read(self, user_id: int):
        self.db.query(Notification).filter(
            Notification.user_id == user_id, Notification.read == False
        ).update({"read": True, "read_at": datetime.utcnow()})
        self.db.commit()

    def dismiss_notification(self, notification_id: int, user_id: int) -> bool:
        notif = self.db.query(Notification).filter(
            Notification.id == notification_id, Notification.user_id == user_id
        ).first()
        if notif:
            notif.dismissed = True
            self.db.commit()
            return True
        return False

    def delete_notification(self, notification_id: int, user_id: int) -> bool:
        notif = self.db.query(Notification).filter(
            Notification.id == notification_id, Notification.user_id == user_id
        ).first()
        if notif:
            self.db.delete(notif)
            self.db.commit()
            return True
        return False

    def send_budget_alert(self, user_id: int, budget_name: str, percentage: float):
        if percentage >= 100:
            self.create_notification(
                user_id=user_id, type="budget_alerts",
                title="Budget Exceeded",
                body=f"You have exceeded your '{budget_name}' budget.",
                data={"budget_name": budget_name, "percentage": percentage}
            )
        elif percentage >= 80:
            self.create_notification(
                user_id=user_id, type="budget_alerts",
                title="Budget Warning",
                body=f"You have used {percentage:.0f}% of your '{budget_name}' budget.",
                data={"budget_name": budget_name, "percentage": percentage}
            )

    def send_achievement_notification(self, user_id: int, achievement_name: str, xp_reward: int):
        self.create_notification(
            user_id=user_id, type="achievement_notifications",
            title="Achievement Unlocked!",
            body=f"You unlocked '{achievement_name}'! +{xp_reward} XP",
            data={"achievement": achievement_name, "xp": xp_reward}
        )

    def send_streak_reminder(self, user_id: int, streak: int):
        self.create_notification(
            user_id=user_id, type="streak_reminders",
            title="Keep Your Streak Alive!",
            body=f"You have a {streak}-day streak. Log in today to keep it going!",
            data={"streak": streak}
        )
