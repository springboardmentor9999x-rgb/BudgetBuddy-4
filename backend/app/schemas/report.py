from pydantic import BaseModel





class ReportResponse(BaseModel):

    user_id: int

    total_income: float

    total_expense: float

    total_budget: float

    total_saved: float

    remaining_balance: float