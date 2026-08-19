from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.models.income import Income
from app.models.bank_account import BankAccount
from app.schemas.income import (
    IncomeCreate,
    IncomeUpdate,
)


# -------------------------
# Create Income
# -------------------------
def create_income(
    db: Session,
    user_id: int,
    income_in: IncomeCreate,
):
    bank_account = None

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

    income_data = income_in.model_dump()

    if bank_account:
        income_data["bank_name"] = bank_account.bank_name

    income = Income(
        user_id=user_id,
        **income_data,
    )

    db.add(income)
    db.commit()
    db.refresh(income)

    return income


# -------------------------
# Get All Income
# -------------------------
def get_incomes_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Income)
        .filter(Income.user_id == user_id)
        .offset(skip)
        .limit(limit)
        .all()
    )


# -------------------------
# Get Single Income
# -------------------------
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


# -------------------------
# Update Income
# -------------------------
def update_income(
    db: Session,
    income: Income,
    income_in: IncomeUpdate,
):
    update_data = income_in.model_dump(
        exclude_unset=True
    )

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

    for key, value in update_data.items():
        setattr(
            income,
            key,
            value,
        )

    db.commit()
    db.refresh(income)

    return income


# -------------------------
# Delete Income
# -------------------------
def delete_income(
    db: Session,
    income: Income,
):
    db.delete(income)
    db.commit()