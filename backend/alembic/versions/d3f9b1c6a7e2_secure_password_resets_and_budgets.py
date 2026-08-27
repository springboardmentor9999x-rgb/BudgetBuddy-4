"""secure password resets and prevent duplicate monthly budgets

Revision ID: d3f9b1c6a7e2
Revises: c5f1b9d3e8aa
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d3f9b1c6a7e2"
down_revision: Union[str, Sequence[str], None] = "c5f1b9d3e8aa"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "password_resets",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("verification_token", sa.String(), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index(op.f("ix_password_resets_id"), "password_resets", ["id"], unique=False)
    op.create_index(op.f("ix_password_resets_email"), "password_resets", ["email"], unique=False)
    op.create_unique_constraint("uq_budget_user_category_month", "budgets", ["user_id", "category", "month"])


def downgrade() -> None:
    op.drop_constraint("uq_budget_user_category_month", "budgets", type_="unique")
    op.drop_index(op.f("ix_password_resets_email"), table_name="password_resets")
    op.drop_index(op.f("ix_password_resets_id"), table_name="password_resets")
    op.drop_table("password_resets")
