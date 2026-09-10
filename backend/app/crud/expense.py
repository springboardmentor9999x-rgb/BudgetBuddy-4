from datetime import datetime

from sqlalchemy.orm import Session

from app.models.expense import Expense
from app.crud.bank_account import get_bank_account, adjust_balance
from app.core.validation import (
    DuplicateRecordError,
    normalize_text,
    same_transaction_day,
)

# Only the "Bank" payment method draws directly from a tracked bank
# balance and therefore requires a valid, owned bank_account_id. Cash,
# UPI, Debit Card and Credit Card do not require one — the user may
# still optionally link an account, in which case it is validated and
# the balance is adjusted (this matches the frontend's own contract:
# see pages/Expense.jsx, where the bank field is only required when
# paymentMethod === "Bank").
BANK_LINK_REQUIRED_METHODS = {"Bank"}


def _validate_bank_account(db, bank_account_id, user_id, amount=None):
    """Look up and validate an optionally-provided bank account.

    Returns the account, or None if no account was supplied. Raises
    ValueError for a missing/inactive account or (if amount is given)
    insufficient balance.
    """
    if bank_account_id is None:
        return None

    account = get_bank_account(db, bank_account_id, user_id)

    if account is None:
        raise ValueError("Selected bank account was not found.")

    if account.status != "active":
        raise ValueError("Selected bank account is inactive.")

    if amount is not None and amount > account.balance:
        raise ValueError(
            f"Insufficient balance. Available balance is "
            f"{account.balance:.2f}."
        )

    return account


# =========================================================
# CREATE EXPENSE
# =========================================================

def create_expense(
    db: Session,
    user_id: int,
    expense,
):
    # -----------------------------------------------------
    # Validate amount
    # -----------------------------------------------------
    if expense.amount <= 0:
        raise ValueError(
            "Expense amount must be greater than 0."
        )

    # -----------------------------------------------------
    # Bank account is only mandatory for the "Bank" payment method.
    # Cash / UPI / Debit Card / Credit Card do not require one.
    # -----------------------------------------------------
    payment_method = expense.payment_method or "Cash"

    if payment_method in BANK_LINK_REQUIRED_METHODS and expense.bank_account_id is None:
        raise ValueError(
            f"A bank account must be selected when the payment method is {payment_method}."
        )

    # -----------------------------------------------------
    # Validate bank account (if one was supplied/required)
    # -----------------------------------------------------
    _validate_bank_account(
        db, expense.bank_account_id, user_id, expense.amount
    )

    # -----------------------------------------------------
    # Transaction date
    # -----------------------------------------------------
    transaction_date = (
        expense.transaction_date
        or datetime.utcnow()
    )

    # -----------------------------------------------------
    # Prevent exact duplicate
    # -----------------------------------------------------
    existing_rows = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            Expense.bank_account_id == expense.bank_account_id,
            Expense.amount == expense.amount,
            Expense.category == expense.category,
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
            == normalize_text(expense.description)
        ):
            raise DuplicateRecordError(
                "This expense transaction already exists for the selected "
                "bank, category, amount and date. Add a new transaction only "
                "when it is genuinely a separate purchase."
            )

    # -----------------------------------------------------
    # Create expense
    # -----------------------------------------------------
    db_expense = Expense(
        user_id=user_id,
        amount=expense.amount,
        category=expense.category,
        description=expense.description,
        bank_account_id=expense.bank_account_id,
        payment_method=payment_method,
        transaction_date=transaction_date,
    )

    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # -----------------------------------------------------
    # Deduct expense from bank balance, only if a bank account is linked
    # -----------------------------------------------------
    if db_expense.bank_account_id is not None:
        adjust_balance(
            db,
            db_expense.bank_account_id,
            user_id,
            -db_expense.amount,
        )

    return db_expense


# =========================================================
# GET ALL EXPENSES
# =========================================================

def get_expenses(
    db: Session,
    user_id: int,
):
    """
    Return all expense records belonging to the logged-in user.

    History is ordered by the actual transaction date.
    """

    return (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id
        )
        .order_by(
            Expense.transaction_date.desc(),
            Expense.id.desc(),
        )
        .all()
    )


# =========================================================
# GET SINGLE EXPENSE
# =========================================================

def get_expense(
    db: Session,
    expense_id: int,
    user_id: int,
):
    return (
        db.query(Expense)
        .filter(
            Expense.id == expense_id,
            Expense.user_id == user_id,
        )
        .first()
    )


# =========================================================
# UPDATE EXPENSE
# =========================================================

def update_expense(
    db: Session,
    db_expense,
    expense,
):
    # -----------------------------------------------------
    # Validate amount
    # -----------------------------------------------------
    if expense.amount <= 0:
        raise ValueError(
            "Expense amount must be greater than 0."
        )

    # -----------------------------------------------------
    # Bank account is only mandatory for the "Bank" payment method.
    # -----------------------------------------------------
    payment_method = expense.payment_method or "Cash"

    if payment_method in BANK_LINK_REQUIRED_METHODS and expense.bank_account_id is None:
        raise ValueError(
            f"A bank account must be selected when the payment method is {payment_method}."
        )

    old_bank_account_id = db_expense.bank_account_id
    old_amount = db_expense.amount
    user_id = db_expense.user_id

    # -----------------------------------------------------
    # Validate the NEW bank account (if any) BEFORE touching any
    # balances, so a validation failure never leaves the old
    # account's balance in a half-restored state.
    # -----------------------------------------------------
    _validate_bank_account(
        db, expense.bank_account_id, user_id, expense.amount
    )

    # -----------------------------------------------------
    # Transaction date
    # -----------------------------------------------------
    new_transaction_date = (
        expense.transaction_date
        or db_expense.transaction_date
    )

    # -----------------------------------------------------
    # Prevent duplicate
    # -----------------------------------------------------
    existing_rows = (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id,
            Expense.id != db_expense.id,
            Expense.bank_account_id == expense.bank_account_id,
            Expense.amount == expense.amount,
            Expense.category == expense.category,
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
            == normalize_text(expense.description)
        ):
            raise DuplicateRecordError(
                "Another expense transaction with the same bank, category, "
                "amount and date already exists. Add a separate transaction "
                "only if it is genuinely a different purchase."
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
            old_amount,
        )

    # -----------------------------------------------------
    # Update expense
    # -----------------------------------------------------
    db_expense.amount = expense.amount
    db_expense.category = expense.category
    db_expense.description = expense.description
    db_expense.bank_account_id = expense.bank_account_id
    db_expense.payment_method = payment_method
    db_expense.transaction_date = new_transaction_date

    db.commit()
    db.refresh(db_expense)

    # -----------------------------------------------------
    # ... then deduct the new expense from the new account, only if
    # one is linked.
    # -----------------------------------------------------
    if db_expense.bank_account_id is not None:
        adjust_balance(
            db,
            db_expense.bank_account_id,
            user_id,
            -db_expense.amount,
        )

    return db_expense


# =========================================================
# DELETE EXPENSE
# =========================================================

def delete_expense(
    db: Session,
    db_expense,
):
    bank_account_id = db_expense.bank_account_id
    amount = db_expense.amount
    user_id = db_expense.user_id

    # -----------------------------------------------------
    # Delete expense
    # -----------------------------------------------------
    db.delete(db_expense)
    db.commit()

    # -----------------------------------------------------
    # Restore money
    # -----------------------------------------------------
    if bank_account_id is not None:
        adjust_balance(
            db,
            bank_account_id,
            user_id,
            amount,
        )