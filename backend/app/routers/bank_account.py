from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import get_db

from app.core.deps import (
    get_current_active_user
)

from app.models.user import User

from app.schemas.bank_account import (
    BankAccountCreate,
    BankAccountUpdate,
    BankAccountResponse
)

from app.crud.bank_account import (
    create_bank_account,
    get_bank_accounts,
    get_bank_account,
    update_bank_account,
    delete_bank_account,
)

from app.crud.activity_log import log_activity

from app.crud.notification import (
    create_notification_for_user_if_enabled
)


router = APIRouter(
    prefix="/bank-account",
    tags=["Bank Account"]
)


@router.post(
    "/",
    response_model=BankAccountResponse
)
def add_bank_account(
    payload: BankAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    try:

        account = create_bank_account(
            db,
            current_user.id,
            payload
        )

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    log_activity(
        db,
        current_user.id,
        "bank_account_added",
        detail=account.bank_name
    )

    create_notification_for_user_if_enabled(
        db,
        current_user,
        title="Bank account added",
        message=(
            f"{account.bank_name} was added successfully."
        ),
        category="bank",
    )

    return BankAccountResponse.from_model(account)


@router.get(
    "/",
    response_model=list[BankAccountResponse]
)
def list_bank_accounts(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    accounts = get_bank_accounts(
        db,
        current_user.id
    )

    return [
        BankAccountResponse.from_model(account)
        for account in accounts
    ]


@router.get(
    "/{account_id}",
    response_model=BankAccountResponse
)
def read_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    account = get_bank_account(
        db,
        account_id,
        current_user.id
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    return BankAccountResponse.from_model(account)


@router.put(
    "/{account_id}",
    response_model=BankAccountResponse
)
def edit_bank_account(
    account_id: int,
    payload: BankAccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    account = get_bank_account(
        db,
        account_id,
        current_user.id
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    account = update_bank_account(
        db,
        account,
        payload
    )

    log_activity(
        db,
        current_user.id,
        "bank_account_updated",
        detail=account.bank_name
    )

    return BankAccountResponse.from_model(account)


@router.delete("/{account_id}")
def remove_bank_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_active_user
    ),
):

    account = get_bank_account(
        db,
        account_id,
        current_user.id
    )

    if not account:

        raise HTTPException(
            status_code=404,
            detail="Bank account not found"
        )

    bank_name = account.bank_name

    delete_bank_account(
        db,
        account
    )

    log_activity(
        db,
        current_user.id,
        "bank_account_deleted",
        detail=bank_name
    )

    return {
        "message": (
            "Bank account deleted. "
            "Linked transactions were preserved."
        )
    }