from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# -------------------------
# Create Bank Account
# -------------------------
class BankAccountCreate(BaseModel):

    bank_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    account_number: str = Field(
        ...,
        min_length=4,
        max_length=30,
    )

    account_type: str = Field(
        default="Savings",
        min_length=2,
        max_length=30,
    )

    opening_balance: float = Field(
        default=0.0,
        ge=0,
    )


# -------------------------
# Update Bank Account
# -------------------------
class BankAccountUpdate(BaseModel):

    bank_name: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=100,
    )

    account_number: Optional[str] = Field(
        default=None,
        min_length=4,
        max_length=30,
    )

    account_type: Optional[str] = Field(
        default=None,
        min_length=2,
        max_length=30,
    )

    opening_balance: Optional[float] = Field(
        default=None,
        ge=0,
    )


# -------------------------
# Bank Account Response
# -------------------------
class BankAccountOut(BaseModel):

    id: int
    user_id: int
    bank_name: str
    account_number: str
    account_type: str
    opening_balance: float

    # Calculated balance
    current_balance: float = 0.0

    model_config = ConfigDict(
        from_attributes=True
    )