"""Application constants: XP values, level thresholds, achievement definitions."""

from decimal import Decimal
from typing import List, Dict, Any


# ─── XP Values Table ───
XP_TABLE: Dict[str, int] = {
    "add_transaction": 10,
    "daily_login": 20,
    "streak_7": 50,
    "streak_30": 200,
    "streak_100": 1000,
    "achievement_unlock": 0,  # variable from achievement.xp_reward
    "level_up": 0,            # variable: level * 50
    "budget_met": 25,
    "savings_goal_20pct": 150,
    "savings_goal_50pct": 500,
    "goal_created": 10,
    "goal_contributed": 10,
    "goal_milestone_25": 50,
    "goal_milestone_50": 100,
    "goal_milestone_75": 200,
    "goal_complete": 500,
}


# ─── Achievement Definitions ───
ACHIEVEMENT_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "name": "First Steps",
        "description": "Add your first transaction",
        "icon": "Footprints",
        "xp_reward": 50,
        "condition_type": "count",
        "condition_value": 1,
        "category": "transaction",
    },
    {
        "name": "Double Digit",
        "description": "Add 10 transactions",
        "icon": "Hash",
        "xp_reward": 75,
        "condition_type": "count",
        "condition_value": 10,
        "category": "transaction",
    },
    {
        "name": "Half Century",
        "description": "Add 50 transactions",
        "icon": "Award",
        "xp_reward": 200,
        "condition_type": "count",
        "condition_value": 50,
        "category": "transaction",
    },
    {
        "name": "Transaction Pro",
        "description": "Add 100 transactions",
        "icon": "Receipt",
        "xp_reward": 300,
        "condition_type": "count",
        "condition_value": 100,
        "category": "transaction",
    },
    {
        "name": "Category Explorer",
        "description": "Use 5 different categories",
        "icon": "Compass",
        "xp_reward": 75,
        "condition_type": "unique_count",
        "condition_value": 5,
        "category": "transaction",
    },
    {
        "name": "Streak Keeper",
        "description": "Maintain a 7-day login streak",
        "icon": "Flame",
        "xp_reward": 100,
        "condition_type": "streak",
        "condition_value": 7,
        "category": "streak",
    },
    {
        "name": "Dedicated Saver",
        "description": "Maintain a 30-day login streak",
        "icon": "Crown",
        "xp_reward": 500,
        "condition_type": "streak",
        "condition_value": 30,
        "category": "streak",
    },
    {
        "name": "Savings Hero",
        "description": "Save 20% of total income",
        "icon": "PiggyBank",
        "xp_reward": 150,
        "condition_type": "percentage",
        "condition_value": 20,
        "category": "savings",
    },
    {
        "name": "Master Saver",
        "description": "Save 50% of total income",
        "icon": "Banknote",
        "xp_reward": 500,
        "condition_type": "percentage",
        "condition_value": 50,
        "category": "savings",
    },
    {
        "name": "Level 5 Reached",
        "description": "Reach level 5",
        "icon": "Star",
        "xp_reward": 200,
        "condition_type": "level",
        "condition_value": 5,
        "category": "level",
    },
    {
        "name": "Level 10 Reached",
        "description": "Reach level 10",
        "icon": "Trophy",
        "xp_reward": 500,
        "condition_type": "level",
        "condition_value": 10,
        "category": "level",
    },
    {
        "name": "Budget Master",
        "description": "Stay under budget for a full period",
        "icon": "Target",
        "xp_reward": 100,
        "condition_type": "budget",
        "condition_value": 1,
        "category": "budget",
    },
    {
        "name": "Goal Setter",
        "description": "Create your first goal",
        "icon": "Flag",
        "xp_reward": 25,
        "condition_type": "count",
        "condition_value": 1,
        "category": "goal",
    },
    {
        "name": "Goal Crusher",
        "description": "Complete a goal",
        "icon": "CheckCircle",
        "xp_reward": 500,
        "condition_type": "count",
        "condition_value": 1,
        "category": "goal",
    },
]


# ─── Level Formula ───
def calculate_level(xp: int) -> int:
    """Calculate level from total XP. Each level needs level*100 XP."""
    level = 1
    xp_needed = 100
    remaining = xp
    while remaining >= xp_needed:
        remaining -= xp_needed
        level += 1
        xp_needed = level * 100
    return level


def xp_to_next_level(current_level: int) -> int:
    return current_level * 100


def xp_progress_to_next_level(current_xp: int, current_level: int):
    """Return (current_progress, total_needed) for the current level."""
    spent = sum(l * 100 for l in range(1, current_level))
    progress = current_xp - spent
    needed = current_level * 100
    return progress, needed


# ─── Default Categories ───
DEFAULT_CATEGORIES = [
    {"name": "Salary", "type": "income", "icon": "Banknote", "color": "#10b981"},
    {"name": "Freelance", "type": "income", "icon": "Laptop", "color": "#3b82f6"},
    {"name": "Investments", "type": "income", "icon": "TrendingUp", "color": "#8b5cf6"},
    {"name": "Food", "type": "expense", "icon": "UtensilsCrossed", "color": "#f59e0b"},
    {"name": "Transport", "type": "expense", "icon": "Car", "color": "#ef4444"},
    {"name": "Entertainment", "type": "expense", "icon": "Gamepad2", "color": "#ec4899"},
    {"name": "Shopping", "type": "expense", "icon": "ShoppingBag", "color": "#06b6d4"},
    {"name": "Bills", "type": "expense", "icon": "Receipt", "color": "#f97316"},
    {"name": "Health", "type": "expense", "icon": "Heart", "color": "#84cc16"},
    {"name": "Education", "type": "expense", "icon": "GraduationCap", "color": "#6366f1"},
]
