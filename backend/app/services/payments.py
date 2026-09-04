import hashlib
import hmac
import os

import httpx
from fastapi import HTTPException

API_URL = "https://api.razorpay.com/v1"


def credentials():
    key_id = os.getenv("RAZORPAY_KEY_ID", "").strip()
    key_secret = os.getenv("RAZORPAY_KEY_SECRET", "").strip()
    if not key_id or not key_secret:
        raise HTTPException(status_code=503, detail="Razorpay test credentials are not configured")
    return key_id, key_secret


def create_order(amount_paise: int, receipt: str):
    key_id, key_secret = credentials()
    try:
        response = httpx.post(f"{API_URL}/orders", auth=(key_id, key_secret), json={"amount": amount_paise, "currency": "INR", "receipt": receipt, "notes": {"plan": "premium_monthly"}}, timeout=15)
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Payment provider could not create the order") from error
    return key_id, response.json()


def verify_signature(order_id: str, payment_id: str, signature: str):
    _, secret = credentials()
    expected = hmac.new(secret.encode(), f"{order_id}|{payment_id}".encode(), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature)


def fetch_payment(payment_id: str):
    key_id, key_secret = credentials()
    try:
        response = httpx.get(f"{API_URL}/payments/{payment_id}", auth=(key_id, key_secret), timeout=15)
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(status_code=502, detail="Payment provider could not verify payment status") from error
    return response.json()
