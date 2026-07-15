"""add_onboarding_completed_to_users

Revision ID: a3b8c4d2e1f5
Revises: f2a74c8397a1
Create Date: 2026-07-14 21:08:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'a3b8c4d2e1f5'
down_revision: Union[str, Sequence[str], None] = 'f2a74c8397a1'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('users', sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='false'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('users', 'onboarding_completed')
