from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.expense import Expense
from app.models.bank_account import BankAccount
from app.models.budget import Budget
from app.models.notification import Notification

from app.schemas.expense import (
    ExpenseCreate,
    ExpenseUpdate,
)

from app.crud.bank_account import get_current_balance


# -------------------------
# Create Expense
# -------------------------
def create_expense(
    db: Session,
    user_id: int,
    expense_in: ExpenseCreate,
):
    # =====================================================
    # Bank Account is required for a real transaction
    # =====================================================

    if not expense_in.bank_account_id:
        raise HTTPException(
            status_code=400,
            detail="Please select a bank account.",
        )

    # -------------------------
    # Validate Bank Account
    # -------------------------
    bank_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id == expense_in.bank_account_id,
            BankAccount.user_id == user_id,
        )
        .first()
    )

    if not bank_account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found.",
        )

    # =====================================================
    # Check Current Bank Balance
    # =====================================================

    current_balance = get_current_balance(
        db,
        bank_account,
    )

    if expense_in.amount > current_balance:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient balance. "
                f"Available balance is "
                f"₹{current_balance:.2f}, "
                f"but the expense is "
                f"₹{expense_in.amount:.2f}."
            ),
        )

    # -------------------------
    # Prepare Expense Data
    # -------------------------
    expense_data = expense_in.model_dump()

    expense_data["bank_name"] = (
        bank_account.bank_name
    )

    # -------------------------
    # Create Expense
    # -------------------------
    expense = Expense(
        user_id=user_id,
        **expense_data,
    )

    db.add(expense)
    db.commit()
    db.refresh(expense)

    # =====================================================
    # Budget Alert
    # =====================================================

    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category == expense.category,
        )
        .first()
    )

    if budget:

        expense_date = expense.date

        # -------------------------
        # Current Month Start
        # -------------------------
        month_start = expense_date.replace(
            day=1
        )

        # -------------------------
        # Next Month
        # -------------------------
        if expense_date.month == 12:
            next_month = date(
                expense_date.year + 1,
                1,
                1,
            )
        else:
            next_month = date(
                expense_date.year,
                expense_date.month + 1,
                1,
            )

        # -------------------------
        # Total Category Spending
        # -------------------------
        total_spent = (
            db.query(
                func.sum(Expense.amount)
            )
            .filter(
                Expense.user_id == user_id,
                Expense.category == expense.category,
                Expense.date >= month_start,
                Expense.date < next_month,
            )
            .scalar()
            or 0
        )

        # -------------------------
        # Check Budget Exceeded
        # -------------------------
        if total_spent > budget.limit_amount:

            message = (
                f"You've exceeded your "
                f"{expense.category} budget"
            )

            # -------------------------
            # Prevent Duplicate Alert
            # -------------------------
            existing_notification = (
                db.query(Notification)
                .filter(
                    Notification.user_id == user_id,
                    Notification.type == "budget_alert",
                    Notification.message == message,
                    Notification.created_at >= month_start,
                    Notification.created_at < next_month,
                )
                .first()
            )

            if not existing_notification:

                notification = Notification(
                    user_id=user_id,
                    message=message,
                    type="budget_alert",
                    is_read=False,
                )

                db.add(notification)
                db.commit()

    return expense


# -------------------------
# Get All Expenses
# -------------------------
def get_expenses_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Expense)
        .filter(
            Expense.user_id == user_id
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


# -------------------------
# Get Single Expense
# -------------------------
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


# -------------------------
# Update Expense
# -------------------------
def update_expense(
    db: Session,
    expense: Expense,
    expense_in: ExpenseUpdate,
):
    update_data = expense_in.model_dump(
        exclude_unset=True
    )

    # =====================================================
    # Determine Bank Account
    # =====================================================

    if "bank_account_id" in update_data:

        new_bank_account_id = (
            update_data["bank_account_id"]
        )

        if not new_bank_account_id:
            raise HTTPException(
                status_code=400,
                detail="Please select a bank account.",
            )

        new_bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == new_bank_account_id,
                BankAccount.user_id == expense.user_id,
            )
            .first()
        )

        if not new_bank_account:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found.",
            )

    else:

        new_bank_account = (
            db.query(BankAccount)
            .filter(
                BankAccount.id == expense.bank_account_id,
                BankAccount.user_id == expense.user_id,
            )
            .first()
        )

        if not new_bank_account:
            raise HTTPException(
                status_code=404,
                detail="Bank account not found.",
            )

    # =====================================================
    # Determine New Amount
    # =====================================================

    new_amount = update_data.get(
        "amount",
        expense.amount,
    )

    # =====================================================
    # Check Balance
    # =====================================================

    # Same bank account:
    #
    # Current balance already includes the old expense.
    # Therefore we add the old expense back before checking
    # the new amount.
    #
    # Example:
    #
    # Current balance = ₹4,000
    # Old expense     = ₹2,000
    # New expense     = ₹5,000
    #
    # Available for replacement = ₹4,000 + ₹2,000
    #                             = ₹6,000
    #
    # New expense ₹5,000 -> allowed.
    #
    if (
        new_bank_account.id
        == expense.bank_account_id
    ):

        current_balance = get_current_balance(
            db,
            new_bank_account,
        )

        available_balance = (
            current_balance
            + float(expense.amount)
        )

    # Different bank account:
    #
    # The old expense belongs to another account.
    # Therefore the new bank's current balance can be
    # checked directly.
    #
    else:

        available_balance = get_current_balance(
            db,
            new_bank_account,
        )

    if new_amount > available_balance:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Insufficient balance. "
                f"Available balance is "
                f"₹{available_balance:.2f}, "
                f"but the expense is "
                f"₹{new_amount:.2f}."
            ),
        )

    # =====================================================
    # Update Bank Name
    # =====================================================

    update_data["bank_name"] = (
        new_bank_account.bank_name
    )

    # =====================================================
    # Apply Updates
    # =====================================================

    for key, value in update_data.items():
        setattr(
            expense,
            key,
            value,
        )

    db.commit()
    db.refresh(expense)

    return expense


# -------------------------
# Delete Expense
# -------------------------
def delete_expense(
    db: Session,
    expense: Expense,
):
    db.delete(expense)
    db.commit()


# -------------------------
# Expense Summary
# -------------------------
def get_expense_summary(
    db: Session,
    user_id: int,
):
    return (
        db.query(
            Expense.category,
            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id == user_id
        )
        .group_by(
            Expense.category
        )
        .all()
    )