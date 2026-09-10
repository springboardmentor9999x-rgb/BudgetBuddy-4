from pydantic import BaseModel


class CategoryBreakdown(BaseModel):
    category: str
    amount: float
    percentage: float


class BankBreakdown(BaseModel):
    bank_id: int
    bank_name: str
    masked_account_number: str
    total_income: float
    total_expense: float
    net_change: float


class DailyTrendPoint(BaseModel):
    date: str  # "YYYY-MM-DD"
    income: float
    expense: float
    savings: float


class MonthlyBudgetSummary(BaseModel):
    monthly_budget: float
    spent: float
    remaining: float
    percent_used: float
    is_over_budget: bool
    # Per-category breakdown backing the aggregate figures above, in case a
    # category filter wasn't applied and the user has several budgets.
    categories: list[dict]


class MonthlyAnalysisResponse(BaseModel):
    year: int
    month: int
    bank_filter: int | None
    category_filter: str | None

    total_income: float
    total_expense: float
    savings: float
    savings_percentage: float | None

    income_by_category: list[CategoryBreakdown]
    expense_by_category: list[CategoryBreakdown]
    bank_analysis: list[BankBreakdown]
    budget: MonthlyBudgetSummary
    daily_trend: list[DailyTrendPoint]


class YearlyBankBreakdown(BaseModel):
    bank_id: int
    bank_name: str
    masked_account_number: str
    total_income: float
    total_expense: float
    net_change: float
    transaction_count: int


class YearlyBudgetSummary(BaseModel):
    yearly_budget: float
    spent: float
    remaining: float
    percent_used: float
    is_over_budget: bool


class MonthBreakdown(BaseModel):
    month: int
    month_name: str
    income: float
    expense: float
    savings: float
    budget: float
    budget_used: float
    budget_remaining: float


class YearOverYearComparison(BaseModel):
    previous_year: int
    current_year_income: float
    previous_year_income: float
    income_change_percent: float | None
    current_year_expense: float
    previous_year_expense: float
    expense_change_percent: float | None
    current_year_savings: float
    previous_year_savings: float
    savings_change_percent: float | None


class YearlyAnalysisResponse(BaseModel):
    year: int
    bank_filter: int | None
    category_filter: str | None

    total_income: float
    total_expense: float
    savings: float
    savings_percentage: float | None

    num_income_transactions: int
    num_expense_transactions: int
    avg_monthly_income: float
    avg_monthly_expense: float
    avg_monthly_savings: float

    income_by_category: list[CategoryBreakdown]
    expense_by_category: list[CategoryBreakdown]
    bank_analysis: list[YearlyBankBreakdown]
    budget: YearlyBudgetSummary
    monthly_breakdown: list[MonthBreakdown]

    highest_income_month: MonthBreakdown
    highest_expense_month: MonthBreakdown
    highest_savings_month: MonthBreakdown
    lowest_savings_month: MonthBreakdown

    year_over_year: YearOverYearComparison | None
