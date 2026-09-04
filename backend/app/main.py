import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# Routers
from app.routers.auth import router as auth_router
from app.routers import expenses
from app.routers import dashboard
from app.routers import income
from app.routers import budgets
from app.routers import saving_goals
from app.routers import notifications
from app.routers import analytics
from app.routers import profile
from app.routers import reports
from app.routers import admin, membership, premium

app = FastAPI(
    title="BudgetBuddy API",
    version="1.0.0"
)

# -----------------------------
# CORS
# -----------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        os.getenv("FRONTEND_URL", "http://localhost:5173"),
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -----------------------------
# Routers
# -----------------------------
app.include_router(auth_router)

app.include_router(
    expenses.router,
    prefix="/expenses",
    tags=["Expenses"],
)

app.include_router(
    income.router,
    prefix="/income",
    tags=["Income"],
)

app.include_router(
    dashboard.router,
    prefix="/dashboard",
    tags=["Dashboard"],
)

app.include_router(
    budgets.router,
    prefix="/budgets",
    tags=["Budgets"],
)

app.include_router(
    saving_goals.router,
    prefix="/goals",
    tags=["Savings Goals"],
)

app.include_router(
    notifications.router,
    prefix="/notifications",
    tags=["Notifications"],
)

app.include_router(
    analytics.router,
    prefix="/analytics",
    tags=["Analytics"],
)

app.include_router(
    profile.router,
    prefix="/profile",
    tags=["Profile"],
)

app.include_router(
    reports.router,
    prefix="/reports",
    tags=["Reports"],
)

app.include_router(admin.router, prefix="/admin", tags=["Admin"])
app.include_router(membership.router, prefix="/membership", tags=["Membership"])
app.include_router(premium.router, prefix="/premium", tags=["Premium"])

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def root():
    return {
        "message": "BudgetBuddy API is running"
    }
