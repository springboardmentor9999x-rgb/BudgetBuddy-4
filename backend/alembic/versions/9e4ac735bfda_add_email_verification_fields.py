"""add email verification fields

Revision ID: 9e4ac735bfda
Revises: b405670bec32
Create Date: 2026-07-31 19:21:04.950613
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9e4ac735bfda"
down_revision: Union[str, Sequence[str], None] = "b405670bec32"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""

    op.add_column(
        "users",
        sa.Column(
            "is_email_verified",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false()
        )
    )

    op.add_column(
        "users",
        sa.Column(
            "verification_code",
            sa.String(length=6),
            nullable=True
        )
    )

    op.add_column(
        "users",
        sa.Column(
            "verification_code_expires_at",
            sa.DateTime(),
            nullable=True
        )
    )


def downgrade() -> None:
    """Downgrade schema."""

    op.drop_column(
        "users",
        "verification_code_expires_at"
    )

    op.drop_column(
        "users",
        "verification_code"
    )

    op.drop_column(
        "users",
        "is_email_verified"
    )