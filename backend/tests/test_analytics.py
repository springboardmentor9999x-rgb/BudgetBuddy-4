def test_analytics_returns_empty_chart_data_for_new_user(client, headers_a):
    summary = client.get("/analytics/summary", headers=headers_a)
    assert summary.status_code == 200
    assert summary.json() == {
        "total_income": 0.0,
        "total_expenses": 0.0,
        "net_balance": 0.0,
        "savings_rate": 0,
    }

    assert client.get("/analytics/spending-by-category", headers=headers_a).json() == []
    trend = client.get("/analytics/monthly-trend?months=6", headers=headers_a)
    assert trend.status_code == 200
    assert len(trend.json()) == 6
    assert all(item["income"] == 0.0 and item["expenses"] == 0.0 for item in trend.json())
    assert client.get("/analytics/savings-progress", headers=headers_a).json() == []


def test_dashboard_returns_empty_summary_for_new_user(client, headers_a):
    response = client.get("/dashboard/", headers=headers_a)
    assert response.status_code == 200
    assert response.json()["summary"] == {
        "total_income": 0.0,
        "total_expense": 0.0,
        "balance": 0.0,
        "savings": 0.0,
    }


def test_analytics_is_user_scoped_and_groups_spending(client, headers_a, headers_b):
    created = client.post(
        "/expenses/",
        headers=headers_a,
        json={"category": "Food", "amount": 125, "bank_account": "Test Bank 1234"},
    )
    assert created.status_code == 200

    assert client.get("/analytics/spending-by-category", headers=headers_b).json() == []
    categories = client.get("/analytics/spending-by-category", headers=headers_a).json()
    assert categories == [{"category": "Food", "total": 125.0}]
