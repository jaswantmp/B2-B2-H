"""add_max_members_to_teams

Revision ID: f2a74c8397a1
Revises: 4a04239898b2
Create Date: 2026-07-14 18:31:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f2a74c8397a1'
down_revision: Union[str, Sequence[str], None] = '4a04239898b2'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('teams', sa.Column('max_members', sa.Integer(), nullable=False, server_default='5'))


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('teams', 'max_members')
