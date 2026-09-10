from sqlalchemy.orm import Session

from app.models.savings_goal import SavingsGoal
from app.schemas.savings_goal import SavingsGoalCreate
from app.core.validation import normalize_text


# =========================================================
# HELPERS
# =========================================================

def _clean_goal_name(
    goal_name: str,
) -> str:

    clean_name = " ".join(
        goal_name.strip().split()
    )

    if not clean_name:
        raise ValueError(
            "Savings goal name is required."
        )

    return clean_name


def _validate_goal_values(
    target_amount: float,
    saved_amount: float,
):
    target = float(target_amount)
    saved = float(saved_amount)

    if target <= 0:
        raise ValueError(
            "Target amount must be greater than 0."
        )

    if saved < 0:
        raise ValueError(
            "Saved amount cannot be negative."
        )

    if saved > target:
        raise ValueError(
            "Saved amount cannot be greater than target amount."
        )


# =========================================================
# CREATE
# =========================================================

def create_goal(
    db: Session,
    user_id: int,
    goal: SavingsGoalCreate,
):
    clean_name = _clean_goal_name(
        goal.goal_name
    )

    _validate_goal_values(
        goal.target_amount,
        goal.saved_amount,
    )

    # -----------------------------------------------------
    # Prevent accidental duplicate goal creation.
    # Unlike budgets, savings goals use a unique-name rule.
    # -----------------------------------------------------

    existing_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id
        )
        .all()
    )

    for existing in existing_goals:

        if (
            normalize_text(
                existing.goal_name
            )
            == normalize_text(
                clean_name
            )
        ):

            raise ValueError(
                f"A savings goal named "
                f"'{clean_name}' already exists."
            )

    # -----------------------------------------------------
    # CREATE
    # -----------------------------------------------------

    db_goal = SavingsGoal(
        user_id=user_id,
        goal_name=clean_name,
        target_amount=float(
            goal.target_amount
        ),
        saved_amount=float(
            goal.saved_amount
        ),
    )

    db.add(db_goal)

    db.commit()

    db.refresh(db_goal)

    return db_goal


# =========================================================
# GET ALL
# =========================================================

def get_goals(
    db: Session,
    user_id: int,
):
    return (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id
        )
        .order_by(
            SavingsGoal.created_at.desc(),
            SavingsGoal.id.desc(),
        )
        .all()
    )


# =========================================================
# GET ONE
# =========================================================

def get_goal(
    db: Session,
    goal_id: int,
    user_id: int,
):
    return (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.id == goal_id,
            SavingsGoal.user_id == user_id,
        )
        .first()
    )


# =========================================================
# UPDATE
# =========================================================

def update_goal(
    db: Session,
    goal_id: int,
    user_id: int,
    goal: SavingsGoalCreate,
):
    db_goal = get_goal(
        db,
        goal_id,
        user_id,
    )

    if not db_goal:
        return None

    clean_name = _clean_goal_name(
        goal.goal_name
    )

    _validate_goal_values(
        goal.target_amount,
        goal.saved_amount,
    )

    # -----------------------------------------------------
    # Prevent duplicate goal names
    # -----------------------------------------------------

    other_goals = (
        db.query(SavingsGoal)
        .filter(
            SavingsGoal.user_id == user_id,
            SavingsGoal.id != goal_id,
        )
        .all()
    )

    for other in other_goals:

        if (
            normalize_text(
                other.goal_name
            )
            == normalize_text(
                clean_name
            )
        ):

            raise ValueError(
                "Another savings goal with "
                "this name already exists."
            )

    # -----------------------------------------------------
    # UPDATE SAME RECORD
    # -----------------------------------------------------

    db_goal.goal_name = clean_name

    db_goal.target_amount = float(
        goal.target_amount
    )

    db_goal.saved_amount = float(
        goal.saved_amount
    )

    db.commit()

    db.refresh(db_goal)

    return db_goal


# =========================================================
# DELETE
# =========================================================

def delete_goal(
    db: Session,
    goal_id: int,
    user_id: int,
):
    db_goal = get_goal(
        db,
        goal_id,
        user_id,
    )

    if db_goal:

        db.delete(db_goal)

        db.commit()

    return db_goal


# =========================================================
# CONTRIBUTE
# =========================================================

def contribute_to_goal(
    db: Session,
    goal_id: int,
    user_id: int,
    amount: float,
):
    db_goal = get_goal(
        db,
        goal_id,
        user_id,
    )

    if not db_goal:
        return None

    amount = float(amount)

    if amount <= 0:
        raise ValueError(
            "Contribution amount must be greater than 0."
        )

    remaining = (
        float(db_goal.target_amount)
        - float(db_goal.saved_amount)
    )

    if remaining <= 0:
        raise ValueError(
            "This savings goal is already complete."
        )

    contribution = min(
        amount,
        remaining,
    )

    db_goal.saved_amount = (
        float(db_goal.saved_amount)
        + contribution
    )

    db.commit()

    db.refresh(db_goal)

    return db_goal