from pydantic import BaseModel, EmailStr, Field


class Signup(BaseModel):
    full_name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class Login(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class ResetPassword(BaseModel):
    email: EmailStr
    new_password: str = Field(min_length=8, max_length=72)


class VerifyEmailCode(BaseModel):
    email: EmailStr
    code: str = Field(min_length=6, max_length=6, pattern=r"^[A-Z0-9]{6}$")
