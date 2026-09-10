from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./budgetbuddy.db"

    SECRET_KEY: str = "change-this-secret-key"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = 1440
    EMAIL_VERIFICATION_OTP_EXPIRE_MINUTES: int = 10
    EMAIL_VERIFICATION_OTP_LENGTH: int = 6
    EMAIL_VERIFICATION_MAX_ATTEMPTS: int = 5
    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: int = 60
    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30

    FRONTEND_URL: str = "http://localhost:5173"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174,http://localhost:5175"

    # Gmail SMTP. Port 465/implicit TLS is the safest local default.
    # For port 587, set MAIL_SSL_TLS=false and MAIL_STARTTLS=true in .env.
    MAIL_USERNAME: str = ""
    MAIL_PASSWORD: str = ""
    MAIL_FROM: str = ""
    MAIL_PORT: int = 587
    MAIL_SERVER: str = "smtp.gmail.com"
    MAIL_FROM_NAME: str = "BudgetBuddy"
    MAIL_SSL_TLS: bool = False
    MAIL_STARTTLS: bool = True

    ADMIN_EMAIL: str = "admin.budgetbuddy01@gmail.com"
    ADMIN_PASSWORD: str = "ChangeMe#123"
    ADMIN_NAME: str = "BudgetBuddy Admin"

    # SMS is optional. Provider abstraction lives in app/core/sms.py -
    # when unset, SMS sends are logged (not sent) and nothing crashes.
    SMS_PROVIDER: str = ""  # "" (disabled) or "twilio"
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    @property
    def cors_origins_list(self) -> list[str]:
        return [x.strip() for x in self.CORS_ORIGINS.split(",") if x.strip()]

    @property
    def email_configured(self) -> bool:
        return bool(self.MAIL_USERNAME.strip() and self.MAIL_PASSWORD.strip() and self.MAIL_FROM.strip())

    @property
    def sms_configured(self) -> bool:
        return bool(
            self.SMS_PROVIDER.strip().lower() == "twilio"
            and self.TWILIO_ACCOUNT_SID.strip()
            and self.TWILIO_AUTH_TOKEN.strip()
            and self.TWILIO_PHONE_NUMBER.strip()
        )


settings = Settings()
