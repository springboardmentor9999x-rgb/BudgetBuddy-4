from pydantic import BaseModel, EmailStr
from typing import Optional


# -------------------------
# Create User
# -------------------------
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str


# -------------------------
# User Response
# -------------------------
class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


# -------------------------
# Login Token
# -------------------------
class Token(BaseModel):
    access_token: str
    token_type: str


# -------------------------
# Delete Account
# -------------------------
class DeleteAccountRequest(BaseModel):
    password: str