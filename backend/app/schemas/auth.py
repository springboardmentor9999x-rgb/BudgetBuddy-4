from pydantic import BaseModel, EmailStr


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