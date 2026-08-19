from datetime import datetime
from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.report import monthly_report
from app.database import get_db
from app.models.user import User
from app.core.time import utcnow_naive

router = APIRouter()


def _period(month: int | None, year: int | None) -> tuple[int, int]:
    now = utcnow_naive()
    return year or now.year, month or now.month


def _report_query(
    month: int | None = Query(default=None, ge=1, le=12),
    year: int | None = Query(default=None, ge=2000, le=2100),
) -> tuple[int, int]:
    return _period(month, year)


@router.get("/monthly")
def get_monthly_report(
    period: tuple[int, int] = Depends(_report_query),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    year, month = period
    return monthly_report(db, current_user.id, year, month)


@router.get("/export/pdf")
def export_pdf(
    period: tuple[int, int] = Depends(_report_query),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    year, month = period
    report = monthly_report(db, current_user.id, year, month)
    buffer = BytesIO()
    document = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter
    y = height - 48

    def line(text: str, spacing: int = 16):
        nonlocal y
        if y < 48:
            document.showPage()
            y = height - 48
        document.drawString(48, y, text[:115])
        y -= spacing

    line(f"BudgetBuddy monthly report - {report['period']['label']}", 22)
    summary = report["summary"]
    line(f"Total income: INR {summary['total_income']:.2f}")
    line(f"Total expenses: INR {summary['total_expenses']:.2f}")
    line(f"Net balance: INR {summary['net_balance']:.2f}")
    line(f"Savings rate: {summary['savings_rate']:.2f}%", 22)
    line("Spending by category:", 18)
    for item in report["spending_by_category"] or [{"category": "None", "total": 0}]:
        line(f"  {item['category']}: INR {item['total']:.2f}")
    line("Transactions:", 18)
    for item in report["transactions"] or [{"date": "", "type": "none", "label": "No transactions", "amount": 0}]:
        line(f"  {item['date'][:10] if item['date'] else '-'} | {item['type']} | {item['label']} | INR {item['amount']:.2f}")
    document.save()
    buffer.seek(0)
    filename = f"budgetbuddy-report-{year}-{month:02d}.pdf"
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition": f"attachment; filename={filename}"})


@router.get("/export/excel")
def export_excel(
    period: tuple[int, int] = Depends(_report_query),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    year, month = period
    report = monthly_report(db, current_user.id, year, month)
    workbook = Workbook()
    summary_sheet = workbook.active
    summary_sheet.title = "Summary"
    summary_sheet.append(["BudgetBuddy monthly report", report["period"]["label"]])
    summary_sheet.append(["Total income", report["summary"]["total_income"]])
    summary_sheet.append(["Total expenses", report["summary"]["total_expenses"]])
    summary_sheet.append(["Net balance", report["summary"]["net_balance"]])
    summary_sheet.append(["Savings rate (%)", report["summary"]["savings_rate"]])
    summary_sheet.append([])
    summary_sheet.append(["Category", "Total"])
    for item in report["spending_by_category"]:
        summary_sheet.append([item["category"], item["total"]])

    transactions_sheet = workbook.create_sheet("Transactions")
    transactions_sheet.append(["Date", "Type", "Label", "Description", "Amount"])
    for item in report["transactions"]:
        transactions_sheet.append([item["date"], item["type"], item["label"], item["description"] or "", item["amount"]])
    for sheet in workbook.worksheets:
        sheet.freeze_panes = "A2"
        for column in sheet.columns:
            width = min(max(len(str(cell.value or "")) for cell in column) + 2, 45)
            sheet.column_dimensions[column[0].column_letter].width = width

    buffer = BytesIO()
    workbook.save(buffer)
    buffer.seek(0)
    filename = f"budgetbuddy-report-{year}-{month:02d}.xlsx"
    return StreamingResponse(buffer, media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", headers={"Content-Disposition": f"attachment; filename={filename}"})
