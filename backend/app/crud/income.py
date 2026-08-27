from sqlalchemy.orm import Session

from app.crud.notification import create_notification
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
    create_notification(db, user_id, f"Income added: {db_income.source} (₹{float(db_income.amount):,.2f}).", "income_added")
    db.commit()

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

    create_notification(db, user_id, f"Income updated: {db_income.source} (₹{float(db_income.amount):,.2f}).", "income_updated")
    db.commit()

    return db_income


# -----------------------------
# Delete Income
# -----------------------------
def delete_income(db: Session, income_id: int, user_id: int):
    db_income = get_income_by_id(db, income_id, user_id)

    if not db_income:
        return None

    source = db_income.source
    db.delete(db_income)
    db.commit()
    create_notification(db, user_id, f"Income deleted: {source}.", "income_deleted")
    db.commit()

    return db_income
