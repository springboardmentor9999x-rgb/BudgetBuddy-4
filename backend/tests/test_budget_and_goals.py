def test_budget_crossing_creates_single_alert(client, headers_a):
    budget = client.post("/budgets/", headers=headers_a, json={"category": "Shopping", "amount": 5000, "month": "2026-08"})
    assert budget.status_code == 201

    expense = client.post("/expenses/", headers=headers_a, json={"category": "Shopping", "amount": 6000, "bank_account": "Test Bank 1234"})
    assert expense.status_code == 200

    alerts = [item for item in client.get("/notifications/", headers=headers_a).json() if item["type"] == "budget_alert"]
    assert len(alerts) == 1
    assert "exceeded" in alerts[0]["message"].lower()


def test_goal_contributions_complete_goal_and_create_milestones(client, headers_a):
    created = client.post("/goals/", headers=headers_a, json={"goal_name": "Emergency fund", "target_amount": 1000})
    assert created.status_code == 201
    goal_id = created.json()["id"]

    halfway = client.patch(f"/goals/{goal_id}/contribute", headers=headers_a, json={"amount": 500})
    assert halfway.status_code == 200
    assert halfway.json()["progress_percentage"] == 50

    completed = client.patch(f"/goals/{goal_id}/contribute", headers=headers_a, json={"amount": 500})
    assert completed.status_code == 200
    assert completed.json()["status"] == "completed"

    notifications = client.get("/notifications/", headers=headers_a).json()
    milestones = [item for item in notifications if item["type"] == "goal_milestone"]
    assert len(milestones) == 2
