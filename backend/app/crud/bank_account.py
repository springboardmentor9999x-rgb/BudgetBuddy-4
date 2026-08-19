from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.bank_account import BankAccount
from app.models.income import Income
from app.models.expense import Expense

from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountUpdate,
)


# -------------------------
# Create Bank Account
# -------------------------
def create_bank_account(
    db: Session,
    user_id: int,
    bank_in: BankAccountCreate,
):
    existing_bank = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id,
            BankAccount.bank_name.ilike(
                bank_in.bank_name.strip()
            ),
        )
        .first()
    )

    if existing_bank:
        raise HTTPException(
            status_code=400,
            detail=(
                f"{bank_in.bank_name} is already "
                "added to your bank accounts."
            ),
        )

    bank_account = BankAccount(
        user_id=user_id,
        bank_name=bank_in.bank_name.strip(),
        account_number=bank_in.account_number.strip(),
        account_type=bank_in.account_type.strip(),
        opening_balance=bank_in.opening_balance,
    )

    db.add(bank_account)

    try:
        db.commit()
        db.refresh(bank_account)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail=(
                f"{bank_in.bank_name} is already "
                "added to your bank accounts."
            ),
        )

    return bank_account


# -------------------------
# Calculate Current Balance
# -------------------------
def get_current_balance(
    db: Session,
    bank_account: BankAccount,
):
    total_income = (
        db.query(
            func.coalesce(
                func.sum(Income.amount),
                0,
            )
        )
        .filter(
            Income.bank_account_id == bank_account.id,
            Income.user_id == bank_account.user_id,
        )
        .scalar()
    )

    total_expense = (
        db.query(
            func.coalesce(
                func.sum(Expense.amount),
                0,
            )
        )
        .filter(
            Expense.bank_account_id == bank_account.id,
            Expense.user_id == bank_account.user_id,
        )
        .scalar()
    )

    return (
        bank_account.opening_balance
        + float(total_income or 0)
        - float(total_expense or 0)
    )


# -------------------------
# Get All Bank Accounts
# -------------------------
def get_bank_accounts_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    accounts = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )

    return accounts


# -------------------------
# Get Single Bank Account
# -------------------------
def get_bank_account(
    db: Session,
    bank_account_id: int,
    user_id: int,
):
    return (
        db.query(BankAccount)
        .filter(
            BankAccount.id == bank_account_id,
            BankAccount.user_id == user_id,
        )
        .first()
    )


# -------------------------
# Update Bank Account
# -------------------------
def update_bank_account(
    db: Session,
    bank_account: BankAccount,
    bank_in: BankAccountUpdate,
):
    update_data = bank_in.model_dump(
        exclude_unset=True
    )

    # Check duplicate bank name
    if "bank_name" in update_data:
        new_bank_name = (
            update_data["bank_name"].strip()
        )

        existing_bank = (
            db.query(BankAccount)
            .filter(
                BankAccount.user_id
                == bank_account.user_id,
                BankAccount.bank_name.ilike(
                    new_bank_name
                ),
                BankAccount.id
                != bank_account.id,
            )
            .first()
        )

        if existing_bank:
            raise HTTPException(
                status_code=400,
                detail=(
                    f"{new_bank_name} is already "
                    "added to your bank accounts."
                ),
            )

        update_data["bank_name"] = new_bank_name

    # Clean account number
    if "account_number" in update_data:
        update_data["account_number"] = (
            update_data["account_number"].strip()
        )

    # Clean account type
    if "account_type" in update_data:
        update_data["account_type"] = (
            update_data["account_type"].strip()
        )

    # Update fields
    for key, value in update_data.items():
        setattr(
            bank_account,
            key,
            value,
        )

    try:
        db.commit()
        db.refresh(bank_account)

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=400,
            detail="Unable to update bank account.",
        )

    return bank_account


# -------------------------
# Delete Bank Account
# -------------------------
def delete_bank_account(
    db: Session,
    bank_account: BankAccount,
):
    db.delete(bank_account)
    db.commit()