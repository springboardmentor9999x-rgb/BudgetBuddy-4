"""add goal and notification details

Revision ID: c5f1b9d3e8aa
Revises: a94731e7f2ad
Create Date: 2026-08-11 00:00:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c5f1b9d3e8aa"
down_revision: Union[str, Sequence[str], None] = "a94731e7f2ad"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("saving_goals", sa.Column("target_date", sa.Date(), nullable=True))
    op.add_column("saving_goals", sa.Column("status", sa.String(length=20), nullable=True))
    op.execute("UPDATE saving_goals SET status = 'in_progress' WHERE status IS NULL")
    op.alter_column("saving_goals", "status", existing_type=sa.String(length=20), nullable=False)
    op.add_column("saving_goals", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False))
    op.add_column("notifications", sa.Column("type", sa.String(length=40), nullable=True))
    op.execute("UPDATE notifications SET type = 'general' WHERE type IS NULL")
    op.alter_column("notifications", "type", existing_type=sa.String(length=40), nullable=False)
    op.add_column("notifications", sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False))


def downgrade() -> None:
    op.drop_column("notifications", "created_at")
    op.drop_column("notifications", "type")
    op.drop_column("saving_goals", "created_at")
    op.drop_column("saving_goals", "status")
    op.drop_column("saving_goals", "target_date")
