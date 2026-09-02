"""Shared isolated SQLite test database for BudgetBuddy API tests."""
import os
import tempfile

test_db_file = tempfile.NamedTemporaryFile(prefix="budgetbuddy-tests-", suffix=".db", delete=False)
test_db_file.close()
os.environ["DATABASE_URL"] = f"sqlite:///{test_db_file.name.replace(os.sep, '/')}"
os.environ["SECRET_KEY"] = "budgetbuddy-test-secret-not-for-production"

import pytest
from fastapi.testclient import TestClient

from app.core.security import hash_password
from app.database import Base, SessionLocal, engine, get_db
from app.main import app
from app.models.user import User


def pytest_sessionfinish(session, exitstatus):
    engine.dispose()
    if os.path.exists(test_db_file.name):
        os.remove(test_db_file.name)


def override_get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(autouse=True)
def clean_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def client():
    with TestClient(app) as test_client:
        yield test_client


def make_user(email: str, full_name: str = "Test User") -> User:
    db = SessionLocal()
    try:
        user = User(full_name=full_name, email=email, password=hash_password("CorrectPassword1"), is_verified=True)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    finally:
        db.close()


@pytest.fixture
def user_a():
    return make_user("user-a@example.com", "User A")


@pytest.fixture
def user_b():
    return make_user("user-b@example.com", "User B")


def login_headers(client: TestClient, email: str) -> dict[str, str]:
    response = client.post("/auth/login", json={"email": email, "password": "CorrectPassword1"})
    assert response.status_code == 200
    return {"Authorization": f"Bearer {response.json()['access_token']}"}


@pytest.fixture
def headers_a(client, user_a):
    return login_headers(client, user_a.email)


@pytest.fixture
def headers_b(client, user_b):
    return login_headers(client, user_b.email)
