from datetime import datetime

from pydantic import BaseModel, field_validator


class BankAccountCreate(BaseModel):
    bank_name: str
    account_holder_name: str
    account_number: str
    ifsc_code: str | None = None
    account_type: str = "Savings"
    opening_balance: float = 0.0

    @field_validator("bank_name", "account_holder_name")
    @classmethod
    def text_not_blank(cls, v: str) -> str:
        value = v.strip()

        if not value:
            raise ValueError("This field cannot be blank.")

        return value

    @field_validator("account_number")
    @classmethod
    def account_number_not_blank(cls, v: str) -> str:
        value = v.strip()

        if len(value) < 4:
            raise ValueError(
                "Account number must be at least 4 characters."
            )

        return value

    @field_validator("opening_balance")
    @classmethod
    def opening_balance_not_negative(cls, v: float) -> float:
        if v < 0:
            raise ValueError(
                "Opening balance cannot be negative."
            )

        return v


class BankAccountUpdate(BaseModel):
    bank_name: str | None = None
    account_holder_name: str | None = None
    ifsc_code: str | None = None
    account_type: str | None = None
    status: str | None = None


class BankAccountResponse(BaseModel):
    id: int
    bank_name: str
    account_holder_name: str | None
    masked_account_number: str
    ifsc_code: str | None
    account_type: str
    opening_balance: float
    balance: float
    status: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True

    @staticmethod
    def from_model(account) -> "BankAccountResponse":
        raw = account.account_number or ""

        masked = (
            f"XXXX XXXX {raw[-4:]}"
            if len(raw) >= 4
            else "XXXX XXXX XXXX"
        )

        return BankAccountResponse(
            id=account.id,
            bank_name=account.bank_name,
            account_holder_name=account.account_holder_name,
            masked_account_number=masked,
            ifsc_code=account.ifsc_code,
            account_type=account.account_type,
            opening_balance=account.opening_balance,
            balance=account.balance,
            status=account.status,
            created_at=account.created_at,
        )