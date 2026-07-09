# app/schemas/project.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.user import UserResponse


# ─── Project Member Schemas ──────────────────────────────────────────────────
class ProjectMemberBase(BaseModel):
    user_id: str
    role: str | None = Field(None, max_length=100)


class ProjectMemberCreate(ProjectMemberBase):
    pass


class ProjectMemberUpdate(BaseModel):
    role: str | None = Field(None, max_length=100)


class ProjectMemberResponse(ProjectMemberBase):
    id: str
    project_id: str
    joined_at: datetime
    user: UserResponse

    model_config = ConfigDict(from_attributes=True)


# ─── Project Schemas ─────────────────────────────────────────────────────────
class ProjectBase(BaseModel):
    title: str = Field(..., max_length=200)
    description: str = Field(..., max_length=1000)
    category: str = Field(..., max_length=50)  # research, college, opensource, startup
    university: str | None = Field(None, max_length=200)
    status: str = Field("recruiting", max_length=30)
    deadline: datetime | None = None
    tech: list[str] = Field(default_factory=list)
    open_roles: list[str] = Field(default_factory=list)


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    description: str | None = Field(None, max_length=1000)
    category: str | None = Field(None, max_length=50)
    university: str | None = Field(None, max_length=200)
    status: str | None = Field(None, max_length=30)
    deadline: datetime | None = None
    tech: list[str] | None = None
    open_roles: list[str] | None = None


class ProjectResponse(ProjectBase):
    id: str
    creator_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Detailed project response including creator profile & members list
class ProjectDetailResponse(ProjectResponse):
    creator: UserResponse
    members: list[ProjectMemberResponse] = []

    model_config = ConfigDict(from_attributes=True)
