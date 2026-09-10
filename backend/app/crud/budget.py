from datetime import datetime
from decimal import Decimal, ROUND_DOWN

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget, BudgetMonthlyAllocation
from app.models.expense import Expense
from app.models.user import User
from app.crud.notification import create_notification_for_user_if_enabled
from app.crud.activity_log import log_activity


# =========================================================
# HELPERS
# =========================================================

def _normalise_category(category: str) -> str:
    if not isinstance(category, str):
        raise ValueError("Budget category is required.")

    value = " ".join(category.strip().split())

    if not value:
        raise ValueError("Budget category is required.")

    return value


def _resolved_year(budget) -> int:
    year = getattr(budget, "budget_year", None)

    return year or datetime.utcnow().year


# =========================================================
# MONTHLY ALLOCATION BUILDER
# =========================================================

def _build_monthly_allocations(
    budget_amount: float,
    allocations=None,
):
    """
    Create exactly 12 monthly allocations.

    If the user does not provide monthly allocations,
    the annual amount is divided across all 12 months.

    The final month receives the rounding remainder so
    the 12 monthly values ALWAYS equal the annual budget.
    """

    annual = Decimal(str(budget_amount)).quantize(
        Decimal("0.01")
    )

    if annual <= 0:
        raise ValueError(
            "Budget amount must be greater than 0."
        )

    # -----------------------------------------------------
    # AUTOMATIC MONTHLY ALLOCATION
    # -----------------------------------------------------

    if allocations is None:

        base = (
            annual / Decimal("12")
        ).quantize(
            Decimal("0.01"),
            rounding=ROUND_DOWN,
        )

        result = []

        running_total = Decimal("0.00")

        for month in range(1, 13):

            if month < 12:
                amount = base
            else:
                # Last month receives the exact remainder.
                amount = annual - running_total

            amount = amount.quantize(
                Decimal("0.01")
            )

            result.append(
                {
                    "month": month,
                    "allocated_amount": float(amount),
                }
            )

            running_total += amount

        return result

    # -----------------------------------------------------
    # CUSTOM MONTHLY ALLOCATION
    # -----------------------------------------------------

    by_month = {}

    for item in allocations:

        month = int(item.month)
        amount = Decimal(
            str(item.allocated_amount)
        ).quantize(
            Decimal("0.01")
        )

        if month in by_month:
            raise ValueError(
                f"Duplicate monthly allocation "
                f"for month {month}."
            )

        if amount < 0:
            raise ValueError(
                "Monthly budget allocation "
                "cannot be negative."
            )

        by_month[month] = amount

    if set(by_month.keys()) != set(range(1, 13)):
        raise ValueError(
            "Monthly allocations must contain "
            "all 12 months exactly once."
        )

    total = sum(
        by_month.values(),
        Decimal("0.00"),
    )

    if total != annual:
        raise ValueError(
            "Monthly allocations must add up to "
            "the annual budget amount."
        )

    return [
        {
            "month": month,
            "allocated_amount": float(
                by_month[month]
            ),
        }
        for month in range(1, 13)
    ]


# =========================================================
# REPLACE MONTHLY ALLOCATIONS
# =========================================================

def _replace_monthly_allocations(
    db: Session,
    db_budget: Budget,
    budget,
):
    allocations = _build_monthly_allocations(
        float(budget.budget_amount),
        getattr(
            budget,
            "monthly_allocations",
            None,
        ),
    )

    db.query(
        BudgetMonthlyAllocation
    ).filter(
        BudgetMonthlyAllocation.budget_id
        == db_budget.id
    ).delete(
        synchronize_session=False
    )

    db.flush()

    for item in allocations:

        db.add(
            BudgetMonthlyAllocation(
                budget_id=db_budget.id,
                month=item["month"],
                allocated_amount=item[
                    "allocated_amount"
                ],
            )
        )


# =========================================================
# ENSURE OLD BUDGETS HAVE 12 MONTHS
# =========================================================

def _ensure_monthly_allocations(
    db: Session,
    budget: Budget,
):
    existing = (
        db.query(BudgetMonthlyAllocation)
        .filter(
            BudgetMonthlyAllocation.budget_id
            == budget.id
        )
        .order_by(
            BudgetMonthlyAllocation.month.asc()
        )
        .all()
    )

    if len(existing) == 12:
        months = {
            item.month
            for item in existing
        }

        if months == set(range(1, 13)):
            return

    allocations = _build_monthly_allocations(
        float(budget.budget_amount)
    )

    db.query(
        BudgetMonthlyAllocation
    ).filter(
        BudgetMonthlyAllocation.budget_id
        == budget.id
    ).delete(
        synchronize_session=False
    )

    for item in allocations:

        db.add(
            BudgetMonthlyAllocation(
                budget_id=budget.id,
                month=item["month"],
                allocated_amount=item[
                    "allocated_amount"
                ],
            )
        )

    db.commit()

    db.refresh(budget)


# =========================================================
# CREATE BUDGET
# =========================================================

def create_budget(
    db: Session,
    budget,
    user_id: int,
):
    """
    Create a NEW budget record.

    IMPORTANT:
    Duplicate category names are intentionally allowed.

    Example:

        Food   ₹10,000
        Food   ₹5,000

    are two separate budget records.

    Accidental double-submit is handled by the frontend
    submit/loading state, not by deleting legitimate
    duplicate categories here.
    """

    category = _normalise_category(
        budget.category
    )

    amount = float(
        budget.budget_amount
    )

    if amount <= 0:
        raise ValueError(
            "Budget amount must be greater than 0."
        )

    year = _resolved_year(budget)

    db_budget = Budget(
        user_id=user_id,
        category=category,
        budget_amount=amount,
        budget_year=year,
    )

    db.add(db_budget)

    db.flush()

    _replace_monthly_allocations(
        db,
        db_budget,
        budget,
    )

    db.commit()

    db.refresh(db_budget)

    # Budget alert evaluation is retained.
    evaluate_and_notify_budget_status(
        db,
        user_id,
        category,
        year,
    )

    return db_budget


