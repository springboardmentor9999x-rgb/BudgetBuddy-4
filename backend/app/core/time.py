from datetime import datetime, timezone


def utcnow_naive() -> datetime:
    """Return UTC without tzinfo for legacy timestamp columns stored as naive values."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def month_bounds(month: str | None = None) -> tuple[datetime, datetime]:
    """Return inclusive start/exclusive end bounds for YYYY-MM or the current month."""
    start = datetime.strptime(month, "%Y-%m") if month else utcnow_naive().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    end = datetime(start.year + (start.month == 12), (start.month % 12) + 1, 1)
    return start, end
