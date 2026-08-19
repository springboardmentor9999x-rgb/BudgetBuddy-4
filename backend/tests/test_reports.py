from io import BytesIO

from openpyxl import load_workbook


def test_empty_monthly_report_and_exports_are_valid(client, headers_a):
    report = client.get("/reports/monthly", headers=headers_a)
    assert report.status_code == 200
    assert report.json()["summary"]["total_income"] == 0.0
    assert report.json()["transactions"] == []

    pdf = client.get("/reports/export/pdf", headers=headers_a)
    assert pdf.status_code == 200
    assert pdf.headers["content-type"].startswith("application/pdf")
    assert pdf.content.startswith(b"%PDF")

    excel = client.get("/reports/export/excel", headers=headers_a)
    assert excel.status_code == 200
    assert excel.headers["content-type"].startswith("application/vnd.openxmlformats")
    workbook = load_workbook(BytesIO(excel.content), read_only=True)
    assert workbook.sheetnames == ["Summary", "Transactions"]


def test_monthly_report_contains_only_current_users_transactions(client, headers_a, headers_b):
    income = client.post(
        "/income/",
        headers=headers_a,
        json={
            "source": "Salary",
            "amount": 3000,
            "description": "Monthly pay",
            "bank_account": "Test Bank 1234",
        },
    )
    expense = client.post(
        "/expenses/",
        headers=headers_a,
        json={"category": "Food", "amount": 450, "bank_account": "Test Bank 1234"},
    )
    assert income.status_code == 200
    assert expense.status_code == 200

    report = client.get("/reports/monthly", headers=headers_a).json()
    assert report["summary"]["total_income"] == 3000.0
    assert report["summary"]["total_expenses"] == 450.0
    assert report["spending_by_category"] == [{"category": "Food", "total": 450.0}]
    assert len(report["transactions"]) == 2

    other_user_report = client.get("/reports/monthly", headers=headers_b).json()
    assert other_user_report["transactions"] == []
