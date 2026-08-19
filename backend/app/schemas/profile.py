from typing import Optional

from pydantic import BaseModel, ConfigDict, Field


# -------------------------
# Profile Update
# -------------------------
class ProfileUpdate(BaseModel):

    full_name: str = Field(
        ...,
        min_length=2,
        max_length=100,
    )

    monthly_income: float = Field(
        default=0.0,
        ge=0,
    )

    currency: str = Field(
        default="INR",
        min_length=3,
        max_length=3,
    )


# -------------------------
# Profile Response
# -------------------------
class ProfileOut(BaseModel):

    id: int

    user_id: int

    full_name: str

    monthly_income: float

    currency: str

    # Profile picture
    profile_image: Optional[str] = None

    model_config = ConfigDict(
        from_attributes=True
    )