from pydantic import BaseModel


class ProfileCreate(BaseModel):
    full_name: str
    phone_number: str | None = None
    monthly_income: float
    currency: str = "INR"


class ProfileResponse(BaseModel):
    id: int
    user_id: int
    full_name: str
    monthly_income: float
    currency: str

    class Config:
        from_attributes = True