# =========================================================
# GET BUDGETS
# =========================================================

def get_budgets(
    db: Session,
    user_id: int,
    year: int | None = None,
):
    query = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id
        )
    )

    if year is not None:
        query = query.filter(
            Budget.budget_year == year
        )

    budgets = (
        query
        .order_by(
            Budget.budget_year.desc(),
            Budget.category.asc(),
            Budget.id.asc(),
        )
        .all()
    )

    # Repair legacy budgets that have no
    # monthly allocation rows.
    changed = False

    for budget in budgets:

        existing_count = (
            db.query(
                BudgetMonthlyAllocation
            )
            .filter(
                BudgetMonthlyAllocation.budget_id
                == budget.id
            )
            .count()
        )

        if existing_count != 12:

            allocations = (
                _build_monthly_allocations(
                    float(
                        budget.budget_amount
                    )
                )
            )

            db.query(
                BudgetMonthlyAllocation
            ).filter(
                BudgetMonthlyAllocation.budget_id
                == budget.id
            ).delete(
                synchronize_session=False
            )

            for item in allocations:

                db.add(
                    BudgetMonthlyAllocation(
                        budget_id=budget.id,
                        month=item["month"],
                        allocated_amount=item[
                            "allocated_amount"
                        ],
                    )
                )

            changed = True

    if changed:
        db.commit()

        for budget in budgets:
            db.refresh(budget)

    return budgets


# =========================================================
# GET ONE BUDGET
# =========================================================

def get_budget(
    db: Session,
    budget_id: int,
    user_id: int,
):
    budget = (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == user_id,
        )
        .first()
    )

    if budget:
        _ensure_monthly_allocations(
            db,
            budget,
        )

    return budget


# =========================================================
# UPDATE BUDGET
# =========================================================

def update_budget(
    db: Session,
    db_budget: Budget,
    budget,
):
    """
    Update ONLY the selected budget ID.

    Never merge it with another budget having
    the same category.
    """

    category = _normalise_category(
        budget.category
    )

    amount = float(
        budget.budget_amount
    )

    if amount <= 0:
        raise ValueError(
            "Budget amount must be greater than 0."
        )

    year = _resolved_year(budget)

    db_budget.category = category
    db_budget.budget_amount = amount
    db_budget.budget_year = year

    _replace_monthly_allocations(
        db,
        db_budget,
        budget,
    )

    db.commit()

    db.refresh(db_budget)

    evaluate_and_notify_budget_status(
        db,
        db_budget.user_id,
        category,
        year,
    )

    return db_budget


# =========================================================
# DELETE BUDGET
# =========================================================

def delete_budget(
    db: Session,
    db_budget: Budget,
):
    db.delete(db_budget)

    db.commit()


# =========================================================
# BUDGET ALERT
# =========================================================

def evaluate_and_notify_budget_status(
    db: Session,
    user_or_id,
    category: str,
    year: int | None = None,
) -> None:
    """
    Evaluate the combined budget for a category/year.

    This is important when duplicate categories are
    intentionally allowed.

    Example:

        Food #1 = ₹10,000
        Food #2 = ₹20,000

    Combined Food budget = ₹30,000.
    """

    user_id = (
        user_or_id.id
        if isinstance(user_or_id, User)
        else int(user_or_id)
    )

    year = (
        year
        or datetime.utcnow().year
    )

    category = _normalise_category(
        category
    )

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category.ilike(category),
            Budget.budget_year == year,
        )
        .all()
    )

    if not budgets:
        return

    total_budget = sum(
        float(item.budget_amount)
        for item in budgets
    )

    if total_budget <= 0:
        return

    spent = (
        db.query(
            func.coalesce(
                func.sum(
                    Expense.amount
                ),
                0,
            )
        )
        .filter(
            Expense.user_id == user_id,
            Expense.category.ilike(
                category
            ),
            Expense.transaction_date
            >= datetime(year, 1, 1),
            Expense.transaction_date
            < datetime(year + 1, 1, 1),
        )
        .scalar()
        or 0
    )

    spent = float(spent)

    percentage = (
        spent / total_budget
    ) * 100

    if percentage >= 100:

        state = "exceeded"

        title = "Budget exceeded"

        message = (
            f"{category} budget for {year} "
            f"has been exceeded. "
            f"Spent ₹{spent:,.2f} of "
            f"₹{total_budget:,.2f}."
        )

    elif percentage >= 80:

        state = "near_limit"

        title = "Budget nearing limit"

        message = (
            f"{category} budget for {year} "
            f"is at {percentage:.0f}%. "
            f"Spent ₹{spent:,.2f} of "
            f"₹{total_budget:,.2f}."
        )

    else:
        return

    from app.models.notification import Notification

    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id == user_id,
            Notification.category
            == "budget_alert",
            Notification.title == title,
            Notification.message.like(
                f"{category} budget for {year}%"
            ),
        )
        .first()
    )

    if existing:
        return

    user = (
        db.query(User)
        .filter(
            User.id == user_id
        )
        .first()
    )

    if user is None:
        return

    create_notification_for_user_if_enabled(
        db,
        user,
        title=title,
        message=message,
        category="budget_alert",
    )

    log_activity(
        db,
        user_id,
        "budget_alert",
        detail=(
            f"{category} {year}: "
            f"{state} "
            f"({percentage:.2f}%)"
        ),
        severity="warning",
    )