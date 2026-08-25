from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.bank_account import BankAccount
from app.models.notification import Notification

from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
)


# =========================================================
# Create Income
# =========================================================
def create_income(
    db: Session,
    user_id: int,
    income_in: IncomeCreate,
):
    bank_account = None

    # -------------------------
    # Validate Bank Account
    # -------------------------
    if income_in.bank_account_id:

        bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == income_in.bank_account_id,
                BankAccount.user_id == user_id,
            )
            .first()
        )

        if not bank_account:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found.",
            )

    # -------------------------
    # Prepare Income Data
    # -------------------------
    income_data = income_in.model_dump()

    if bank_account:
        income_data["bank_name"] = bank_account.bank_name

    # -------------------------
    # Create Income
    # -------------------------
    income = Income(
        user_id=user_id,
        **income_data,
    )

    db.add(income)
    db.commit()
    db.refresh(income)

    # -------------------------
    # Create Notification
    # -------------------------
    notification = Notification(
        user_id=user_id,
        message=(
            f"Income of ₹{income.amount:,.2f} "
            f"from {income.source} "
            f"was added successfully."
        ),
        type="income_added",
        is_read=False,
    )

    db.add(notification)
    db.commit()

    return income


# =========================================================
# Get All Income
# =========================================================
def get_incomes_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Income)
        .filter(
            Income.user_id == user_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# =========================================================
# Get Single Income
# =========================================================
def get_income(
    db: Session,
    income_id: int,
    user_id: int,
):
    return (
        db.query(Income)
        .filter(
            Income.id == income_id,
            Income.user_id == user_id,
        )
        .first()
    )


# =========================================================
# Update Income
# =========================================================
def update_income(
    db: Session,
    income: Income,
    income_in: IncomeUpdate,
):
    update_data = income_in.model_dump(
        exclude_unset=True
    )

    # -------------------------
    # Validate Bank Account
    # -------------------------
    if "bank_account_id" in update_data:

        bank_account_id = update_data[
            "bank_account_id"
        ]

        if bank_account_id:

            bank_account = (
                db.query(BankAccount)
                .filter(
                    BankAccount.id == bank_account_id,
                    BankAccount.user_id == income.user_id,
                )
                .first()
            )

            if not bank_account:
                raise HTTPException(
                    status_code=404,
                    detail="Bank account not found.",
                )

            update_data["bank_name"] = (
                bank_account.bank_name
            )

    # -------------------------
    # Update Income
    # -------------------------
    for key, value in update_data.items():

        setattr(
            income,
            key,
            value,
        )

    db.commit()
    db.refresh(income)

    # -------------------------
    # Create Notification
    # -------------------------
    notification = Notification(
        user_id=income.user_id,
        message=(
            f"Income from {income.source} "
            f"was updated successfully."
        ),
        type="income_updated",
        is_read=False,
    )

    db.add(notification)
    db.commit()

    return income


# =========================================================
# Delete Income
# =========================================================
def delete_income(
    db: Session,
    income: Income,
):
    # Save values before deletion
    user_id = income.user_id
    source = income.source
    amount = income.amount

    # -------------------------
    # Delete Income
    # -------------------------
    db.delete(income)
    db.commit()

    # -------------------------
    # Create Notification
    # -------------------------
    notification = Notification(
        user_id=user_id,
        message=(
            f"Income of ₹{amount:,.2f} "
            f"from {source} "
            f"was deleted."
        ),
        type="income_deleted",
        is_read=False,
    )

    db.add(notification)
    db.commit()