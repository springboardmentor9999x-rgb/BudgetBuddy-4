from datetime import datetime, timezone


def utcnow_naive() -> datetime:
    """Return UTC without tzinfo for legacy timestamp columns stored as naive values."""
    return datetime.now(timezone.utc).replace(tzinfo=None)
