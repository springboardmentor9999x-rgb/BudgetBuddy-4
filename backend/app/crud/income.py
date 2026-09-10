from datetime import datetime

from sqlalchemy.orm import Session

from app.models.income import Income
from app.crud.bank_account import get_bank_account, adjust_balance
from app.core.validation import (
    DuplicateRecordError,
    normalize_text,
    same_transaction_day,
)

# Only the "Bank" payment method (a direct deposit) requires a linked,
# owned bank_account_id. Cash / UPI / Debit Card / Credit Card income
# does not require one — the user may still optionally link an
# account, in which case it is validated and the balance is adjusted.
# This matches the frontend's own contract (pages/Income.jsx: the bank
# field is only required when paymentMethod === "Bank").
BANK_LINK_REQUIRED_METHODS = {"Bank"}


def _validate_bank_account(db, bank_account_id, user_id):
    """Look up and validate an optionally-provided bank account.

    Returns the account, or None if no account was supplied. Raises
    ValueError if an account was supplied but not found/owned.
    """
    if bank_account_id is None:
        return None

    account = get_bank_account(db, bank_account_id, user_id)

    if account is None:
        raise ValueError("Selected bank account was not found.")

    return account


# =========================================================
# CREATE INCOME
# =========================================================

def create_income(
    db: Session,
    user_id: int,
    income,
):
    # -----------------------------------------------------
    # Validate amount
    # -----------------------------------------------------
    if income.amount <= 0:
        raise ValueError(
            "Income amount must be greater than 0."
        )

    # -----------------------------------------------------
    # Bank account is only mandatory for the "Bank" payment method.
    # -----------------------------------------------------
    payment_method = income.payment_method or "Cash"

    if payment_method in BANK_LINK_REQUIRED_METHODS and income.bank_account_id is None:
        raise ValueError(
            f"A bank account must be selected when the payment method is {payment_method}."
        )

    # -----------------------------------------------------
    # Validate bank account (if one was supplied/required)
    # -----------------------------------------------------
    _validate_bank_account(db, income.bank_account_id, user_id)

    # -----------------------------------------------------
    # Transaction date
    # -----------------------------------------------------
    transaction_date = (
        income.transaction_date
        or datetime.utcnow()
    )

    # -----------------------------------------------------
    # Prevent exact duplicate transaction
    # -----------------------------------------------------
    existing_rows = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            Income.bank_account_id == income.bank_account_id,
            Income.amount == income.amount,
            Income.source == income.source.strip(),
            Income.category == income.category,
        )
        .all()
    )

    for existing in existing_rows:
        if (
            same_transaction_day(
                existing.transaction_date,
                transaction_date,
            )
            and normalize_text(existing.description)
            == normalize_text(income.description)
        ):
            raise DuplicateRecordError(
                "This income transaction already exists for the selected "
                "bank, source, amount and date. Update the existing record "
                "instead of creating another copy."
            )

    # -----------------------------------------------------
    # Create database record
    # -----------------------------------------------------
    db_income = Income(
        user_id=user_id,
        source=income.source.strip(),
        amount=income.amount,
        category=income.category,
        description=income.description,
        bank_account_id=income.bank_account_id,
        payment_method=payment_method,
        transaction_date=transaction_date,
    )

    db.add(db_income)
    db.commit()
    db.refresh(db_income)

    # -----------------------------------------------------
    # Increase bank balance, only if a bank account is linked
    # -----------------------------------------------------
    if db_income.bank_account_id is not None:
        adjust_balance(
            db,
            db_income.bank_account_id,
            user_id,
            db_income.amount,
        )

    return db_income


# =========================================================
# GET ALL INCOME
# =========================================================

def get_income(
    db: Session,
    user_id: int,
):
    """
    Return all income records belonging to the logged-in user.

    IMPORTANT:
    History should be based on transaction_date because that is
    the actual date selected by the user.
    """

    return (
        db.query(Income)
        .filter(
            Income.user_id == user_id
        )
        .order_by(
            Income.transaction_date.desc(),
            Income.id.desc(),
        )
        .all()
    )


# =========================================================
# GET SINGLE INCOME
# =========================================================

def get_income_by_id(
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
# UPDATE INCOME
# =========================================================

def update_income(
    db: Session,
    income_db,
    income,
):
    # -----------------------------------------------------
    # Validate amount
    # -----------------------------------------------------
    if income.amount <= 0:
        raise ValueError(
            "Income amount must be greater than 0."
        )

    # -----------------------------------------------------
    # Bank account is only mandatory for the "Bank" payment method.
    # -----------------------------------------------------
    payment_method = income.payment_method or "Cash"

    if payment_method in BANK_LINK_REQUIRED_METHODS and income.bank_account_id is None:
        raise ValueError(
            f"A bank account must be selected when the payment method is {payment_method}."
        )

    user_id = income_db.user_id

    old_bank_account_id = income_db.bank_account_id
    old_amount = income_db.amount

    # -----------------------------------------------------
    # Validate the NEW bank account (if any) BEFORE touching any
    # balances.
    # -----------------------------------------------------
    _validate_bank_account(db, income.bank_account_id, user_id)

    # -----------------------------------------------------
    # Transaction date
    # -----------------------------------------------------
    new_transaction_date = (
        income.transaction_date
        or income_db.transaction_date
    )

    # -----------------------------------------------------
    # Prevent duplicate after editing
    # -----------------------------------------------------
    existing_rows = (
        db.query(Income)
        .filter(
            Income.user_id == user_id,
            Income.id != income_db.id,
            Income.bank_account_id == income.bank_account_id,
            Income.amount == income.amount,
            Income.source == income.source.strip(),
            Income.category == income.category,
        )
        .all()
    )

    for existing in existing_rows:
        if (
            same_transaction_day(
                existing.transaction_date,
                new_transaction_date,
            )
            and normalize_text(existing.description)
            == normalize_text(income.description)
        ):
            raise DuplicateRecordError(
                "Another income transaction with the same bank, source, "
                "amount and date already exists. Edit that transaction instead."
            )

    # -----------------------------------------------------
    # Now that everything is validated, restore the old account's
    # balance (if it had one linked) ...
    # -----------------------------------------------------
    if old_bank_account_id is not None:
        adjust_balance(
            db,
            old_bank_account_id,
            user_id,
            -old_amount,
        )

    # -----------------------------------------------------
    # Update record
    # -----------------------------------------------------
    income_db.source = income.source.strip()
    income_db.amount = income.amount
    income_db.category = income.category
    income_db.description = income.description
    income_db.bank_account_id = income.bank_account_id
    income_db.payment_method = payment_method
    income_db.transaction_date = new_transaction_date

    db.commit()
    db.refresh(income_db)

    # -----------------------------------------------------
    # ... then add the new amount to the new account, only if one is
    # linked.
    # -----------------------------------------------------
    if income_db.bank_account_id is not None:
        adjust_balance(
            db,
            income_db.bank_account_id,
            user_id,
            income_db.amount,
        )

    return income_db


# =========================================================
# DELETE INCOME
# =========================================================

def delete_income(
    db: Session,
    income_db,
):
    bank_account_id = income_db.bank_account_id
    amount = income_db.amount
    user_id = income_db.user_id

    # -----------------------------------------------------
    # Delete income
    # -----------------------------------------------------
    db.delete(income_db)
    db.commit()

    # -----------------------------------------------------
    # Remove income amount from bank balance
    # -----------------------------------------------------
    if bank_account_id is not None:
        adjust_balance(
            db,
            bank_account_id,
            user_id,
            -amount,
        )