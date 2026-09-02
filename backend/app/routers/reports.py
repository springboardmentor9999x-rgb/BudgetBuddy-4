from datetime import date
from typing import Optional
from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
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

from openpyxl import Workbook
from openpyxl.styles import Font, Alignment, PatternFill
from openpyxl.utils import get_column_letter

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
# Monthly / Date Range Report
# =========================================================

@router.get("/monthly")
def monthly_report(
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
    # Determine Report Period
    # =====================================================

    from_date, to_date = get_report_dates(
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
            Income.user_id
            == current_user.id,

            Income.date >= from_date,

            Income.date <= to_date,
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
            Expense.user_id
            == current_user.id,

            Expense.date >= from_date,

            Expense.date <= to_date,
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
            SavingsGoal.user_id
            == current_user.id
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
    # Spending by Category
    # =====================================================

    category_results = (
        db.query(
            Expense.category,

            func.sum(
                Expense.amount
            ).label("total"),
        )
        .filter(
            Expense.user_id
            == current_user.id,

            Expense.date >= from_date,

            Expense.date <= to_date,
        )
        .group_by(
            Expense.category
        )
        .order_by(
            func.sum(
                Expense.amount
            ).desc()
        )
        .all()
    )


    spending_by_category = [

        {
            "category": category,

            "total": float(
                total or 0
            ),
        }

        for category, total
        in category_results

    ]


    # =====================================================
    # Response
    # =====================================================

    return {

        "month": month,

        "year": year,

        "from_date": str(
            from_date
        ),

        "to_date": str(
            to_date
        ),

        "total_income": total_income,

        "total_expenses": total_expenses,

        "total_savings": total_savings,

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

        "spending_by_category":
            spending_by_category,
    }


# =========================================================
# PDF REPORT
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

    report_from, report_to = get_report_dates(
        month,
        year,
        from_date,
        to_date,
    )


    # =====================================================
    # Totals
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
    # PDF
    # =====================================================

    buffer = BytesIO()

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


    story = []


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
            10,
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


    for income in incomes:

        transaction_data.append(

            [

                income.date.strftime(
                    "%d/%m/%Y"
                ),

                "Income",

                (
                    income.description
                    or income.source
                ),

                income.source,

                f"+Rs. "
                f"{float(income.amount):,.2f}",

            ]

        )


    for expense in expenses:

        transaction_data.append(

            [

                expense.date.strftime(
                    "%d/%m/%Y"
                ),

                "Expense",

                (
                    expense.description
                    or expense.category
                ),

                expense.category,

                f"-Rs. "
                f"{float(expense.amount):,.2f}",

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


    story.append(
        Paragraph(
            "Generated by BudgetBuddy",
            styles["BodyText"],
        )
    )


    document.build(
        story
    )


    buffer.seek(0)


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


# =========================================================
# EXCEL REPORT
# =========================================================

@router.get("/excel")
def export_excel(
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
    # Calculate Totals
    # =====================================================

    total_income = sum(
        float(income.amount)
        for income in incomes
    )


    total_expenses = sum(
        float(expense.amount)
        for expense in expenses
    )


    net_savings = (
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
    # Create Excel Workbook
    # =====================================================

    workbook = Workbook()

    worksheet = workbook.active

    worksheet.title = "Financial Report"


    # =====================================================
    # Title
    # =====================================================

    worksheet.merge_cells(
        "A1:E1"
    )

    worksheet["A1"] = (
        "BUDGETBUDDY FINANCIAL REPORT"
    )

    worksheet["A1"].font = Font(
        bold=True,
        size=16,
    )

    worksheet["A1"].alignment = Alignment(
        horizontal="center"
    )


    # =====================================================
    # Report Period
    # =====================================================

    worksheet.merge_cells(
        "A2:E2"
    )

    worksheet["A2"] = (
        f"Report Period: "
        f"{report_from.strftime('%d/%m/%Y')} "
        f"to "
        f"{report_to.strftime('%d/%m/%Y')}"
    )

    worksheet["A2"].alignment = Alignment(
        horizontal="center"
    )


    # =====================================================
    # INCOME SECTION
    # =====================================================

    worksheet.merge_cells(
        "A4:E4"
    )

    worksheet["A4"] = "INCOME"

    worksheet["A4"].font = Font(
        bold=True,
        size=13,
    )


    income_headers = [
        "Date",
        "Source",
        "Bank Account",
        "Description",
        "Amount",
    ]


    for column, header in enumerate(
        income_headers,
        start=1,
    ):

        cell = worksheet.cell(
            row=5,
            column=column,
            value=header,
        )

        cell.font = Font(
            bold=True
        )


    income_row = 6


    for income in incomes:

        bank_name = (
            getattr(
                income,
                "bank_name",
                None,
            )
            or "N/A"
        )


        worksheet.cell(
            row=income_row,
            column=1,
            value=income.date,
        )


        worksheet.cell(
            row=income_row,
            column=2,
            value=income.source,
        )


        worksheet.cell(
            row=income_row,
            column=3,
            value=bank_name,
        )


        worksheet.cell(
            row=income_row,
            column=4,
            value=(
                income.description
                or ""
            ),
        )


        worksheet.cell(
            row=income_row,
            column=5,
            value=float(
                income.amount
            ),
        )


        income_row += 1


    if not incomes:

        worksheet.cell(
            row=income_row,
            column=1,
            value="No income transactions",
        )

        income_row += 1


    worksheet.cell(
        row=income_row,
        column=4,
        value="TOTAL INCOME",
    )

    worksheet.cell(
        row=income_row,
        column=4,
    ).font = Font(
        bold=True
    )


    worksheet.cell(
        row=income_row,
        column=5,
        value=total_income,
    )

    worksheet.cell(
        row=income_row,
        column=5,
    ).font = Font(
        bold=True
    )


    # =====================================================
    # EXPENSE SECTION
    # =====================================================

    expense_start = (
        income_row + 3
    )


    worksheet.merge_cells(
        start_row=expense_start,
        start_column=1,
        end_row=expense_start,
        end_column=5,
    )


    worksheet.cell(
        row=expense_start,
        column=1,
        value="EXPENSES",
    )


    worksheet.cell(
        row=expense_start,
        column=1,
    ).font = Font(
        bold=True,
        size=13,
    )


    expense_header_row = (
        expense_start + 1
    )


    expense_headers = [
        "Date",
        "Category",
        "Description",
        "Amount",
        "Status",
    ]


    for column, header in enumerate(
        expense_headers,
        start=1,
    ):

        cell = worksheet.cell(
            row=expense_header_row,
            column=column,
            value=header,
        )

        cell.font = Font(
            bold=True
        )


    expense_row = (
        expense_header_row + 1
    )


    for expense in expenses:

        worksheet.cell(
            row=expense_row,
            column=1,
            value=expense.date,
        )


        worksheet.cell(
            row=expense_row,
            column=2,
            value=expense.category,
        )


        worksheet.cell(
            row=expense_row,
            column=3,
            value=(
                expense.description
                or ""
            ),
        )


        worksheet.cell(
            row=expense_row,
            column=4,
            value=float(
                expense.amount
            ),
        )


        worksheet.cell(
            row=expense_row,
            column=5,
            value="Expense",
        )


        expense_row += 1


    if not expenses:

        worksheet.cell(
            row=expense_row,
            column=1,
            value="No expense transactions",
        )

        expense_row += 1


    worksheet.cell(
        row=expense_row,
        column=3,
        value="TOTAL EXPENSES",
    )


    worksheet.cell(
        row=expense_row,
        column=3,
    ).font = Font(
        bold=True
    )


    worksheet.cell(
        row=expense_row,
        column=4,
        value=total_expenses,
    )


    worksheet.cell(
        row=expense_row,
        column=4,
    ).font = Font(
        bold=True
    )


    # =====================================================
    # SUMMARY SECTION
    # =====================================================

    summary_start = (
        expense_row + 3
    )


    worksheet.merge_cells(
        start_row=summary_start,
        start_column=1,
        end_row=summary_start,
        end_column=5,
    )


    worksheet.cell(
        row=summary_start,
        column=1,
        value="SUMMARY",
    )


    worksheet.cell(
        row=summary_start,
        column=1,
    ).font = Font(
        bold=True,
        size=13,
    )


    summary = [

        (
            "Total Income",
            total_income,
        ),

        (
            "Total Expenses",
            total_expenses,
        ),

        (
            "Net Savings",
            net_savings,
        ),

        (
            "Savings Rate",
            round(
                savings_rate,
                1,
            ),
        ),

    ]


    for index, (
        label,
        value,
    ) in enumerate(
        summary,
        start=summary_start + 1,
    ):

        worksheet.cell(
            row=index,
            column=1,
            value=label,
        )

        worksheet.cell(
            row=index,
            column=2,
            value=value,
        )


    # =====================================================
    # Formatting
    # =====================================================

    for row in worksheet.iter_rows():

        for cell in row:

            cell.alignment = Alignment(
                vertical="center"
            )


    # Date formatting

    for row in range(
        6,
        income_row,
    ):

        worksheet.cell(
            row=row,
            column=1,
        ).number_format = "DD/MM/YYYY"


    for row in range(
        expense_header_row + 1,
        expense_row,
    ):

        worksheet.cell(
            row=row,
            column=1,
        ).number_format = "DD/MM/YYYY"


    # Currency formatting

    for row in worksheet.iter_rows():

        for cell in row:

            if cell.column in [
                5,
                4,
                2,
            ]:

                if isinstance(
                    cell.value,
                    (int, float),
                ):

                    cell.number_format = (
                        '₹#,##0.00'
                    )


    # =====================================================
    # Column Widths
    # =====================================================

    widths = {
        "A": 18,
        "B": 22,
        "C": 25,
        "D": 35,
        "E": 18,
    }


    for column, width in widths.items():

        worksheet.column_dimensions[
            column
        ].width = width


    # =====================================================
    # Freeze Header
    # =====================================================

    worksheet.freeze_panes = "A5"


    # =====================================================
    # Save Excel
    # =====================================================

    buffer = BytesIO()

    workbook.save(
        buffer
    )

    buffer.seek(0)


    # =====================================================
    # Download
    # =====================================================

    return StreamingResponse(

        buffer,

        media_type=(
            "application/vnd.openxmlformats-officedocument."
            "spreadsheetml.sheet"
        ),

        headers={

            "Content-Disposition": (
                "attachment; "
                f"filename="
                f"budgetbuddy_"
                f"{report_from}_"
                f"{report_to}.xlsx"
            )

        },

    )