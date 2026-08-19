import os
import uuid

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    UploadFile,
    File,
)
from sqlalchemy.orm import Session

from app.database import get_db
from app.core.deps import get_current_user

from app.models.user import User

from app.schemas.profile import (
    ProfileUpdate,
    ProfileOut,
)

from app.crud.profile import (
    get_profile,
    update_profile,
    update_profile_image,
)


router = APIRouter(
    prefix="/profile",
    tags=["Profile"],
)


# =========================================================
# Get Current User Profile
# =========================================================

@router.get(
    "/",
    response_model=ProfileOut,
)
def get_my_profile(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_profile(
        db,
        current_user.id,
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found.",
        )

    return profile


# =========================================================
# Update Current User Profile
# =========================================================

@router.put(
    "/",
    response_model=ProfileOut,
)
def update_my_profile(
    profile_in: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = get_profile(
        db,
        current_user.id,
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found.",
        )

    return update_profile(
        db,
        profile,
        profile_in,
    )


# =========================================================
# Upload Profile Image
# =========================================================

@router.post(
    "/upload-image",
    response_model=ProfileOut,
)
async def upload_profile_image(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # -----------------------------------------------------
    # Get Profile
    # -----------------------------------------------------

    profile = get_profile(
        db,
        current_user.id,
    )

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Profile not found.",
        )


    # -----------------------------------------------------
    # Validate File Type
    # -----------------------------------------------------

    allowed_types = {
        "image/jpeg",
        "image/png",
        "image/webp",
    }

    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=(
                "Only JPG, PNG, and WEBP "
                "images are allowed."
            ),
        )


    # -----------------------------------------------------
    # Read File
    # -----------------------------------------------------

    contents = await file.read()


    # -----------------------------------------------------
    # Validate File Size
    # Maximum: 5 MB
    # -----------------------------------------------------

    max_size = 5 * 1024 * 1024

    if len(contents) > max_size:
        raise HTTPException(
            status_code=400,
            detail="Profile image must be smaller than 5 MB.",
        )


    # -----------------------------------------------------
    # Create Upload Directory
    # -----------------------------------------------------

    upload_directory = os.path.join(
        "uploads",
        "profile_images",
    )

    os.makedirs(
        upload_directory,
        exist_ok=True,
    )


    # -----------------------------------------------------
    # Generate Unique Filename
    # -----------------------------------------------------

    extension = ".jpg"

    if file.content_type == "image/png":
        extension = ".png"

    elif file.content_type == "image/webp":
        extension = ".webp"


    filename = (
        f"user_{current_user.id}_"
        f"{uuid.uuid4().hex}"
        f"{extension}"
    )


    file_path = os.path.join(
        upload_directory,
        filename,
    )


    # -----------------------------------------------------
    # Save Image
    # -----------------------------------------------------

    with open(
        file_path,
        "wb",
    ) as image_file:

        image_file.write(contents)


    # -----------------------------------------------------
    # Save Path in Database
    # -----------------------------------------------------

    image_url = (
        f"/uploads/profile_images/{filename}"
    )

    update_profile_image(
        db,
        profile,
        image_url,
    )


    return profile