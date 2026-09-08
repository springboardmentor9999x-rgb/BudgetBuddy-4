from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlalchemy import text

from app.database import engine


# =========================================================
# Import all models
# =========================================================
# This ensures SQLAlchemy registers all models

import app.models


# =========================================================
# Import Routers
# =========================================================

from app.routers import (
    auth,
    admin,
    expenses,
    incomes,
    budgets,
    dashboard,
    profile,
    bank_accounts,
    savings_goals,
    notifications,
    analytics,
    reports,
    report_export,
    subscription,
)


# =========================================================
# FastAPI Application
# =========================================================

app = FastAPI(
    title="BudgetBuddy API",
)


# =========================================================
# Uploaded Files
# =========================================================

app.mount(
    "/uploads",
    StaticFiles(directory="uploads"),
    name="uploads",
)


# =========================================================
# CORS Configuration
# =========================================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://budgetbuddy-8dlt.onrender.com",
    ],
    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =========================================================
# Authentication
# =========================================================

app.include_router(
    auth.router,
)


# =========================================================
# Admin
# =========================================================

app.include_router(
    admin.router,
)


# =========================================================
# Expenses
# =========================================================

app.include_router(
    expenses.router,
    prefix="/expenses",
    tags=["Expenses"],
)


# =========================================================
# Incomes
# =========================================================

app.include_router(
    incomes.router,
    prefix="/incomes",
    tags=["Incomes"],
)


# =========================================================
# Budgets
# =========================================================

app.include_router(
    budgets.router,
    prefix="/budgets",
    tags=["Budgets"],
)


# =========================================================
# Dashboard
# =========================================================

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"],
)


# =========================================================
# Profile
# =========================================================

app.include_router(
    profile.router,
)


# =========================================================
# Bank Accounts
# =========================================================

app.include_router(
    bank_accounts.router,
    prefix="/bank-accounts",
    tags=["Bank Accounts"],
)


# =========================================================
# Savings Goals
# =========================================================

app.include_router(
    savings_goals.router,
    prefix="/goals",
    tags=["Savings Goals"],
)


# =========================================================
# Notifications
# =========================================================

app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"],
)


# =========================================================
# Analytics
# =========================================================

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"],
)


# =========================================================
# Reports
# =========================================================

app.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"],
)


# =========================================================
# Report Export
# =========================================================

app.include_router(
    report_export.router,
    prefix="/reports/export",
    tags=["Report Export"],
)


# =========================================================
# Subscription
# =========================================================
#
# Student:
#   POST /subscription/request
#
# Student:
#   GET /subscription/my-request
#
# This does NOT send an email.
#
# The request is stored in the database and
# displayed in the Admin Dashboard.
#
# =========================================================

app.include_router(
    subscription.router
)


# =========================================================
# Home
# =========================================================

@app.get("/")
def home():

    return {
        "message": "BudgetBuddy API is running successfully!"
    }


# =========================================================
# Database Test
# =========================================================

@app.get("/db-test")
def db_test():

    try:

        with engine.connect() as connection:

            connection.execute(
                text("SELECT 1")
            )

        return {
            "status": "Database connected successfully!"
        }

    except Exception as e:

        return {
            "error": str(e)
        }