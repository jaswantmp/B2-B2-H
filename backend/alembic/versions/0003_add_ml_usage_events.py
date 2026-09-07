"""add_ml_usage_events

Revision ID: 0003_add_ml_usage_events
Revises: 0002_add_admin_to_users
Create Date: 2026-09-07 15:50:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '0003_add_ml_usage_events'
down_revision: Union[str, Sequence[str], None] = '0002_add_admin_to_users'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'ml_usage_events',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('feature', sa.String(length=100), nullable=False),
        sa.Column('model_version', sa.String(length=100), nullable=True),
        sa.Column('success', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('response_time_ms', sa.Integer(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_ml_usage_events_created_at'), 'ml_usage_events', ['created_at'], unique=False)
    op.create_index(op.f('ix_ml_usage_events_feature'), 'ml_usage_events', ['feature'], unique=False)
    op.create_index(op.f('ix_ml_usage_events_user_id'), 'ml_usage_events', ['user_id'], unique=False)
    op.create_index('ix_ml_usage_events_feature_created_at', 'ml_usage_events', ['feature', 'created_at'], unique=False)


def downgrade() -> None:
    op.drop_index('ix_ml_usage_events_feature_created_at', table_name='ml_usage_events')
    op.drop_index(op.f('ix_ml_usage_events_user_id'), table_name='ml_usage_events')
    op.drop_index(op.f('ix_ml_usage_events_feature'), table_name='ml_usage_events')
    op.drop_index(op.f('ix_ml_usage_events_created_at'), table_name='ml_usage_events')
    op.drop_table('ml_usage_events')
