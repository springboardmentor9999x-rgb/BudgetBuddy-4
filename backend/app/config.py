from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):

    # ============================================================
    # DATABASE
    # ============================================================

    DATABASE_URL: str = "sqlite:///./budgetbuddy.db"


    # ============================================================
    # SECURITY / JWT
    # ============================================================

    SECRET_KEY: str = "change-this-secret-key"

    ALGORITHM: str = "HS256"

    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    EMAIL_VERIFICATION_TOKEN_EXPIRE_MINUTES: int = 1440

    EMAIL_VERIFICATION_OTP_EXPIRE_MINUTES: int = 10

    EMAIL_VERIFICATION_OTP_LENGTH: int = 6

    EMAIL_VERIFICATION_MAX_ATTEMPTS: int = 5

    EMAIL_VERIFICATION_RESEND_COOLDOWN_SECONDS: int = 60

    PASSWORD_RESET_TOKEN_EXPIRE_MINUTES: int = 30


    # ============================================================
    # FRONTEND
    # ============================================================

    FRONTEND_URL: str = "http://localhost:5173"


    # ============================================================
    # CORS
    # ============================================================

    CORS_ORIGINS: str = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "http://localhost:5175"
    )


    # ============================================================
    # EMAIL - RESEND API
    # ============================================================

    # Production email provider.
    # These values MUST be added to Render Environment Variables.
    #
    # RESEND_API_KEY=re_xxxxxxxxxxxxxxxxx
    # RESEND_FROM_EMAIL=your verified sender address

    RESEND_API_KEY: str = ""

    RESEND_FROM_EMAIL: str = ""


    # ============================================================
    # LEGACY GMAIL SMTP SETTINGS
    # ============================================================
    #
    # These are kept for compatibility with existing BudgetBuddy
    # code. The new email.py will use Resend instead of SMTP.
    #
    # DO NOT delete these yet because other project files may
    # reference them.

    MAIL_USERNAME: str = ""

    MAIL_PASSWORD: str = ""

    MAIL_FROM: str = ""

    MAIL_PORT: int = 587

    MAIL_SERVER: str = "smtp.gmail.com"

    MAIL_FROM_NAME: str = "BudgetBuddy"

    MAIL_SSL_TLS: bool = False

    MAIL_STARTTLS: bool = True


    # ============================================================
    # ADMIN BOOTSTRAP
    # ============================================================

    ADMIN_EMAIL: str = "admin.budgetbuddy01@gmail.com"

    ADMIN_PASSWORD: str = "ChangeMe#123"

    ADMIN_NAME: str = "BudgetBuddy Admin"


    # ============================================================
    # SMS - OPTIONAL
    # ============================================================

    # Leave blank to disable SMS.
    # Use "twilio" only when Twilio credentials are configured.

    SMS_PROVIDER: str = ""

    TWILIO_ACCOUNT_SID: str = ""

    TWILIO_AUTH_TOKEN: str = ""

    TWILIO_PHONE_NUMBER: str = ""


    # ============================================================
    # PYDANTIC SETTINGS CONFIGURATION
    # ============================================================

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


    # ============================================================
    # CORS HELPER
    # ============================================================

    @property
    def cors_origins_list(self) -> list[str]:
        return [
            x.strip()
            for x in self.CORS_ORIGINS.split(",")
            if x.strip()
        ]


    # ============================================================
    # RESEND EMAIL CONFIGURATION CHECK
    # ============================================================

    @property
    def email_configured(self) -> bool:
        return bool(
            self.RESEND_API_KEY.strip()
            and self.RESEND_FROM_EMAIL.strip()
        )


    # ============================================================
    # SMS CONFIGURATION CHECK
    # ============================================================

    @property
    def sms_configured(self) -> bool:
        return bool(
            self.SMS_PROVIDER.strip().lower() == "twilio"
            and self.TWILIO_ACCOUNT_SID.strip()
            and self.TWILIO_AUTH_TOKEN.strip()
            and self.TWILIO_PHONE_NUMBER.strip()
        )


# ================================================================
# GLOBAL SETTINGS INSTANCE
# ================================================================

settings = Settings()