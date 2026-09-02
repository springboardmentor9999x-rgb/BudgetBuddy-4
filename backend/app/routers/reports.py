from io import BytesIO

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.time import utcnow_naive
from app.crud.report import monthly_report
from app.database import get_db
from app.models.user import User

router = APIRouter()

def _report_query(month: int | None = Query(None, ge=1, le=12), year: int | None = Query(None, ge=2000, le=2100)):
    now = utcnow_naive()
    return year or now.year, month or now.month

def _rows(report):
    balance = report["summary"].get("opening_balance", 0)
    result = []
    for item in sorted(report["transactions"], key=lambda row: row["date"] or ""):
        balance += item["amount"] if item["type"] == "income" else -item["amount"]
        result.append({**item, "balance": balance})
    return result

@router.get("/monthly")
def get_monthly_report(period=Depends(_report_query), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return monthly_report(db, current_user.id, *period)

@router.get("/export/pdf")
def export_pdf(period=Depends(_report_query), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    year, month = period
    report = monthly_report(db, current_user.id, year, month)
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), rightMargin=15*mm, leftMargin=15*mm, topMargin=16*mm, bottomMargin=15*mm, title=f"BudgetBuddy Statement - {report['period']['label']}")
    styles = getSampleStyleSheet()
    small = ParagraphStyle("small", parent=styles["Normal"], fontSize=8, leading=11, textColor=colors.HexColor("#64748b"))
    heading = ParagraphStyle("statement-heading", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=20, leading=24, textColor=colors.white, spaceAfter=4)
    right = ParagraphStyle("statement-period", parent=small, alignment=TA_RIGHT, fontName="Helvetica", fontSize=8, leading=11, textColor=colors.white)
    story = [Table([[Paragraph("BudgetBuddy<br/><font name='Helvetica-Bold' size='8' color='#cbd5e1'>PERSONAL FINANCE STATEMENT</font>", heading), Paragraph(f"<font color='#cbd5e1'>STATEMENT PERIOD</font><br/><b>{report['period']['label']}</b><br/><font color='#cbd5e1'>Reference: BB-{year}{month:02d}</font>", right)]], colWidths=[170*mm, 80*mm], style=[("BACKGROUND",(0,0),(-1,-1),colors.HexColor("#111827")),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("BOX",(0,0),(-1,-1),0,colors.white),("LEFTPADDING",(0,0),(-1,-1),12),("RIGHTPADDING",(0,0),(-1,-1),12),("TOPPADDING",(0,0),(-1,-1),12),("BOTTOMPADDING",(0,0),(-1,-1),12)]), Spacer(1,7*mm)]
    summary = report["summary"]
    cards = [["OPENING BALANCE","TOTAL CREDITS","TOTAL DEBITS","CLOSING BALANCE"],[f"INR {summary['opening_balance']:,.2f}",f"INR {summary['total_income']:,.2f}",f"INR {summary['total_expenses']:,.2f}",f"INR {summary['closing_balance']:,.2f}"]]
    story += [Table(cards, colWidths=[62.5*mm]*4, style=[("BACKGROUND",(0,0),(-1,0),colors.HexColor("#f1f5f9")),("TEXTCOLOR",(0,0),(-1,0),colors.HexColor("#64748b")),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,0),7),("FONTNAME",(0,1),(-1,1),"Helvetica-Bold"),("FONTSIZE",(0,1),(-1,1),11),("TEXTCOLOR",(1,1),(1,1),colors.HexColor("#0f9f6e")),("TEXTCOLOR",(2,1),(2,1),colors.HexColor("#df3f4f")),("GRID",(0,0),(-1,-1),.4,colors.HexColor("#cbd5e1")),("PADDING",(0,0),(-1,-1),8)]), Spacer(1,7*mm)]
    data = [["Date","Particulars","Debit (INR)","Credit (INR)","Balance (INR)"]]
    for item in _rows(report):
        data.append([item["date"][:10], Paragraph(f"<b>{item['label']}</b><br/><font color='#64748b'>{item['description'] or item['type'].title()+' transaction'}</font>", small), f"{item['amount']:,.2f}" if item["type"]=="expense" else "-", f"{item['amount']:,.2f}" if item["type"]=="income" else "-", f"{item['balance']:,.2f}"])
    if len(data)==1: data.append(["-","No transactions in this statement period","-","-","0.00"])
    table=Table(data, repeatRows=1, colWidths=[28*mm,100*mm,40*mm,40*mm,42*mm])
    table.setStyle(TableStyle([("BACKGROUND",(0,0),(-1,0),colors.HexColor("#6c4df6")),("TEXTCOLOR",(0,0),(-1,0),colors.white),("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),("FONTSIZE",(0,0),(-1,-1),8),("ALIGN",(2,0),(-1,-1),"RIGHT"),("VALIGN",(0,0),(-1,-1),"MIDDLE"),("ROWBACKGROUNDS",(0,1),(-1,-1),[colors.white,colors.HexColor("#f8fafc")]),("LINEBELOW",(0,1),(-1,-1),.3,colors.HexColor("#e2e8f0")),("TOPPADDING",(0,0),(-1,-1),7),("BOTTOMPADDING",(0,0),(-1,-1),7)]))
    story.append(table)
    def footer(canvas, document):
        canvas.saveState(); canvas.setFont("Helvetica",7); canvas.setFillColor(colors.HexColor("#64748b")); canvas.drawString(15*mm,8*mm,"Generated from your BudgetBuddy records."); canvas.drawRightString(282*mm,8*mm,f"Page {document.page}"); canvas.restoreState()
    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="application/pdf", headers={"Content-Disposition":f'attachment; filename="budgetbuddy-statement-{year}-{month:02d}.pdf"'})

@router.get("/export/excel")
def export_excel(period=Depends(_report_query), db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    year, month = period; report = monthly_report(db, current_user.id, year, month); wb=Workbook(); ws=wb.active; ws.title="Summary"; navy="111827"; purple="6C4DF6"; pale="F1F5F9"; white="FFFFFF"
    ws.merge_cells("A1:E2"); ws["A1"]="BudgetBuddy\nPERSONAL FINANCE STATEMENT"; ws["A1"].font=Font(color=white,bold=True,size=17); ws["A1"].fill=PatternFill("solid",fgColor=navy); ws["A1"].alignment=Alignment(vertical="center",wrap_text=True)
    ws.merge_cells("A3:E3"); ws["A3"]=f"Statement period: {report['period']['label']}   |   Reference: BB-{year}{month:02d}"; ws["A3"].font=Font(color=white,bold=True); ws["A3"].fill=PatternFill("solid",fgColor=navy)
    summary=report["summary"]; ws.append([]); ws.append(["Opening balance","Total credits","Total debits","Closing balance"]); ws.append([summary["opening_balance"],summary["total_income"],summary["total_expenses"],summary["closing_balance"]]); ws.append([]); ws.append(["Date","Particulars","Debit (INR)","Credit (INR)","Balance (INR)"])
    for item in _rows(report): ws.append([item["date"][:10],f"{item['label']} — {item['description'] or item['type'].title()+' transaction'}",item["amount"] if item["type"]=="expense" else None,item["amount"] if item["type"]=="income" else None,item["balance"]])
    for cell in ws[5]: cell.fill=PatternFill("solid",fgColor=pale); cell.font=Font(bold=True,color="64748B")
    for cell in ws[8]: cell.fill=PatternFill("solid",fgColor=purple); cell.font=Font(bold=True,color=white); cell.alignment=Alignment(horizontal="center")
    for row in ws.iter_rows(min_row=6,max_row=ws.max_row,min_col=3,max_col=5):
        for cell in row: cell.number_format='₹#,##0.00;[Red]-₹#,##0.00'
    ws.freeze_panes="A9"; ws.auto_filter.ref=f"A8:E{ws.max_row}"; widths=[14,54,20,20,22]
    for i,width in enumerate(widths,1): ws.column_dimensions[chr(64+i)].width=width
    tx = wb.create_sheet("Transactions")
    tx.append(["Date","Particulars","Debit (INR)","Credit (INR)","Balance (INR)"])
    for item in _rows(report):
        tx.append([item["date"][:10],f"{item['label']} — {item['description'] or item['type'].title()+' transaction'}",item["amount"] if item["type"]=="expense" else None,item["amount"] if item["type"]=="income" else None,item["balance"]])
    for cell in tx[1]: cell.fill=PatternFill("solid",fgColor=purple); cell.font=Font(bold=True,color=white); cell.alignment=Alignment(horizontal="center")
    for row in tx.iter_rows(min_row=2,min_col=3,max_col=5):
        for cell in row: cell.number_format='₹#,##0.00;[Red]-₹#,##0.00'
    tx.freeze_panes="A2"; tx.auto_filter.ref=f"A1:E{max(tx.max_row,1)}"
    for i,width in enumerate(widths,1): tx.column_dimensions[chr(64+i)].width=width
    buffer=BytesIO(); wb.save(buffer); buffer.seek(0)
    return StreamingResponse(buffer,media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",headers={"Content-Disposition":f'attachment; filename="budgetbuddy-statement-{year}-{month:02d}.xlsx"'})
