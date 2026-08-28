# app/schemas/team.py
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse


# ─── Team Member Schemas ──────────────────────────────────────────────────────
class TeamMemberBase(BaseModel):
    user_id: str
    role: str = Field(..., max_length=100)


class TeamMemberCreate(TeamMemberBase):
    pass


class TeamMemberUpdate(BaseModel):
    role: str = Field(..., max_length=100)


class TeamMemberResponse(TeamMemberBase):
    id: str
    team_id: str
    joined_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


# ─── Team Invite Schemas ──────────────────────────────────────────────────────
class TeamInviteBase(BaseModel):
    user_id: str
    role: str = Field(..., max_length=100)
    message: str | None = Field(None, max_length=500)


class TeamInviteCreate(TeamInviteBase):
    pass


class TeamInviteUpdate(BaseModel):
    status: str = Field(..., max_length=30)  # pending, accepted, declined


class TeamInviteResponse(TeamInviteBase):
    id: str
    team_id: str
    status: str
    created_at: datetime
    updated_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


# ─── Team Schemas ─────────────────────────────────────────────────────────────
class TeamBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: str | None = Field(None, max_length=500)
    hackathon_id: int | None = None
    status: str = Field("recruiting", max_length=30)
    max_members: int = 5


class TeamCreate(TeamBase):
    pass


class TeamUpdate(BaseModel):
    name: str | None = Field(None, max_length=100)
    description: str | None = Field(None, max_length=500)
    hackathon_id: int | None = None
    status: str | None = Field(None, max_length=30)
    max_members: int | None = None
    leader_id: str | None = None


class TeamResponse(TeamBase):
    id: str
    leader_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Detailed team response including leader, members, active invites lists, and dynamic ML health scores
class TeamDetailResponse(TeamResponse):
    leader: UserResponse
    members: list[TeamMemberResponse] = []
    invites: list[TeamInviteResponse] = []
    health_scores: dict[str, int] = {}
    missing_roles: list[str] = []
    health_details: dict[str, Any] = {}

    model_config = ConfigDict(from_attributes=True)


class UserTeamInviteResponse(BaseModel):
    id: str
    team_id: str
    team_name: str
    sender_id: str
    sender_name: str
    role: str
    message: str | None = None
    status: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class TeamInviteActionResponse(BaseModel):
    success: bool
    status: str
    team_id: str | None = None
    team_name: str | None = None
    message: str | None = None

    model_config = ConfigDict(from_attributes=True)
