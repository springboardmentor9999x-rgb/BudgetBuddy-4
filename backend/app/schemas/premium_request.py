from datetime import datetime

from pydantic import BaseModel


class PremiumRequestCreate(BaseModel):
    note: str | None = None


class PremiumRequestResponse(BaseModel):
    id: int
    status: str
    note: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None

    class Config:
        from_attributes = True


class PremiumRequestAdminResponse(BaseModel):
    id: int
    user_id: int
    full_name: str | None = None
    email: str
    account_tier: str
    status: str
    note: str | None = None
    created_at: datetime
    reviewed_at: datetime | None = None

    class Config:
        from_attributes = True
