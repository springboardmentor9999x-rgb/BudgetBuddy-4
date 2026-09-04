from typing import Literal

from pydantic import BaseModel


class UserAccessUpdate(BaseModel):
    role: Literal["user", "admin"] | None = None
    is_active: bool | None = None


class PaymentVerify(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
