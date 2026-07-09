# app/models/user.py
from __future__ import annotations
import uuid
from datetime import datetime
from sqlalchemy import (
    String, Boolean, Text, Integer, Float,
    DateTime, ForeignKey, UniqueConstraint, Enum as SAEnum,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base
import enum


class AvailabilityStatus(str, enum.Enum):
    LOOKING_FOR_TEAM = "LOOKING_FOR_TEAM"
    OPEN_TO_INVITES = "OPEN_TO_INVITES"
    LOOKING_FOR_MEMBERS = "LOOKING_FOR_MEMBERS"
    IN_TEAM = "IN_TEAM"
    OFFLINE = "OFFLINE"


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    username: Mapped[str] = mapped_column(String(60), unique=True, nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)

    # Profile
    bio: Mapped[str | None] = mapped_column(Text)
    avatar: Mapped[str | None] = mapped_column(String(500))
    location: Mapped[str | None] = mapped_column(String(200))
    university: Mapped[str | None] = mapped_column(String(200))
    college: Mapped[str | None] = mapped_column(String(200))
    district: Mapped[str | None] = mapped_column(String(100))
    city: Mapped[str | None] = mapped_column(String(100))
    state: Mapped[str | None] = mapped_column(String(100))
    year: Mapped[str | None] = mapped_column(String(30))
    branch: Mapped[str | None] = mapped_column(String(120))
    github: Mapped[str | None] = mapped_column(String(100))
    linkedin: Mapped[str | None] = mapped_column(String(200))
    twitter: Mapped[str | None] = mapped_column(String(200))
    website: Mapped[str | None] = mapped_column(String(300))

    # Status
    status: Mapped[AvailabilityStatus] = mapped_column(
        SAEnum(AvailabilityStatus, name="availabilitystatus"),
        default=AvailabilityStatus.LOOKING_FOR_TEAM,
        nullable=False,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    # Stats (denormalized for quick reads)
    hackathons_won: Mapped[int] = mapped_column(Integer, default=0)
    profile_views: Mapped[int] = mapped_column(Integer, default=0)

    # Timestamps
    joined_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    user_skills: Mapped[list["UserSkill"]] = relationship(
        "UserSkill", back_populates="user", cascade="all, delete-orphan"
    )
    github_profile: Mapped["GithubProfile | None"] = relationship(
        "GithubProfile", back_populates="user", uselist=False, cascade="all, delete-orphan"
    )
    notifications: Mapped[list["Notification"]] = relationship(
        "Notification", back_populates="recipient", cascade="all, delete-orphan",
        foreign_keys="Notification.recipient_id",
    )
    team_memberships: Mapped[list["TeamMember"]] = relationship(
        "TeamMember", back_populates="user", cascade="all, delete-orphan"
    )
    project_memberships: Mapped[list["ProjectMember"]] = relationship(
        "ProjectMember", back_populates="user", cascade="all, delete-orphan"
    )
    led_teams: Mapped[list["Team"]] = relationship(
        "Team", back_populates="leader", foreign_keys="Team.leader_id"
    )
    created_projects: Mapped[list["Project"]] = relationship(
        "Project", back_populates="creator", foreign_keys="Project.creator_id"
    )

    def __repr__(self) -> str:
        return f"<User {self.username}>"


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str | None] = mapped_column(String(60))  # frontend, backend, ai, design, etc.

    user_skills: Mapped[list["UserSkill"]] = relationship("UserSkill", back_populates="skill")

    def __repr__(self) -> str:
        return f"<Skill {self.name}>"


class UserSkill(Base):
    __tablename__ = "user_skills"
    __table_args__ = (UniqueConstraint("user_id", "skill_id", name="uq_user_skill"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    proficiency: Mapped[str | None] = mapped_column(String(20))  # beginner, intermediate, advanced

    user: Mapped["User"] = relationship("User", back_populates="user_skills")
    skill: Mapped["Skill"] = relationship("Skill", back_populates="user_skills")


# Import here to avoid circular dependency issues in models
from app.models.github import GithubProfile  # noqa: E402
from app.models.notification import Notification  # noqa: E402
from app.models.team import TeamMember, Team  # noqa: E402
from app.models.project import ProjectMember, Project  # noqa: E402