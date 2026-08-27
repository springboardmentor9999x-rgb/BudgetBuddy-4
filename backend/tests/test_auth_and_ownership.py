def test_signup_verification_and_login_flow(client, monkeypatch):
    verification = {}

    def capture_code(email, code):
        verification["email"] = email
        verification["code"] = code

    monkeypatch.setattr("app.routers.auth.send_verification_email", capture_code)
    signup = client.post(
        "/auth/signup",
        json={"email": "new-user@example.com", "password": "CorrectPassword1", "full_name": "New User"},
    )
    assert signup.status_code == 200
    assert verification["email"] == "new-user@example.com"

    verified = client.post(
        "/auth/verify-email",
        json={"email": verification["email"], "code": verification["code"]},
    )
    assert verified.status_code == 200

    login = client.post(
        "/auth/login",
        json={"email": "new-user@example.com", "password": "CorrectPassword1"},
    )
    assert login.status_code == 200
    assert login.json()["token_type"] == "bearer"


def test_login_and_authenticated_identity(client, user_a):
    login = client.post("/auth/login", json={"email": user_a.email, "password": "CorrectPassword1"})
    assert login.status_code == 200
    assert login.json()["access_token"]

    me = client.get("/auth/me", headers={"Authorization": f"Bearer {login.json()['access_token']}"})
    assert me.status_code == 200
    assert me.json()["email"] == user_a.email
    assert me.json()["is_verified"] is True


def test_password_reset_requires_a_short_lived_email_code(client, user_a, monkeypatch):
    reset = {}

    def capture_code(email, code):
        reset["email"] = email
        reset["code"] = code

    monkeypatch.setattr("app.routers.auth.send_password_reset_email", capture_code)
    requested = client.post("/auth/forgot-password", json={"email": user_a.email})
    assert requested.status_code == 200
    assert reset["email"] == user_a.email

    rejected = client.post("/auth/reset-password", json={
        "email": user_a.email, "code": "AAAAAA", "new_password": "NewPassword1",
    })
    assert rejected.status_code == 400

    completed = client.post("/auth/reset-password", json={
        "email": user_a.email, "code": reset["code"], "new_password": "NewPassword1",
    })
    assert completed.status_code == 200
    assert client.post("/auth/login", json={"email": user_a.email, "password": "NewPassword1"}).status_code == 200


def test_update_rejects_null_and_blank_required_fields(client, headers_a):
    expense = client.post("/expenses/", headers=headers_a, json={
        "category": "Food", "amount": 10, "description": "Lunch", "bank_account": "Test Bank 1234",
    }).json()
    assert client.put(f"/expenses/{expense['id']}", headers=headers_a, json={"category": None}).status_code == 422
    assert client.put(f"/expenses/{expense['id']}", headers=headers_a, json={"category": "   "}).status_code == 422


def test_monthly_budget_is_unique_per_user_category_and_month(client, headers_a):
    payload = {"category": "Food", "amount": 500, "month": "2026-08"}
    assert client.post("/budgets/", headers=headers_a, json=payload).status_code == 201
    duplicate = client.post("/budgets/", headers=headers_a, json=payload)
    assert duplicate.status_code == 409


def test_expense_ownership_and_amount_validation(client, headers_a, headers_b):
    invalid = client.post("/expenses/", headers=headers_a, json={"category": "Shopping", "amount": 0, "bank_account": "Test Bank 1234"})
    assert invalid.status_code == 422

    missing_note = client.post("/expenses/", headers=headers_a, json={"category": "Shopping", "amount": 500, "bank_account": "Test Bank 1234"})
    assert missing_note.status_code == 422

    created = client.post("/expenses/", headers=headers_a, json={"category": "Shopping", "amount": 500, "description": "Shoes", "bank_account": "Test Bank 1234"})
    assert created.status_code == 200
    expense_id = created.json()["id"]

    assert client.get(f"/expenses/{expense_id}", headers=headers_b).status_code == 404
    assert client.put(f"/expenses/{expense_id}", headers=headers_b, json={"amount": 1}).status_code == 404
    assert client.delete(f"/expenses/{expense_id}", headers=headers_b).status_code == 404
    assert len(client.get("/expenses/", headers=headers_a).json()) == 1
