import hashlib
import hmac


def test_payment_optional_upgrade_unlocks_premium(client, headers_a, monkeypatch):
    monkeypatch.setenv("PREMIUM_PAYMENT_REQUIRED", "false")
    response = client.post("/membership/upgrade", headers=headers_a)
    assert response.status_code == 200
    identity = client.get("/auth/me", headers=headers_a).json()
    assert identity["role"] == "premium"
    assert identity["plan"] == "premium"
    assert client.get("/premium/insights", headers=headers_a).status_code == 200


def test_optional_upgrade_is_blocked_when_payment_is_required(client, headers_a, monkeypatch):
    monkeypatch.setenv("PREMIUM_PAYMENT_REQUIRED", "true")
    assert client.post("/membership/upgrade", headers=headers_a).status_code == 402


def test_free_user_cannot_access_premium_api(client, headers_a):
    assert client.get("/premium/insights", headers=headers_a).status_code == 403


def test_verified_payment_unlocks_premium(client, headers_a, monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "test-secret")
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_example")
    monkeypatch.setattr("app.routers.membership.create_order", lambda amount, receipt: ("rzp_test_example", {"id": "order_test", "amount": amount}))
    monkeypatch.setattr("app.routers.membership.fetch_payment", lambda payment_id: {"id": payment_id, "order_id": "order_test", "amount": 29900, "status": "captured"})
    assert client.post("/membership/orders", headers=headers_a).status_code == 200
    payment_id = "pay_test"
    signature = hmac.new(b"test-secret", f"order_test|{payment_id}".encode(), hashlib.sha256).hexdigest()
    response = client.post("/membership/verify", headers=headers_a, json={"razorpay_order_id": "order_test", "razorpay_payment_id": payment_id, "razorpay_signature": signature})
    assert response.status_code == 200
    identity = client.get("/auth/me", headers=headers_a).json()
    assert identity["role"] == "premium"
    assert identity["plan"] == "premium"
    assert client.get("/membership/me", headers=headers_a).json()["is_premium"] is True
    assert client.get("/premium/insights", headers=headers_a).status_code == 200


def test_invalid_signature_does_not_unlock_premium(client, headers_a, monkeypatch):
    monkeypatch.setenv("RAZORPAY_KEY_SECRET", "test-secret")
    monkeypatch.setenv("RAZORPAY_KEY_ID", "rzp_test_example")
    monkeypatch.setattr("app.routers.membership.create_order", lambda amount, receipt: ("rzp_test_example", {"id": "order_bad", "amount": amount}))
    client.post("/membership/orders", headers=headers_a)
    response = client.post("/membership/verify", headers=headers_a, json={"razorpay_order_id": "order_bad", "razorpay_payment_id": "pay_bad", "razorpay_signature": "invalid"})
    assert response.status_code == 400
    assert client.get("/membership/me", headers=headers_a).json()["is_premium"] is False


def test_regular_user_cannot_access_admin(client, headers_a):
    assert client.get("/admin/users", headers=headers_a).status_code == 403


def test_admin_can_deactivate_user(client, headers_a, user_a, user_b):
    from app.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    db.query(User).filter(User.id == user_a.id).update({"role": "admin"})
    db.commit()
    db.close()
    response = client.patch(f"/admin/users/{user_b.id}", json={"is_active": False}, headers=headers_a)
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_can_read_user_summary_and_activity(client, headers_a, user_a, user_b):
    from app.database import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    db.query(User).filter(User.id == user_a.id).update({"role": "admin"})
    db.commit()
    db.close()
    summary = client.get(f"/admin/users/{user_b.id}/financial-summary", headers=headers_a)
    assert summary.status_code == 200
    assert summary.json()["balance"] == 0
    assert client.get("/admin/activity", headers=headers_a).status_code == 200
