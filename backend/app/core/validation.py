"""Shared business-validation helpers for BudgetBuddy."""

from datetime import datetime


class DuplicateRecordError(ValueError):
    """Raised when a new record would be an accidental duplicate."""


def normalize_text(value: str | None) -> str:
    return " ".join((value or "").strip().lower().split())


def same_transaction_day(left: datetime | None, right: datetime | None) -> bool:
    if left is None or right is None:
        return False
    return left.date() == right.date()
