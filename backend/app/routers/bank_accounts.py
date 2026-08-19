from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User

from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountOut,
)

from app.crud.bank_account import (
    create_bank_account,
    get_bank_accounts_by_user,
    get_bank_account,
    get_current_balance,
    update_bank_account,
    delete_bank_account,
)


router = APIRouter()


# -------------------------
# Create Bank Account
# -------------------------
@router.post(
    "/",
    response_model=BankAccountOut,
)
def add_bank_account(
    bank_in: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bank_account = create_bank_account(
        db,
        current_user.id,
        bank_in,
    )

    bank_account.current_balance = (
        get_current_balance(
            db,
            bank_account,
        )
    )

    return bank_account


# -------------------------
# Get All Bank Accounts
# -------------------------
@router.get(
    "/",
    response_model=list[BankAccountOut],
)
def list_bank_accounts(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    accounts = get_bank_accounts_by_user(
        db,
        current_user.id,
        skip,
        limit,
    )

    for account in accounts:
        account.current_balance = (
            get_current_balance(
                db,
                account,
            )
        )

    return accounts


# -------------------------
# Get Single Bank Account
# -------------------------
@router.get(
    "/{bank_account_id}",
    response_model=BankAccountOut,
)
def get_single_bank_account(
    bank_account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bank_account = get_bank_account(
        db,
        bank_account_id,
        current_user.id,
    )

    if not bank_account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found.",
        )

    bank_account.current_balance = (
        get_current_balance(
            db,
            bank_account,
        )
    )

    return bank_account


# -------------------------
# Update Bank Account
# -------------------------
@router.put(
    "/{bank_account_id}",
    response_model=BankAccountOut,
)
def edit_bank_account(
    bank_account_id: int,
    bank_in: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bank_account = get_bank_account(
        db,
        bank_account_id,
        current_user.id,
    )

    if not bank_account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found.",
        )

    bank_account = update_bank_account(
        db,
        bank_account,
        bank_in,
    )

    bank_account.current_balance = (
        get_current_balance(
            db,
            bank_account,
        )
    )

    return bank_account


# -------------------------
# Delete Bank Account
# -------------------------
@router.delete(
    "/{bank_account_id}",
)
def remove_bank_account(
    bank_account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    bank_account = get_bank_account(
        db,
        bank_account_id,
        current_user.id,
    )

    if not bank_account:
        raise HTTPException(
            status_code=404,
            detail="Bank account not found.",
        )

    delete_bank_account(
        db,
        bank_account,
    )

    return {
        "message": "Bank account deleted successfully."
    }