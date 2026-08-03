from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine

# Import all models so SQLAlchemy registers them
import app.models

from app.routers import (
    auth,
    expenses,
    incomes,
    budgets,
)

app = FastAPI(title="BudgetBuddy API")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Authentication
# -------------------------
app.include_router(auth.router)

# -------------------------
# Expenses
# -------------------------
app.include_router(
    expenses.router,
    prefix="/expenses",
    tags=["Expenses"],
)

# -------------------------
# Incomes
# -------------------------
app.include_router(
    incomes.router,
    prefix="/incomes",
    tags=["Incomes"],
)

# -------------------------
# Budgets
# -------------------------
app.include_router(
    budgets.router,
    prefix="/budgets",
    tags=["Budgets"],
)


@app.get("/")
def home():
    return {"message": "BudgetBuddy API is running successfully!"}


@app.get("/db-test")
def db_test():
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        return {"status": "Database connected successfully!"}
    except Exception as e:
        return {"error": str(e)}