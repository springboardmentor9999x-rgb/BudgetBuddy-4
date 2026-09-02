def _income(amount=1200, source="Freelance"):
    return {"source": source, "amount": amount, "description": "Project payment", "bank_account": "Test Bank 1234"}


def test_income_crud_summary_and_ownership(client, headers_a, headers_b):
    created = client.post("/income/", headers=headers_a, json=_income())
    assert created.status_code == 200
    income_id = created.json()["id"]

    assert client.get(f"/income/{income_id}", headers=headers_b).status_code == 404
    assert client.put(f"/income/{income_id}", headers=headers_b, json={"amount": 1}).status_code == 404
    assert client.delete(f"/income/{income_id}", headers=headers_b).status_code == 404
    assert client.get("/income/summary", headers=headers_b).json() == []

    assert client.put(f"/income/{income_id}", headers=headers_a, json={"amount": 1500}).status_code == 200
    assert client.get("/income/summary", headers=headers_a).json() == [{"source": "Freelance", "amount": 1500.0}]
    assert client.delete(f"/income/{income_id}", headers=headers_a).status_code == 200
    assert client.get("/income/", headers=headers_a).json() == []


def test_income_rejects_non_positive_amount(client, headers_a):
    assert client.post("/income/", headers=headers_a, json=_income(0)).status_code == 422
    assert client.post("/income/", headers=headers_a, json=_income(-1)).status_code == 422


def test_legacy_negative_income_does_not_break_income_list(client, headers_a, user_a):
    from app.database import SessionLocal
    from app.models.income import Income

    db = SessionLocal()
    try:
        db.add(Income(user_id=user_a.id, source="Savings contribution — legacy", amount=-100, description="Old transfer"))
        db.commit()
    finally:
        db.close()

    created = client.post("/income/", headers=headers_a, json=_income(500, "Salary"))
    assert created.status_code == 200
    records = client.get("/income/", headers=headers_a)
    assert records.status_code == 200
    assert [item["source"] for item in records.json()] == ["Salary"]
