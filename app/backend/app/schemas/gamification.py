"""Gamification Pydantic schemas."""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


class XPRecordResponse(BaseModel):
    id: int
    amount: int
    source: str
    description: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class AchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    xp_reward: int
    category: str
    condition_type: str
    condition_value: int

    class Config:
        from_attributes = True


class UnlockedAchievementResponse(BaseModel):
    id: int
    achievement_id: int
    name: str
    description: str
    icon: str
    xp_reward: int
    category: str
    unlocked_at: datetime

    class Config:
        from_attributes = True


class LockedAchievementResponse(BaseModel):
    id: int
    name: str
    description: str
    icon: str
    xp_reward: int
    category: str
    condition_type: str
    condition_value: int
    progress: int
    progress_percent: int


class ProgressResponse(BaseModel):
    current_xp: int
    current_level: int
    total_xp_earned: int
    xp_to_next_level: int
    xp_progress: int
    xp_progress_percent: float
    current_streak: int
    longest_streak: int
    last_active_date: Optional[datetime]
    recent_xp_records: List[XPRecordResponse]


class LevelResponse(BaseModel):
    level: int
    xp_required: int
    xp_in_level: int


class GamificationDelta(BaseModel):
    xp_gained: int
    total_xp: int
    current_level: int
    xp_to_next_level: int
    level_up: bool
    achievements_unlocked: List[UnlockedAchievementResponse]
    streak_bonus: Optional[dict] = None


class LeaderboardEntryResponse(BaseModel):
    rank: int
    user_id: int
    name: str
    level: int
    xp: int
    streak: int
    longest_streak: int
