"""add subscriptions and payments

Revision ID: f2b7d91e4a30
Revises: e8a1c4d9f210
"""
from alembic import op
import sqlalchemy as sa

revision = "f2b7d91e4a30"
down_revision = "e8a1c4d9f210"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("is_active", sa.Boolean(), server_default=sa.true(), nullable=False))
    op.create_table("subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("plan", sa.String(30), nullable=False, server_default="premium_monthly"), sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("starts_at", sa.DateTime(timezone=True)), sa.Column("expires_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"))
    op.create_index("ix_subscriptions_user_id", "subscriptions", ["user_id"])
    op.create_index("ix_subscriptions_status", "subscriptions", ["status"])
    op.create_index("ix_subscriptions_expires_at", "subscriptions", ["expires_at"])
    op.create_table("payments",
        sa.Column("id", sa.Integer(), primary_key=True), sa.Column("user_id", sa.Integer(), nullable=False), sa.Column("subscription_id", sa.Integer()),
        sa.Column("provider", sa.String(30), nullable=False, server_default="razorpay"), sa.Column("provider_order_id", sa.String(100), nullable=False), sa.Column("provider_payment_id", sa.String(100)),
        sa.Column("amount", sa.Float(), nullable=False), sa.Column("currency", sa.String(3), nullable=False, server_default="INR"), sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("paid_at", sa.DateTime(timezone=True)), sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False), sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"), sa.ForeignKeyConstraint(["subscription_id"], ["subscriptions.id"], ondelete="SET NULL"),
        sa.UniqueConstraint("provider_order_id"), sa.UniqueConstraint("provider_payment_id"))
    op.create_index("ix_payments_user_id", "payments", ["user_id"])
    op.create_index("ix_payments_status", "payments", ["status"])
    op.create_index("ix_payments_provider_order_id", "payments", ["provider_order_id"])
    op.create_index("ix_payments_provider_payment_id", "payments", ["provider_payment_id"])


def downgrade():
    op.drop_table("payments")
    op.drop_table("subscriptions")
    op.drop_column("users", "is_active")
