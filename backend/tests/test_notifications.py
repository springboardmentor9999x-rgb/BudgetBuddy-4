def test_notification_read_is_owner_scoped(client, headers_a, headers_b):
    created = client.post("/goals/", headers=headers_a, json={"goal_name": "Travel", "target_amount": 1000})
    assert created.status_code == 201
    notification = client.get("/notifications/", headers=headers_a).json()[0]

    assert client.patch(f"/notifications/{notification['id']}/read", headers=headers_b).status_code == 404
    marked = client.patch(f"/notifications/{notification['id']}/read", headers=headers_a)
    assert marked.status_code == 200
    assert marked.json()["is_read"] is True


def test_monthly_report_notification_is_not_duplicated(client, headers_a):
    first = client.post("/notifications/generate-monthly-report", headers=headers_a)
    second = client.post("/notifications/generate-monthly-report", headers=headers_a)
    assert first.status_code == second.status_code == 200
    assert first.json()["id"] == second.json()["id"]


def test_goal_contribution_does_not_create_negative_income(client, headers_a):
    goal = client.post("/goals/", headers=headers_a, json={"goal_name": "Reserve", "target_amount": 1000}).json()
    assert client.patch(f"/goals/{goal['id']}/contribute", headers=headers_a, json={"amount": 100}).status_code == 200
    assert client.get("/income/", headers=headers_a).json() == []
