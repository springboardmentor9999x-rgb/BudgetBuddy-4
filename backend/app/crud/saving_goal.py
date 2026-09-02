from sqlalchemy.orm import Session

from app.crud.notification import create_notification
from app.models.saving_goal import SavingGoal
from app.schemas.saving_goal import ContributionCreate, SavingGoalCreate, SavingGoalUpdate


def _progress(goal: SavingGoal) -> dict:
    target = float(goal.target_amount)
    saved = float(goal.saved_amount or 0)
    return {
        "id": goal.id, "user_id": goal.user_id, "goal_name": goal.goal_name,
        "target_amount": target, "saved_amount": saved, "target_date": goal.target_date,
        "status": goal.status, "created_at": goal.created_at,
        "progress_percentage": round(min((saved / target) * 100, 100), 2),
        "remaining_amount": max(target - saved, 0),
    }


def create_goal(db: Session, user_id: int, goal_in: SavingGoalCreate):
    goal = SavingGoal(user_id=user_id, **goal_in.model_dump())
    if goal.saved_amount >= goal.target_amount:
        goal.status = "completed"
    db.add(goal)
    db.commit()
    db.refresh(goal)
    create_notification(db, user_id, f"Savings goal added: {goal.goal_name}.", "goal_added")
    db.commit()
    return _progress(goal)


def get_goals(db: Session, user_id: int):
    goals = db.query(SavingGoal).filter(SavingGoal.user_id == user_id).order_by(SavingGoal.created_at.desc()).all()
    return [_progress(goal) for goal in goals]


def get_goal(db: Session, goal_id: int, user_id: int):
    return db.query(SavingGoal).filter(SavingGoal.id == goal_id, SavingGoal.user_id == user_id).first()


def update_goal(db: Session, goal_id: int, user_id: int, goal_in: SavingGoalUpdate):
    goal = get_goal(db, goal_id, user_id)
    if not goal:
        return None
    for key, value in goal_in.model_dump(exclude_unset=True).items():
        setattr(goal, key, value)
    goal.status = "completed" if goal.saved_amount >= goal.target_amount else "in_progress"
    db.commit()
    db.refresh(goal)
    create_notification(db, user_id, f"Savings goal updated: {goal.goal_name}.", "goal_updated")
    db.commit()
    return _progress(goal)


def delete_goal(db: Session, goal_id: int, user_id: int):
    goal = get_goal(db, goal_id, user_id)
    if not goal:
        return None
    goal_name = goal.goal_name
    db.delete(goal)
    db.commit()
    create_notification(db, user_id, f"Savings goal deleted: {goal_name}.", "goal_deleted")
    db.commit()
    return goal


def contribute_to_goal(db: Session, goal_id: int, user_id: int, contribution: ContributionCreate):
    goal = get_goal(db, goal_id, user_id)
    if not goal:
        return None
    previous_amount = float(goal.saved_amount or 0)
    goal.saved_amount = previous_amount + contribution.amount
    target = float(goal.target_amount)
    create_notification(db, user_id, f"Added ₹{float(contribution.amount):,.2f} to {goal.goal_name}.", "goal_contribution")
    if previous_amount < target * 0.5 <= goal.saved_amount:
        create_notification(db, user_id, f"You're halfway to your {goal.goal_name} goal!", "goal_milestone")
    if previous_amount < target <= goal.saved_amount:
        goal.status = "completed"
        create_notification(db, user_id, f"Congratulations! You've completed your {goal.goal_name} goal.", "goal_milestone")
    db.commit()
    db.refresh(goal)
    return _progress(goal)
