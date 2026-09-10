from datetime import datetime
import re

from pydantic import BaseModel, EmailStr, field_validator, model_validator

from app.core.security import validate_password_strength


# ---------- Signup ----------
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    password: str
    confirm_password: str
    requested_tier: str = "normal"

    @field_validator("requested_tier")
    @classmethod
    def valid_requested_tier(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("normal", "premium"):
            raise ValueError("Account type must be Normal or Premium.")
        return v

    @field_validator("full_name")
    @classmethod
    def full_name_not_blank(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("Full name is required.")
        return v.strip()

    @field_validator("phone_number")
    @classmethod
    def valid_phone(cls, v: str | None) -> str | None:
        if v is None or not v.strip():
            return None
        clean = v.strip()
        if not re.fullmatch(r"\+?[0-9]{7,15}", clean):
            raise ValueError("Phone number must contain 7 to 15 digits and may start with +.")
        return clean

    @field_validator("password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        try:
            validate_password_strength(v)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.password != self.confirm_password:
            raise ValueError("Password and confirm password do not match.")
        return self


# ---------- Login ----------
class UserLogin(BaseModel):
    email: EmailStr
    password: str
    requested_tier: str = "normal"
    requested_plan: str = "premium_monthly"

    @field_validator("requested_tier")
    @classmethod
    def valid_requested_tier(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("normal", "premium", "admin"):
            raise ValueError("Login tab must be Normal, Premium, or Admin.")
        return v

    @field_validator("requested_plan")
    @classmethod
    def valid_requested_plan(cls, v: str) -> str:
        v = v.strip().lower()
        if v not in ("premium_monthly", "premium_yearly"):
            raise ValueError("Plan must be premium_monthly or premium_yearly.")
        return v


# ---------- Response ----------
class UserResponse(BaseModel):
    id: int
    full_name: str | None
    email: EmailStr
    phone_number: str | None = None
    role: str
    account_tier: str
    is_verified: bool
    is_active: bool
    created_at: datetime | None = None
    last_login_at: datetime | None = None
    theme: str
    email_notifications_enabled: bool
    app_notifications_enabled: bool

    class Config:
        from_attributes = True


# ---------- Profile / account settings updates ----------
class UserUpdate(BaseModel):
    full_name: str | None = None
    email: EmailStr | None = None


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str
    confirm_new_password: str

    @field_validator("new_password")
    @classmethod
    def password_strength(cls, v: str) -> str:
        try:
            validate_password_strength(v)
        except ValueError as exc:
            raise ValueError(str(exc)) from exc
        return v

    @model_validator(mode="after")
    def passwords_match(self):
        if self.new_password != self.confirm_new_password:
            raise ValueError("New password and confirm password do not match.")
        return self


class NotificationPreferencesUpdate(BaseModel):
    email_notifications_enabled: bool | None = None
    app_notifications_enabled: bool | None = None


class ThemeUpdate(BaseModel):
    theme: str  # "light" | "dark"

    @field_validator("theme")
    @classmethod
    def valid_theme(cls, v: str) -> str:
        if v not in ("light", "dark"):
            raise ValueError("Theme must be 'light' or 'dark'.")
        return v
