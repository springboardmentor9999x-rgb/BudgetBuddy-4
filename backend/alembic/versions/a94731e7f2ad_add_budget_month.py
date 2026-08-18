"""add budget month

Revision ID: a94731e7f2ad
Revises: 25648be9d7b6
Create Date: 2026-08-11 00:00:00.000000
"""
from datetime import datetime
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "a94731e7f2ad"
down_revision: Union[str, Sequence[str], None] = "25648be9d7b6"
branch_labels = None
depends_on = None


def upgrade() -> None:
    current_month = datetime.utcnow().strftime("%Y-%m")
    op.add_column("budgets", sa.Column("month", sa.String(length=7), nullable=True))
    op.execute(sa.text("UPDATE budgets SET month = :month WHERE month IS NULL").bindparams(month=current_month))
    op.alter_column("budgets", "month", existing_type=sa.String(length=7), nullable=False)


def downgrade() -> None:
    op.drop_column("budgets", "month")
