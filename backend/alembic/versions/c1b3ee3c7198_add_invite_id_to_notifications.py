"""add_invite_id_to_notifications

Revision ID: c1b3ee3c7198
Revises: 
Create Date: 2026-07-11 20:32:21.271263

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


from sqlalchemy.dialects.postgresql import UUID


# revision identifiers, used by Alembic.
revision: str = 'c1b3ee3c7198'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column('notifications', sa.Column('invite_id', UUID(as_uuid=False), nullable=True))
    op.create_foreign_key(
        'fk_notifications_invite_id_team_invites',
        'notifications',
        'team_invites',
        ['invite_id'],
        ['id'],
        ondelete='SET NULL'
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_constraint('fk_notifications_invite_id_team_invites', 'notifications', type_='foreignkey')
    op.drop_column('notifications', 'invite_id')
