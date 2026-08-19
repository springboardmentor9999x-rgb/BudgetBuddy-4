from io import BytesIO

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.pdfgen import canvas
from openpyxl import Workbook

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal


router = APIRouter()


# =========================================================
# Helper: Get Monthly Report Data
# =========================================================

def get_monthly_report_data(
    db: Session,
    user_id: int,
    month: int,
    year: int,
):
    # -------------------------
    # Total Income
    # -------------------------

    total_income = (
        db.query(
            func.sum(Income.amount)
        )
        .filter(
            Income.user_id == user_id,
            func.extract(
                "month",
                Income.date,
            ) == month,
            func.extract(
                "year",
                Income.date,
            ) == year,
        )
        .scalar()
        or 0
    )


    # -------------------------
    # Total Expenses
    # -------------------------

    total_expenses = (
        db.query(
            func.sum(Expense.amount)
        )
        .filter(
            Expense.user_id == user_id,
            func.extract(
                "month",
                Expense.date,
            ) == month,
            func.extract(
                "year",
                Expense.date,
            ) == year,
        )
        .scalar()
        or 0
    )


    # -------------------------
    # Total Savings
    # -------------------------

    total_savings = (
        db.query(
            func.sum(
                SavingsGoal.current_amount
            )
        )
        .filter(
            SavingsGoal.user_id == user_id
        )
        .scalar()
        or 0
    )


    # -------------------------
    # Net Savings
    # -------------------------

    net_savings = (
        float(total_income)
        - float(total_expenses)
    )


    # -------------------------
    # Available Amount
    # -------------------------

    available_amount = (
        float(total_income)
        - float(total_expenses)
        - float(total_savings)
    )


    # -------------------------
    # Savings Rate
    # -------------------------

    savings_rate = (
        (
            net_savings
            / float(total_income)
        ) * 100
        if float(total_income) > 0
        else 0
    )


    return {
        "total_income": float(
            total_income
        ),

        "total_expenses": float(
            total_expenses
        ),

        "total_savings": float(
            total_savings
        ),

        "net_savings": float(
            net_savings
        ),

        "available_amount": float(
            available_amount
        ),

        "savings_rate": round(
            savings_rate,
            1,
        ),
    }


# =========================================================
# Export Monthly Report PDF
# =========================================================

@router.get("/pdf")
def export_pdf(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    report = get_monthly_report_data(
        db,
        current_user.id,
        month,
        year,
    )


    # -------------------------
    # Create PDF
    # -------------------------

    buffer = BytesIO()

    pdf = canvas.Canvas(buffer)

    pdf.setTitle(
        "BudgetBuddy Monthly Report"
    )


    # -------------------------
    # Title
    # -------------------------

    pdf.drawString(
        50,
        800,
        "BudgetBuddy Monthly Report",
    )


    pdf.drawString(
        50,
        770,
        f"Month: {month}/{year}",
    )


    # -------------------------
    # Financial Information
    # -------------------------

    pdf.drawString(
        50,
        730,
        (
            f"Total Income: "
            f"Rs. {report['total_income']:.2f}"
        ),
    )


    pdf.drawString(
        50,
        700,
        (
            f"Total Expenses: "
            f"Rs. {report['total_expenses']:.2f}"
        ),
    )


    pdf.drawString(
        50,
        670,
        (
            f"Total Savings: "
            f"Rs. {report['total_savings']:.2f}"
        ),
    )


    pdf.drawString(
        50,
        640,
        (
            f"Net Savings: "
            f"Rs. {report['net_savings']:.2f}"
        ),
    )


    pdf.drawString(
        50,
        610,
        (
            f"Available Amount: "
            f"Rs. {report['available_amount']:.2f}"
        ),
    )


    pdf.drawString(
        50,
        580,
        (
            f"Savings Rate: "
            f"{report['savings_rate']:.1f}%"
        ),
    )


    # -------------------------
    # Footer
    # -------------------------

    pdf.drawString(
        50,
        530,
        "Generated by BudgetBuddy",
    )


    pdf.save()

    buffer.seek(0)


    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": (
                f"attachment; filename="
                f"budgetbuddy_{month}_{year}.pdf"
            )
        },
    )


# =========================================================
# Export Monthly Report Excel
# =========================================================

@router.get("/excel")
def export_excel(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    report = get_monthly_report_data(
        db,
        current_user.id,
        month,
        year,
    )


    # -------------------------
    # Create Workbook
    # -------------------------

    workbook = Workbook()

    worksheet = workbook.active

    worksheet.title = "Monthly Report"


    # -------------------------
    # Report Title
    # -------------------------

    worksheet["A1"] = (
        "BudgetBuddy Monthly Report"
    )


    # -------------------------
    # Report Details
    # -------------------------

    worksheet["A3"] = "Month"
    worksheet["B3"] = month

    worksheet["A4"] = "Year"
    worksheet["B4"] = year


    worksheet["A5"] = "Total Income"
    worksheet["B5"] = (
        report["total_income"]
    )


    worksheet["A6"] = "Total Expenses"
    worksheet["B6"] = (
        report["total_expenses"]
    )


    worksheet["A7"] = "Total Savings"
    worksheet["B7"] = (
        report["total_savings"]
    )


    worksheet["A8"] = "Net Savings"
    worksheet["B8"] = (
        report["net_savings"]
    )


    worksheet["A9"] = "Available Amount"
    worksheet["B9"] = (
        report["available_amount"]
    )


    worksheet["A10"] = "Savings Rate"
    worksheet["B10"] = (
        report["savings_rate"]
    )


    # -------------------------
    # Basic Formatting
    # -------------------------

    worksheet.column_dimensions[
        "A"
    ].width = 25

    worksheet.column_dimensions[
        "B"
    ].width = 20


    # -------------------------
    # Save Workbook
    # -------------------------

    buffer = BytesIO()

    workbook.save(buffer)

    buffer.seek(0)


    return StreamingResponse(
        buffer,
        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": (
                f"attachment; filename="
                f"budgetbuddy_{month}_{year}.xlsx"
            )
        },
    )