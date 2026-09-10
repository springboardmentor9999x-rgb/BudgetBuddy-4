from sqlalchemy.orm import Session

from app.models.bank_account import BankAccount
from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountUpdate
)


def create_bank_account(
    db: Session,
    user_id: int,
    payload: BankAccountCreate
) -> BankAccount:

    account_number = payload.account_number.strip()

    # Account number must be unique for this user,
    # regardless of bank name.
    existing_account = (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id,
            BankAccount.account_number == account_number
        )
        .first()
    )

    if existing_account:
        raise ValueError(
            "This account number is already registered. "
            "The same account number cannot be added again."
        )

    account = BankAccount(
        user_id=user_id,
        bank_name=payload.bank_name,
        account_holder_name=payload.account_holder_name,
        account_number=account_number,
        ifsc_code=payload.ifsc_code,
        account_type=payload.account_type,
        opening_balance=payload.opening_balance,
        balance=payload.opening_balance,
        status="active",
    )

    db.add(account)
    db.commit()
    db.refresh(account)

    return account


def get_bank_accounts(
    db: Session,
    user_id: int
) -> list[BankAccount]:

    return (
        db.query(BankAccount)
        .filter(
            BankAccount.user_id == user_id
        )
        .all()
    )


def get_bank_account(
    db: Session,
    account_id: int,
    user_id: int
) -> BankAccount | None:

    return (
        db.query(BankAccount)
        .filter(
            BankAccount.id == account_id,
            BankAccount.user_id == user_id
        )
        .first()
    )


def update_bank_account(
    db: Session,
    account: BankAccount,
    payload: BankAccountUpdate
) -> BankAccount:

    if payload.bank_name is not None:
        account.bank_name = payload.bank_name.strip()

    if payload.account_holder_name is not None:
        account.account_holder_name = (
            payload.account_holder_name.strip()
        )

    if payload.ifsc_code is not None:
        account.ifsc_code = payload.ifsc_code.strip()

    if payload.account_type is not None:
        account.account_type = payload.account_type

    if payload.status is not None:
        account.status = payload.status

    db.commit()
    db.refresh(account)

    return account


def delete_bank_account(
    db: Session,
    account: BankAccount
) -> None:

    # Keep historical transactions.
    # Only remove their bank-account reference.

    from app.models.income import Income
    from app.models.expense import Expense

    db.query(Income).filter(
        Income.bank_account_id == account.id
    ).update(
        {"bank_account_id": None}
    )

    db.query(Expense).filter(
        Expense.bank_account_id == account.id
    ).update(
        {"bank_account_id": None}
    )

    db.delete(account)
    db.commit()


def adjust_balance(
    db: Session,
    account_id: int | None,
    user_id: int,
    delta: float
) -> None:

    if account_id is None:
        return

    account = get_bank_account(
        db,
        account_id,
        user_id
    )

    if account is None:
        return

    account.balance += delta

    db.commit()