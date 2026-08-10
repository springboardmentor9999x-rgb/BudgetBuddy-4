from datetime import date
from pydantic import BaseModel


class ExpenseCategorySummary(BaseModel):
    category: str
    total: float


class RecentTransaction(BaseModel):
    type: str
    title: str
    amount: float
    date: date


class DashboardResponse(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    expense_summary: list[ExpenseCategorySummary]
    recent_transactions: list[RecentTransaction]