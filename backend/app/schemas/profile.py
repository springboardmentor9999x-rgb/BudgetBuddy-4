from pydantic import BaseModel, Field


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    phone: str | None = Field(default=None, max_length=30)
    address: str | None = Field(default=None, max_length=255)


class ProfileOut(BaseModel):
    full_name: str
    email: str
    phone: str | None
    address: str | None

    class Config:
        from_attributes = True
