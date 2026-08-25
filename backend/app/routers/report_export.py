from io import BytesIO
from datetime import date
from typing import Optional

from fastapi import (
    APIRouter,
    Depends,
    Query,
)

from fastapi.responses import (
    StreamingResponse,
)

from sqlalchemy.orm import Session
from sqlalchemy import func

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.lib.enums import TA_CENTER
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.units import mm

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal


router = APIRouter()


# =========================================================
# Helper: Get Report Period
# =========================================================

def get_report_dates(
    month: int,
    year: int,
    from_date: Optional[date],
    to_date: Optional[date],
):

    if from_date is None:

        from_date = date(
            year,
            month,
            1,
        )

    if to_date is None:

        if month == 12:

            to_date = date(
                year + 1,
                1,
                1,
            )

        else:

            to_date = date(
                year,
                month + 1,
                1,
            )

    return from_date, to_date


# =========================================================
# PDF Report
# =========================================================

@router.get("/pdf")
def export_pdf(

    month: int = Query(
        ...,
        ge=1,
        le=12,
    ),

    year: int = Query(
        ...,
        ge=2000,
    ),

    from_date: Optional[date] = Query(
        None
    ),

    to_date: Optional[date] = Query(
        None
    ),

    db: Session = Depends(get_db),

    current_user: User = Depends(
        get_current_user
    ),
):

    # =====================================================
    # Report Period
    # =====================================================

    report_from, report_to = get_report_dates(
        month,
        year,
        from_date,
        to_date,
    )

    # =====================================================
    # Total Income
    # =====================================================

    total_income = (
        db.query(
            func.sum(
                Income.amount
            )
        )
        .filter(
            Income.user_id == current_user.id,

            Income.date >= report_from,

            Income.date <= report_to,
        )
        .scalar()
        or 0
    )

    # =====================================================
    # Total Expenses
    # =====================================================

    total_expenses = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id == current_user.id,

            Expense.date >= report_from,

            Expense.date <= report_to,
        )
        .scalar()
        or 0
    )

    # =====================================================
    # Total Savings
    # =====================================================

    total_savings = (
        db.query(
            func.sum(
                SavingsGoal.current_amount
            )
        )
        .filter(
            SavingsGoal.user_id == current_user.id
        )
        .scalar()
        or 0
    )

    # =====================================================
    # Financial Calculations
    # =====================================================

    total_income = float(
        total_income
    )

    total_expenses = float(
        total_expenses
    )

    total_savings = float(
        total_savings
    )

    net_savings = (
        total_income
        - total_expenses
    )

    available_amount = (
        total_income
        - total_expenses
    )

    savings_rate = (
        (
            net_savings
            / total_income
        ) * 100
        if total_income > 0
        else 0
    )

    # =====================================================
    # Get Income Transactions
    # =====================================================

    incomes = (
        db.query(Income)
        .filter(
            Income.user_id == current_user.id,

            Income.date >= report_from,

            Income.date <= report_to,
        )
        .order_by(
            Income.date.desc()
        )
        .all()
    )

    # =====================================================
    # Get Expense Transactions
    # =====================================================

    expenses = (
        db.query(Expense)
        .filter(
            Expense.user_id == current_user.id,

            Expense.date >= report_from,

            Expense.date <= report_to,
        )
        .order_by(
            Expense.date.desc()
        )
        .all()
    )

    # =====================================================
    # Create Transaction List
    # =====================================================

    transactions = []

    for income in incomes:

        transactions.append(
            {
                "date": income.date,

                "type": "Income",

                "description": (
                    income.description
                    or income.source
                ),

                "category": income.source,

                "amount": float(
                    income.amount
                ),
            }
        )

    for expense in expenses:

        transactions.append(
            {
                "date": expense.date,

                "type": "Expense",

                "description": (
                    expense.description
                    or expense.category
                ),

                "category": expense.category,

                "amount": -float(
                    expense.amount
                ),
            }
        )

    transactions.sort(
        key=lambda item: item["date"],
        reverse=True,
    )

    # =====================================================
    # PDF Buffer
    # =====================================================

    buffer = BytesIO()

    # =====================================================
    # PDF Document
    # =====================================================

    document = SimpleDocTemplate(

        buffer,

        pagesize=A4,

        rightMargin=15 * mm,

        leftMargin=15 * mm,

        topMargin=15 * mm,

        bottomMargin=15 * mm,
    )

    styles = getSampleStyleSheet()

    title_style = styles["Title"]

    title_style.alignment = TA_CENTER

    heading_style = styles["Heading2"]

    normal_style = styles["Normal"]

    small_style = styles["BodyText"]

    small_style.fontSize = 8

    # =====================================================
    # Story
    # =====================================================

    story = []

    # =====================================================
    # Header
    # =====================================================

    story.append(
        Paragraph(
            "BUDGETBUDDY",
            title_style,
        )
    )

    story.append(
        Paragraph(
            "Financial Statement",
            heading_style,
        )
    )

    story.append(
        Spacer(
            1,
            8,
        )
    )

    user_name = (
        getattr(
            current_user,
            "full_name",
            None,
        )
        or getattr(
            current_user,
            "email",
            "User",
        )
    )

    story.append(
        Paragraph(
            f"<b>Account Holder:</b> "
            f"{user_name}",
            normal_style,
        )
    )

    story.append(
        Paragraph(
            f"<b>Report Period:</b> "
            f"{report_from.strftime('%d %b %Y')} "
            f"to "
            f"{report_to.strftime('%d %b %Y')}",
            normal_style,
        )
    )

    story.append(
        Spacer(
            1,
            12,
        )
    )

    # =====================================================
    # Summary
    # =====================================================

    story.append(
        Paragraph(
            "Financial Summary",
            heading_style,
        )
    )

    summary_data = [

        [
            "Total Income",
            f"Rs. {total_income:,.2f}",
        ],

        [
            "Total Expenses",
            f"Rs. {total_expenses:,.2f}",
        ],

        [
            "Net Savings",
            f"Rs. {net_savings:,.2f}",
        ],

        [
            "Available Amount",
            f"Rs. {available_amount:,.2f}",
        ],

        [
            "Savings Rate",
            f"{savings_rate:.1f}%",
        ],

    ]

    summary_table = Table(
        summary_data,
        colWidths=[
            80 * mm,
            80 * mm,
        ],
    )

    summary_table.setStyle(
        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, -1),
                colors.whitesmoke,
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.5,
                colors.lightgrey,
            ),

            (
                "FONTNAME",
                (0, 0),
                (0, -1),
                "Helvetica-Bold",
            ),

            (
                "ALIGN",
                (1, 0),
                (1, -1),
                "RIGHT",
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                7,
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                7,
            ),

        ])
    )

    story.append(
        summary_table
    )

    story.append(
        Spacer(
            1,
            15,
        )
    )

    # =====================================================
    # Transactions
    # =====================================================

    story.append(
        Paragraph(
            "Transaction History",
            heading_style,
        )
    )

    transaction_data = [

        [
            "Date",
            "Type",
            "Description",
            "Category",
            "Amount",
        ]

    ]

    for transaction in transactions:

        amount = transaction["amount"]

        if amount >= 0:

            amount_text = (
                f"+Rs. {amount:,.2f}"
            )

        else:

            amount_text = (
                f"-Rs. "
                f"{abs(amount):,.2f}"
            )

        transaction_data.append(

            [

                transaction[
                    "date"
                ].strftime(
                    "%d/%m/%Y"
                ),

                transaction[
                    "type"
                ],

                str(
                    transaction[
                        "description"
                    ]
                )[:35],

                str(
                    transaction[
                        "category"
                    ]
                )[:20],

                amount_text,

            ]

        )

    if len(transaction_data) == 1:

        transaction_data.append(

            [
                "-",
                "-",
                "No transactions",
                "-",
                "Rs. 0.00",
            ]

        )

    transaction_table = Table(

        transaction_data,

        repeatRows=1,

        colWidths=[
            25 * mm,
            22 * mm,
            55 * mm,
            32 * mm,
            30 * mm,
        ],
    )

    transaction_table.setStyle(
        TableStyle([

            (
                "BACKGROUND",
                (0, 0),
                (-1, 0),
                colors.HexColor(
                    "#2563EB"
                ),
            ),

            (
                "TEXTCOLOR",
                (0, 0),
                (-1, 0),
                colors.white,
            ),

            (
                "FONTNAME",
                (0, 0),
                (-1, 0),
                "Helvetica-Bold",
            ),

            (
                "FONTSIZE",
                (0, 0),
                (-1, -1),
                7,
            ),

            (
                "GRID",
                (0, 0),
                (-1, -1),
                0.4,
                colors.lightgrey,
            ),

            (
                "ROWBACKGROUNDS",
                (0, 1),
                (-1, -1),
                [
                    colors.white,
                    colors.HexColor(
                        "#F8FAFC"
                    ),
                ],
            ),

            (
                "ALIGN",
                (-1, 1),
                (-1, -1),
                "RIGHT",
            ),

            (
                "TOPPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),

            (
                "BOTTOMPADDING",
                (0, 0),
                (-1, -1),
                5,
            ),

        ])
    )

    story.append(
        transaction_table
    )

    story.append(
        Spacer(
            1,
            15,
        )
    )

    # =====================================================
    # Footer
    # =====================================================

    story.append(
        Paragraph(
            "Generated by BudgetBuddy",
            small_style,
        )
    )

    # =====================================================
    # Build PDF
    # =====================================================

    document.build(
        story
    )

    buffer.seek(0)

    # =====================================================
    # Download PDF
    # =====================================================

    return StreamingResponse(

        buffer,

        media_type="application/pdf",

        headers={

            "Content-Disposition": (
                "attachment; "
                f"filename="
                f"budgetbuddy_"
                f"{report_from}_"
                f"{report_to}.pdf"
            )

        },

    )