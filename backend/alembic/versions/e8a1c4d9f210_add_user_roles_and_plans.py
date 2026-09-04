"""add user roles and membership plans

Revision ID: e8a1c4d9f210
Revises: d3f9b1c6a7e2
"""
from alembic import op
import sqlalchemy as sa

revision = "e8a1c4d9f210"
down_revision = "d3f9b1c6a7e2"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("role", sa.String(length=20), server_default="user", nullable=False))
    op.add_column("users", sa.Column("plan", sa.String(length=20), server_default="free", nullable=False))


def downgrade():
    op.drop_column("users", "plan")
    op.drop_column("users", "role")
