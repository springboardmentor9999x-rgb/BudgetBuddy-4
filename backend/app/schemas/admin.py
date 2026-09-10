from datetime import datetime

from pydantic import BaseModel


class AdminUserResponse(BaseModel):
    id: int
    full_name: str | None
    email: str
    role: str
    account_tier: str
    is_verified: bool
    is_active: bool
    created_at: datetime | None = None
    last_login_at: datetime | None = None

    class Config:
        from_attributes = True


class ActivityLogResponse(BaseModel):
    id: int
    user_id: int | None
    action: str
    detail: str | None
    ip_address: str | None
    severity: str
    created_at: datetime

    class Config:
        from_attributes = True


class AdminDashboardStats(BaseModel):
    total_users: int
    active_users: int
    inactive_users: int
    verified_users: int
    unverified_users: int
    admin_users: int
    pro_users: int
    new_registrations_last_7_days: int


class AdminTierUpdate(BaseModel):
    account_tier: str
