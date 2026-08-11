from sqlalchemy.orm import Session

from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate


# -----------------------------
# Create Income
# -----------------------------
def create_income(db: Session, user_id: int, income: IncomeCreate):
    db_income = Income(
        source=income.source,
        amount=income.amount,
        description=income.description,
        bank_account=income.bank_account,
        user_id=user_id,
    )

    db.add(db_income)
    db.commit()
    db.refresh(db_income)

    return db_income


# -----------------------------
# Get All Income
# -----------------------------
def get_all_income(db: Session, user_id: int):
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .all()
    )


# -----------------------------
# Get Income By ID
# -----------------------------
def get_income_by_id(db: Session, income_id: int, user_id: int):
    return (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id
        )
        .first()
    )


# -----------------------------
# Update Income
# -----------------------------
def update_income(
    db: Session,
    income_id: int,
    user_id: int,
    income: IncomeUpdate,
):
    db_income = get_income_by_id(db, income_id, user_id)

    if not db_income:
        return None

    for key, value in income.model_dump(exclude_unset=True).items():
        setattr(db_income, key, value)

    db.commit()
    db.refresh(db_income)

    return db_income


# -----------------------------
# Delete Income
# -----------------------------
def delete_income(db: Session, income_id: int, user_id: int):
    db_income = get_income_by_id(db, income_id, user_id)

    if not db_income:
        return None

    db.delete(db_income)
    db.commit()

    return db_income
