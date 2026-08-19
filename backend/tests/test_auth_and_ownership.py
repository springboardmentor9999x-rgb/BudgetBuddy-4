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


def test_expense_ownership_and_amount_validation(client, headers_a, headers_b):
    invalid = client.post("/expenses/", headers=headers_a, json={"category": "Shopping", "amount": 0, "bank_account": "Test Bank 1234"})
    assert invalid.status_code == 422

    created = client.post("/expenses/", headers=headers_a, json={"category": "Shopping", "amount": 500, "description": "Shoes", "bank_account": "Test Bank 1234"})
    assert created.status_code == 200
    expense_id = created.json()["id"]

    assert client.get(f"/expenses/{expense_id}", headers=headers_b).status_code == 404
    assert client.put(f"/expenses/{expense_id}", headers=headers_b, json={"amount": 1}).status_code == 404
    assert client.delete(f"/expenses/{expense_id}", headers=headers_b).status_code == 404
    assert len(client.get("/expenses/", headers=headers_a).json()) == 1
