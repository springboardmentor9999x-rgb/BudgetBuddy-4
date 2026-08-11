from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine

# Routers
from app.routers.auth import router as auth_router
from app.routers import expenses
from app.routers import dashboard
from app.routers import income

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

# -----------------------------
# Root Endpoint
# -----------------------------
@app.get("/")
def root():
    return {
        "message": "BudgetBuddy Backend is Running 🚀"
    }

# -----------------------------
# Database Test
# -----------------------------
@app.get("/test-db")
def test_db():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT NOW();"))
        return {
            "Database Time": str(result.scalar())
        }