"""initial_schema

Revision ID: 0001_initial_schema
Revises: 
Create Date: 2026-07-22 21:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = '0001_initial_schema'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. users
    op.create_table(
        'users',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=120), nullable=False),
        sa.Column('username', sa.String(length=60), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('hashed_password', sa.String(length=255), nullable=False),
        sa.Column('bio', sa.Text(), nullable=True),
        sa.Column('avatar', sa.String(length=500), nullable=True),
        sa.Column('location', sa.String(length=200), nullable=True),
        sa.Column('university', sa.String(length=200), nullable=True),
        sa.Column('college', sa.String(length=200), nullable=True),
        sa.Column('district', sa.String(length=100), nullable=True),
        sa.Column('city', sa.String(length=100), nullable=True),
        sa.Column('state', sa.String(length=100), nullable=True),
        sa.Column('year', sa.String(length=30), nullable=True),
        sa.Column('branch', sa.String(length=120), nullable=True),
        sa.Column('github', sa.String(length=100), nullable=True),
        sa.Column('linkedin', sa.String(length=200), nullable=True),
        sa.Column('twitter', sa.String(length=200), nullable=True),
        sa.Column('website', sa.String(length=300), nullable=True),
        sa.Column('domains', sa.JSON(), nullable=True),
        sa.Column('status', sa.Enum('LOOKING_FOR_TEAM', 'OPEN_TO_INVITES', 'LOOKING_FOR_MEMBERS', 'IN_TEAM', 'OFFLINE', name='availabilitystatus'), nullable=False, server_default='LOOKING_FOR_TEAM'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('onboarding_completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('hackathons_won', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('profile_views', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_index(op.f('ix_users_username'), 'users', ['username'], unique=True)

    # 2. skills
    op.create_table(
        'skills',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('category', sa.String(length=60), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_skills_name'), 'skills', ['name'], unique=True)

    # 3. user_skills
    op.create_table(
        'user_skills',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('skill_id', sa.Integer(), nullable=False),
        sa.Column('is_verified', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('proficiency', sa.String(length=20), nullable=True),
        sa.ForeignKeyConstraint(['skill_id'], ['skills.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'skill_id', name='uq_user_skill')
    )
    op.create_index(op.f('ix_user_skills_user_id'), 'user_skills', ['user_id'], unique=False)

    # 4. github_profiles
    op.create_table(
        'github_profiles',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('username', sa.String(length=100), nullable=False),
        sa.Column('repos', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('commits', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('stars', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_github_profiles_user_id'), 'github_profiles', ['user_id'], unique=True)

    # 5. teams
    op.create_table(
        'teams',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('hackathon_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='recruiting'),
        sa.Column('max_members', sa.Integer(), nullable=False, server_default='5'),
        sa.Column('leader_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['leader_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_teams_leader_id'), 'teams', ['leader_id'], unique=False)

    # 6. team_members
    op.create_table(
        'team_members',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('team_id', 'user_id', name='uq_team_member')
    )
    op.create_index(op.f('ix_team_members_team_id'), 'team_members', ['team_id'], unique=False)
    op.create_index(op.f('ix_team_members_user_id'), 'team_members', ['user_id'], unique=False)

    # 7. team_invites
    op.create_table(
        'team_invites',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_team_invites_team_id'), 'team_invites', ['team_id'], unique=False)
    op.create_index(op.f('ix_team_invites_user_id'), 'team_invites', ['user_id'], unique=False)

    # 8. notifications
    op.create_table(
        'notifications',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('recipient_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('type', sa.Enum('invite', 'match', 'update', 'hackathon', 'system', 'invite_declined', name='notificationtype'), nullable=False),
        sa.Column('message', sa.String(length=500), nullable=False),
        sa.Column('action', sa.String(length=100), nullable=True),
        sa.Column('invite_id', postgresql.UUID(as_uuid=False), nullable=True),
        sa.Column('read', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['invite_id'], ['team_invites.id'], ondelete='SET NULL'),
        sa.ForeignKeyConstraint(['recipient_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_notifications_recipient_id'), 'notifications', ['recipient_id'], unique=False)

    # 9. projects
    op.create_table(
        'projects',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=False),
        sa.Column('category', sa.String(length=50), nullable=False),
        sa.Column('university', sa.String(length=200), nullable=True),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='recruiting'),
        sa.Column('deadline', sa.DateTime(), nullable=True),
        sa.Column('tech', sa.JSON(), nullable=False),
        sa.Column('open_roles', sa.JSON(), nullable=False),
        sa.Column('creator_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['creator_id'], ['users.id'], ondelete='RESTRICT'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_projects_creator_id'), 'projects', ['creator_id'], unique=False)

    # 10. project_members
    op.create_table(
        'project_members',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('role', sa.String(length=100), nullable=True),
        sa.Column('joined_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('project_id', 'user_id', name='uq_project_member')
    )
    op.create_index(op.f('ix_project_members_project_id'), 'project_members', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_members_user_id'), 'project_members', ['user_id'], unique=False)

    # 11. project_applications
    op.create_table(
        'project_applications',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('project_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('status', sa.String(length=30), nullable=False, server_default='pending'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['project_id'], ['projects.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('project_id', 'user_id', name='uq_project_application')
    )
    op.create_index(op.f('ix_project_applications_project_id'), 'project_applications', ['project_id'], unique=False)
    op.create_index(op.f('ix_project_applications_user_id'), 'project_applications', ['user_id'], unique=False)

    # 12. hackathons
    op.create_table(
        'hackathons',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('title', sa.String(length=200), nullable=False),
        sa.Column('organizer', sa.String(length=200), nullable=False),
        sa.Column('date', sa.DateTime(), nullable=False),
        sa.Column('end_date', sa.DateTime(), nullable=False),
        sa.Column('location', sa.String(length=200), nullable=False),
        sa.Column('prize', sa.String(length=100), nullable=False),
        sa.Column('team_size', sa.String(length=50), nullable=False),
        sa.Column('description', sa.String(length=1000), nullable=False),
        sa.Column('tracks', sa.JSON(), nullable=False),
        sa.Column('tags', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )

    # 13. hackathon_registrations
    op.create_table(
        'hackathon_registrations',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('hackathon_id', sa.Integer(), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('registered_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['hackathon_id'], ['hackathons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('hackathon_id', 'user_id', name='uq_hackathon_registration')
    )
    op.create_index(op.f('ix_hackathon_registrations_hackathon_id'), 'hackathon_registrations', ['hackathon_id'], unique=False)
    op.create_index(op.f('ix_hackathon_registrations_user_id'), 'hackathon_registrations', ['user_id'], unique=False)

    # 14. ai_usages
    op.create_table(
        'ai_usages',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('feature_name', sa.String(length=50), nullable=False),
        sa.Column('usage_date', sa.Date(), nullable=False),
        sa.Column('request_count', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'feature_name', 'usage_date', name='uq_user_feature_date')
    )
    op.create_index(op.f('ix_ai_usages_user_id'), 'ai_usages', ['user_id'], unique=False)

    # 15. ai_caches
    op.create_table(
        'ai_caches',
        sa.Column('id', sa.Integer(), autoincrement=True, nullable=False),
        sa.Column('cache_key', sa.String(length=256), nullable=False),
        sa.Column('feature_name', sa.String(length=50), nullable=False),
        sa.Column('response_json', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('expires_at', sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('cache_key', name='uq_cache_key')
    )
    op.create_index(op.f('ix_ai_caches_cache_key'), 'ai_caches', ['cache_key'], unique=True)

    # 16. chat_messages
    op.create_table(
        'chat_messages',
        sa.Column('id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('team_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('sender_id', postgresql.UUID(as_uuid=False), nullable=False),
        sa.Column('message', sa.Text(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['sender_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['team_id'], ['teams.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_chat_messages_created_at'), 'chat_messages', ['created_at'], unique=False)
    op.create_index(op.f('ix_chat_messages_sender_id'), 'chat_messages', ['sender_id'], unique=False)
    op.create_index(op.f('ix_chat_messages_team_id'), 'chat_messages', ['team_id'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_chat_messages_team_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_sender_id'), table_name='chat_messages')
    op.drop_index(op.f('ix_chat_messages_created_at'), table_name='chat_messages')
    op.drop_table('chat_messages')

    op.drop_index(op.f('ix_ai_caches_cache_key'), table_name='ai_caches')
    op.drop_table('ai_caches')

    op.drop_index(op.f('ix_ai_usages_user_id'), table_name='ai_usages')
    op.drop_table('ai_usages')

    op.drop_index(op.f('ix_hackathon_registrations_user_id'), table_name='hackathon_registrations')
    op.drop_index(op.f('ix_hackathon_registrations_hackathon_id'), table_name='hackathon_registrations')
    op.drop_table('hackathon_registrations')

    op.drop_table('hackathons')

    op.drop_index(op.f('ix_project_applications_user_id'), table_name='project_applications')
    op.drop_index(op.f('ix_project_applications_project_id'), table_name='project_applications')
    op.drop_table('project_applications')

    op.drop_index(op.f('ix_project_members_user_id'), table_name='project_members')
    op.drop_index(op.f('ix_project_members_project_id'), table_name='project_members')
    op.drop_table('project_members')

    op.drop_index(op.f('ix_projects_creator_id'), table_name='projects')
    op.drop_table('projects')

    op.drop_index(op.f('ix_notifications_recipient_id'), table_name='notifications')
    op.drop_table('notifications')

    op.drop_index(op.f('ix_team_invites_user_id'), table_name='team_invites')
    op.drop_index(op.f('ix_team_invites_team_id'), table_name='team_invites')
    op.drop_table('team_invites')

    op.drop_index(op.f('ix_team_members_user_id'), table_name='team_members')
    op.drop_index(op.f('ix_team_members_team_id'), table_name='team_members')
    op.drop_table('team_members')

    op.drop_index(op.f('ix_teams_leader_id'), table_name='teams')
    op.drop_table('teams')

    op.drop_index(op.f('ix_github_profiles_user_id'), table_name='github_profiles')
    op.drop_table('github_profiles')

    op.drop_index(op.f('ix_user_skills_user_id'), table_name='user_skills')
    op.drop_table('user_skills')

    op.drop_index(op.f('ix_skills_name'), table_name='skills')
    op.drop_table('skills')

    op.drop_index(op.f('ix_users_username'), table_name='users')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_table('users')

    op.execute("DROP TYPE IF EXISTS notificationtype")
    op.execute("DROP TYPE IF EXISTS availabilitystatus")
