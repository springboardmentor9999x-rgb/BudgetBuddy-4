from pydantic import BaseModel, EmailStr, Field


class Signup(BaseModel):
    full_name: str
    email: EmailStr
    password: str


class Login(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str


class VerifyEmailCode(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^[A-Z0-9]{6}$")
