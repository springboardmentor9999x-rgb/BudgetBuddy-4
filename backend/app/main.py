import logging

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError

import app.models  # noqa: F401 - registers all models with Base

from app.routers import (
    auth,
    profile,
    income,
    expense,
    budget,
    report,
    dashboard,
    savings_goal,
    admin,
    notifications,
    settings as settings_router,
    bank_account,
    analytics,
    premium_request,
)

from app.database import Base, engine, SessionLocal
from app.config import settings
from app.models.user import User


# =========================================================
# LOGGING
# =========================================================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("budgetbuddy")


# =========================================================
# DATABASE STARTUP INITIALIZATION
# =========================================================
# IMPORTANT: Do not connect to the database while this module is being
# imported. Render/Uvicorn must be able to create the FastAPI application
# and bind to $PORT first. Database initialization is therefore performed
# during FastAPI startup instead of at module import time.


# =========================================================
# LIGHTWEIGHT SQLITE MIGRATIONS
# =========================================================

def _migrate_sqlite_schema():
    """
    Safely migrate an existing SQLite database to the
    current BudgetBuddy schema.

    Existing data is preserved.
    Missing columns are added safely.
    Existing columns are never recreated.
    """

    if engine.dialect.name != "sqlite":
        return

    try:
        with engine.begin() as connection:

            inspector = inspect(connection)
            tables = set(inspector.get_table_names())

            # =====================================================
            # ACCOUNT TIER
            # =====================================================

            if "users" in tables:
                existing = {
                    column["name"]
                    for column in inspector.get_columns("users")
                }
                if "phone_number" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN phone_number VARCHAR
                            """
                        )
                    )
                    existing.add("phone_number")

                if "account_tier" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN account_tier VARCHAR NOT NULL DEFAULT 'normal'
                            """
                        )
                    )

                connection.execute(
                    text("UPDATE users SET role = 'admin', account_tier = 'premium' WHERE lower(email) = :admin_email"),
                    {"admin_email": str(settings.ADMIN_EMAIL).strip().lower()},
                )

            # =====================================================
            # EMAIL VERIFICATION TOKENS
            # =====================================================

            if "email_verification_tokens" in tables:

                existing = {
                    column["name"]
                    for column in inspector.get_columns(
                        "email_verification_tokens"
                    )
                }

                if "otp_hash" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE email_verification_tokens
                            ADD COLUMN otp_hash VARCHAR
                            """
                        )
                    )

                if "attempts" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE email_verification_tokens
                            ADD COLUMN attempts INTEGER NOT NULL DEFAULT 0
                            """
                        )
                    )

            # =====================================================
            # USERS / AUTH COLUMNS
            # =====================================================

            if "users" in tables:

                existing = {
                    column["name"]
                    for column in inspector.get_columns("users")
                }

                if "is_verified" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN is_verified BOOLEAN NOT NULL DEFAULT 1
                            """
                        )
                    )
                    existing.add("is_verified")

                if "is_active" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT 1
                            """
                        )
                    )
                    existing.add("is_active")

                if "role" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN role VARCHAR NOT NULL DEFAULT 'user'
                            """
                        )
                    )
                    existing.add("role")

                if "full_name" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN full_name VARCHAR
                            """
                        )
                    )
                    existing.add("full_name")

                if "created_at" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN created_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            """
                            UPDATE users
                            SET created_at = CURRENT_TIMESTAMP
                            WHERE created_at IS NULL
                            """
                        )
                    )

                    existing.add("created_at")

                if "last_login_at" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN last_login_at DATETIME
                            """
                        )
                    )
                    existing.add("last_login_at")

                if "email_notifications_enabled" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN email_notifications_enabled
                            BOOLEAN NOT NULL DEFAULT 1
                            """
                        )
                    )
                    existing.add("email_notifications_enabled")

                if "app_notifications_enabled" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN app_notifications_enabled
                            BOOLEAN NOT NULL DEFAULT 1
                            """
                        )
                    )
                    existing.add("app_notifications_enabled")

                if "theme" not in existing:
                    connection.execute(
                        text(
                            """
                            ALTER TABLE users
                            ADD COLUMN theme
                            VARCHAR NOT NULL DEFAULT 'light'
                            """
                        )
                    )

            # =====================================================
            # INCOME / EXPENSE TRANSACTION TIMESTAMPS
            # =====================================================

            for table_name in ("income", "expense"):

                if table_name not in tables:
                    continue

                existing = {
                    column["name"]
                    for column in inspector.get_columns(table_name)
                }

                # -------------------------------------------------
                # created_at
                # -------------------------------------------------

                if "created_at" not in existing:

                    connection.execute(
                        text(
                            f"""
                            ALTER TABLE {table_name}
                            ADD COLUMN created_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            f"""
                            UPDATE {table_name}
                            SET created_at = CURRENT_TIMESTAMP
                            WHERE created_at IS NULL
                            """
                        )
                    )

                    existing.add("created_at")

                # -------------------------------------------------
                # transaction_date
                # -------------------------------------------------

                if "transaction_date" not in existing:

                    connection.execute(
                        text(
                            f"""
                            ALTER TABLE {table_name}
                            ADD COLUMN transaction_date DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            f"""
                            UPDATE {table_name}
                            SET transaction_date = created_at
                            WHERE transaction_date IS NULL
                            """
                        )
                    )

                    existing.add("transaction_date")

                # -------------------------------------------------
                # payment_method (Bank/Cash/UPI/Credit Card/etc.)
                # -------------------------------------------------

                if "payment_method" not in existing:

                    connection.execute(
                        text(
                            f"""
                            ALTER TABLE {table_name}
                            ADD COLUMN payment_method VARCHAR NOT NULL DEFAULT 'Bank'
                            """
                        )
                    )

                    existing.add("payment_method")

                # -------------------------------------------------
                # Repair legacy NULL transaction dates
                # -------------------------------------------------
                # Older BudgetBuddy databases may already have the
                # transaction_date column but contain NULL values.
                # The API response schema requires a real datetime, so
                # use the record creation timestamp as a safe fallback.
                connection.execute(
                    text(
                        f"""
                        UPDATE {table_name}
                        SET transaction_date = COALESCE(transaction_date, created_at, CURRENT_TIMESTAMP)
                        WHERE transaction_date IS NULL
                        """
                    )
                )

                # -------------------------------------------------
                # updated_at
                # -------------------------------------------------

                if "updated_at" not in existing:

                    connection.execute(
                        text(
                            f"""
                            ALTER TABLE {table_name}
                            ADD COLUMN updated_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            f"""
                            UPDATE {table_name}
                            SET updated_at = CURRENT_TIMESTAMP
                            WHERE updated_at IS NULL
                            """
                        )
                    )

                    existing.add("updated_at")

            # =====================================================
            # BUDGET TABLE
            # =====================================================

            if "budget" in tables:

                existing = {
                    column["name"]
                    for column in inspector.get_columns("budget")
                }

                # -------------------------------------------------
                # created_at
                # -------------------------------------------------

                if "created_at" not in existing:

                    connection.execute(
                        text(
                            """
                            ALTER TABLE budget
                            ADD COLUMN created_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            """
                            UPDATE budget
                            SET created_at = CURRENT_TIMESTAMP
                            WHERE created_at IS NULL
                            """
                        )
                    )

                    existing.add("created_at")

                # -------------------------------------------------
                # Repair legacy NULL transaction dates
                # -------------------------------------------------
                # Older BudgetBuddy databases may already have the
                # transaction_date column but contain NULL values.
                # The API response schema requires a real datetime, so
                # use the record creation timestamp as a safe fallback.
                connection.execute(
                    text(
                        f"""
                        UPDATE {table_name}
                        SET transaction_date = COALESCE(transaction_date, created_at, CURRENT_TIMESTAMP)
                        WHERE transaction_date IS NULL
                        """
                    )
                )

                # -------------------------------------------------
                # updated_at
                # -------------------------------------------------

                if "updated_at" not in existing:

                    connection.execute(
                        text(
                            """
                            ALTER TABLE budget
                            ADD COLUMN updated_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            """
                            UPDATE budget
                            SET updated_at = CURRENT_TIMESTAMP
                            WHERE updated_at IS NULL
                            """
                        )
                    )

                    existing.add("updated_at")

                # -------------------------------------------------
                # budget_year
                # -------------------------------------------------

                if "budget_year" not in existing:

                    connection.execute(
                        text(
                            """
                            ALTER TABLE budget
                            ADD COLUMN budget_year INTEGER
                            """
                        )
                    )

                    existing.add("budget_year")

                # -------------------------------------------------
                # Populate missing budget years
                # -------------------------------------------------

                connection.execute(
                    text(
                        """
                        UPDATE budget
                        SET budget_year =
                            CAST(
                                strftime('%Y', created_at)
                                AS INTEGER
                            )
                        WHERE budget_year IS NULL
                        """
                    )
                )

                # -------------------------------------------------
                # Final fallback
                # -------------------------------------------------

                connection.execute(
                    text(
                        """
                        UPDATE budget
                        SET budget_year =
                            CAST(
                                strftime('%Y', 'now')
                                AS INTEGER
                            )
                        WHERE budget_year IS NULL
                        """
                    )
                )

            # =====================================================
            # BUDGET MONTHLY ALLOCATIONS
            # =====================================================

            inspector = inspect(connection)
            tables = set(inspector.get_table_names())

            if "budget_monthly_allocations" not in tables:

                connection.execute(
                    text(
                        """
                        CREATE TABLE budget_monthly_allocations (
                            id INTEGER PRIMARY KEY,
                            budget_id INTEGER NOT NULL,
                            month INTEGER NOT NULL,
                            allocated_amount FLOAT NOT NULL DEFAULT 0.0,
                            FOREIGN KEY(budget_id)
                                REFERENCES budget(id)
                        )
                        """
                    )
                )

            # =====================================================
            # SAVINGS GOAL TABLE
            # =====================================================

            if "savings_goal" in tables:

                existing = {
                    column["name"]
                    for column in inspector.get_columns(
                        "savings_goal"
                    )
                }

                # -------------------------------------------------
                # created_at
                # -------------------------------------------------

                if "created_at" not in existing:

                    connection.execute(
                        text(
                            """
                            ALTER TABLE savings_goal
                            ADD COLUMN created_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            """
                            UPDATE savings_goal
                            SET created_at = CURRENT_TIMESTAMP
                            WHERE created_at IS NULL
                            """
                        )
                    )

                    existing.add("created_at")

                else:

                    # Repair existing NULL values.
                    connection.execute(
                        text(
                            """
                            UPDATE savings_goal
                            SET created_at = CURRENT_TIMESTAMP
                            WHERE created_at IS NULL
                            """
                        )
                    )

                # -------------------------------------------------
                # updated_at
                # -------------------------------------------------

                if "updated_at" not in existing:

                    connection.execute(
                        text(
                            """
                            ALTER TABLE savings_goal
                            ADD COLUMN updated_at DATETIME
                            """
                        )
                    )

                    connection.execute(
                        text(
                            """
                            UPDATE savings_goal
                            SET updated_at = CURRENT_TIMESTAMP
                            WHERE updated_at IS NULL
                            """
                        )
                    )

                    existing.add("updated_at")

                else:

                    connection.execute(
                        text(
                            """
                            UPDATE savings_goal
                            SET updated_at = CURRENT_TIMESTAMP
                            WHERE updated_at IS NULL
                            """
                        )
                    )

                # -------------------------------------------------
                # saved_amount NULL repair
                # -------------------------------------------------

                if "saved_amount" in existing:

                    connection.execute(
                        text(
                            """
                            UPDATE savings_goal
                            SET saved_amount = 0
                            WHERE saved_amount IS NULL
                            """
                        )
                    )

                logger.info(
                    "Savings goal SQLite migration completed."
                )

            # =====================================================
            # FINAL LOG
            # =====================================================

            logger.info(
                "SQLite schema migration completed successfully."
            )

    except SQLAlchemyError:
        logger.exception(
            "SQLite schema migration failed."
        )
        raise



def _enforce_primary_admin():
    """Keep exactly one configured Admin identity for the demo."""
    db = SessionLocal()
    try:
        primary = str(settings.ADMIN_EMAIL).strip().lower()
        users = db.query(User).all()
        changed = False
        for user in users:
            should_be_admin = user.email.strip().lower() == primary
            if should_be_admin and user.role != "admin":
                user.role = "admin"
                user.account_tier = "premium"
                changed = True
            elif not should_be_admin and user.role == "admin":
                user.role = "user"
                if user.account_tier not in ("normal", "premium"):
                    user.account_tier = "normal"
                changed = True
        if changed:
            db.commit()
    finally:
        db.close()


def _bootstrap_admin_account():
    """
    Guarantee the configured Admin account exists after the backend
    starts - no manual script required. If ADMIN_EMAIL isn't in the
    database yet, create it directly from ADMIN_EMAIL/ADMIN_PASSWORD/
    ADMIN_NAME in .env. If it already exists, _enforce_primary_admin()
    above has already made sure it's role=admin. This never overwrites
    an existing admin's password - only creates when genuinely absent.
    """
    from app.core.security import hash_password, validate_password_strength

    db = SessionLocal()
    try:
        email = str(settings.ADMIN_EMAIL).strip().lower()
        existing = db.query(User).filter(User.email == email).first()
        if existing is not None:
            return

        password = settings.ADMIN_PASSWORD
        try:
            validate_password_strength(password)
        except ValueError:
            logger.warning(
                "ADMIN_PASSWORD in .env is too weak to auto-bootstrap the "
                "Admin account (%s). Set a stronger ADMIN_PASSWORD, or run "
                "'python -m scripts.create_admin' manually.",
                email,
            )
            return

        admin_user = User(
            full_name=settings.ADMIN_NAME,
            email=email,
            hashed_password=hash_password(password),
            is_verified=True,
            is_active=True,
            role="admin",
            account_tier="premium",
        )
        db.add(admin_user)
        db.commit()
        logger.info("Admin account auto-bootstrapped for %s", email)
    except Exception:
        db.rollback()
        logger.exception("Admin auto-bootstrap failed - falling back is fine, run 'python -m scripts.create_admin' manually.")
    finally:
        db.close()


# =========================================================
# CREATE FASTAPI APPLICATION
# =========================================================

app = FastAPI(
    title="BudgetBuddy API",
    version="2.0.0",
    description=(
        "Personal budget planning and expense management "
        "platform API."
    ),
)


@app.on_event("startup")
def startup_event():
    """
    Initialize the database after the FastAPI application has been created.

    Keeping database work out of module import time is important on Render:
    Uvicorn can import app.main and bind to the platform-provided $PORT
    without being blocked by a database connection or migration.
    """
    try:
        logger.info("Starting BudgetBuddy database initialization...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created/verified successfully.")

        _migrate_sqlite_schema()
        logger.info("Database schema migration check completed.")

        _enforce_primary_admin()
        _bootstrap_admin_account()
        logger.info("BudgetBuddy database initialization completed successfully.")

    except Exception:
        # Do not prevent Uvicorn from starting/listening on $PORT because of
        # a database initialization problem. The exception is logged in full
        # so the actual DB configuration/connection problem is visible in
        # Render logs, while /health remains available for deployment checks.
        logger.exception(
            "BudgetBuddy database initialization failed. "
            "The API process will remain running; check DATABASE_URL "
            "and database connectivity in the Render environment."
        )


# =========================================================
# CORS CONFIGURATION
# =========================================================

DEFAULT_DEV_ORIGINS = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
]

# Merge the configurable CORS_ORIGINS (from .env / settings) with the local
# Vite dev-server defaults so local development keeps working even if
# CORS_ORIGINS is misconfigured, while production can fully control the
# allow-list via the environment variable.
ALLOWED_ORIGINS = sorted(
    set(settings.cors_origins_list) | set(DEFAULT_DEV_ORIGINS)
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# =========================================================
# CENTRALIZED VALIDATION ERROR HANDLER
# =========================================================

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError,
):
    """
    Convert Pydantic validation errors into a
    frontend-friendly JSON response.
    """

    raw_errors = exc.errors()

    simplified = [
        {
            "loc": error.get("loc"),
            "msg": error.get("msg"),
            "type": error.get("type"),
        }
        for error in raw_errors
    ]

    detail = (
        simplified[0]["msg"]
        if simplified
        else "Invalid request."
    )

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": detail,
            "errors": simplified,
        },
    )


# =========================================================
# DATABASE ERROR HANDLER
# =========================================================

@app.exception_handler(SQLAlchemyError)
async def db_exception_handler(
    request: Request,
    exc: SQLAlchemyError,
):
    logger.exception(
        "Database error while handling %s %s",
        request.method,
        request.url,
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": (
                "A database error occurred. "
                "Please try again."
            )
        },
    )


# =========================================================
# INCLUDE ROUTERS
# =========================================================

app.include_router(auth.router)
app.include_router(profile.router)
app.include_router(income.router)
app.include_router(expense.router)
app.include_router(budget.router)
app.include_router(report.router)
app.include_router(dashboard.router)
app.include_router(savings_goal.router)
app.include_router(admin.router)
app.include_router(notifications.router)
app.include_router(settings_router.router)
app.include_router(bank_account.router)
app.include_router(analytics.router)
app.include_router(premium_request.router)

# Premium access is granted directly by an Admin (see premium_request.py
# and routers/admin.py) rather than through any payment/checkout flow.


# =========================================================
# ROOT / HEALTH ENDPOINTS
# =========================================================

@app.get("/")
def root():
    return {
        "message": "Welcome to BudgetBuddy API!",
        "version": "2.0.0",
    }


@app.get("/health")
def health_check():
    return {
        "status": "ok",
    }
