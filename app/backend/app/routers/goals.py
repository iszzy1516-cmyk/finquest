"""Goals endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from decimal import Decimal

from app.database import get_db
from app.models.goal import Goal
from app.auth.dependencies import get_current_active_user
from app.schemas.goal import GoalCreate, GoalUpdate, GoalResponse
from app.schemas.api import ApiResponse
from app.services.gamification_service import process_gamification_event

router = APIRouter()


class ContributeRequest(BaseModel):
    amount: Decimal


@router.get("", response_model=ApiResponse[list[GoalResponse]])
def list_goals(current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    items = db.query(Goal).filter(Goal.user_id == current_user.id).order_by(Goal.created_at.desc()).all()
    return ApiResponse(data=[GoalResponse.model_validate(i) for i in items])


@router.post("", response_model=ApiResponse[GoalResponse], status_code=status.HTTP_201_CREATED)
def create_goal(body: GoalCreate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    g = Goal(
        user_id=current_user.id,
        name=body.name,
        target_amount=body.target_amount,
        deadline=body.deadline,
    )
    db.add(g)
    db.commit()
    db.refresh(g)
    process_gamification_event(db, current_user.id, "goal_created")
    return ApiResponse(data=GoalResponse.model_validate(g))


@router.put("/{goal_id}", response_model=ApiResponse[GoalResponse])
def update_goal(goal_id: int, body: GoalUpdate, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    g = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    if body.name is not None:
        g.name = body.name
    if body.target_amount is not None:
        g.target_amount = body.target_amount
    if body.deadline is not None:
        g.deadline = body.deadline
    db.commit()
    db.refresh(g)
    return ApiResponse(data=GoalResponse.model_validate(g))


@router.delete("/{goal_id}", response_model=ApiResponse[dict])
def delete_goal(goal_id: int, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    g = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")
    db.delete(g)
    db.commit()
    return ApiResponse(data={"success": True})


@router.post("/{goal_id}/contribute", response_model=ApiResponse[GoalResponse])
def contribute(goal_id: int, body: ContributeRequest, current_user = Depends(get_current_active_user), db: Session = Depends(get_db)):
    g = db.query(Goal).filter(Goal.id == goal_id, Goal.user_id == current_user.id).first()
    if not g:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Goal not found")

    current = float(g.current_amount)
    target = float(g.target_amount)
    add_amount = float(body.amount)
    new_amount = current + add_amount

    old_pct = int((current / target) * 100) if target > 0 else 0
    new_pct = int((new_amount / target) * 100) if target > 0 else 0

    milestone = None
    if old_pct < 25 <= new_pct:
        milestone = "25"
    elif old_pct < 50 <= new_pct:
        milestone = "50"
    elif old_pct < 75 <= new_pct:
        milestone = "75"

    was_completed = current >= target
    is_completed = new_amount >= target

    g.current_amount = Decimal(str(new_amount))
    db.commit()
    db.refresh(g)

    process_gamification_event(db, current_user.id, "goal_contributed", {
        "milestone": milestone,
        "completed": not was_completed and is_completed,
    })

    return ApiResponse(data=GoalResponse.model_validate(g))
