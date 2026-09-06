# app/schemas/admin.py
from datetime import datetime
from typing import Any
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import AvailabilityStatus


class AdminStatsResponse(BaseModel):
    total_students: int
    active_students: int
    verified_students: int
    total_projects: int
    total_teams: int
    total_hackathons: int
    total_hackathon_registrations: int


class AdminStudentSummary(BaseModel):
    id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    university: str | None = None
    branch: str | None = None
    year: str | None = None
    status: AvailabilityStatus
    is_active: bool
    is_verified: bool
    is_admin: bool
    onboarding_completed: bool
    hackathons_won: int = 0
    skills_count: int = 0
    joined_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminStudentListResponse(BaseModel):
    items: list[AdminStudentSummary]
    total: int
    page: int
    limit: int
    total_pages: int


class AdminStudentSkillItem(BaseModel):
    id: int
    skill_id: int
    name: str
    category: str | None = None
    proficiency: str | None = None
    is_verified: bool = False


class AdminStudentProjectItem(BaseModel):
    id: str
    title: str
    category: str
    status: str
    role: str | None = None
    is_creator: bool = False
    created_at: datetime


class AdminStudentTeamItem(BaseModel):
    id: str
    name: str
    hackathon_id: int | None = None
    status: str
    role: str | None = None
    is_leader: bool = False
    created_at: datetime


class AdminStudentHackathonItem(BaseModel):
    id: int
    title: str
    organizer: str
    date: datetime
    end_date: datetime
    location: str
    registered_at: datetime


class AdminStudentDetailResponse(BaseModel):
    id: str
    name: str
    username: str
    email: EmailStr
    bio: str | None = None
    avatar: str | None = None
    location: str | None = None
    university: str | None = None
    college: str | None = None
    district: str | None = None
    city: str | None = None
    state: str | None = None
    year: str | None = None
    branch: str | None = None
    github: str | None = None
    linkedin: str | None = None
    twitter: str | None = None
    website: str | None = None
    domains: list[str] | None = None
    status: AvailabilityStatus
    is_active: bool
    is_verified: bool
    is_admin: bool
    onboarding_completed: bool
    hackathons_won: int = 0
    profile_views: int = 0
    joined_at: datetime
    updated_at: datetime

    skills: list[AdminStudentSkillItem] = []
    projects: list[AdminStudentProjectItem] = []
    teams: list[AdminStudentTeamItem] = []
    hackathons: list[AdminStudentHackathonItem] = []

    model_config = ConfigDict(from_attributes=True)


class AdminStudentStatusUpdate(BaseModel):
    is_active: bool


class AdminStudentVerificationUpdate(BaseModel):
    is_verified: bool


# ─── Hackathon Management Schemas ─────────────────────────────────────────────
class AdminHackathonSummary(BaseModel):
    id: int
    title: str
    organizer: str
    date: datetime
    end_date: datetime
    location: str
    prize: str
    team_size: str
    description: str
    tracks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    registration_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminHackathonListResponse(BaseModel):
    items: list[AdminHackathonSummary]
    total: int
    page: int
    limit: int
    total_pages: int


class AdminHackathonCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    organizer: str = Field(..., min_length=1, max_length=200)
    date: datetime
    end_date: datetime
    location: str = Field(..., min_length=1, max_length=200)
    prize: str = Field(..., min_length=1, max_length=100)
    team_size: str = Field(..., min_length=1, max_length=50)
    description: str = Field(..., min_length=1, max_length=1000)
    tracks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class AdminHackathonUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    organizer: str | None = Field(None, min_length=1, max_length=200)
    date: datetime | None = None
    end_date: datetime | None = None
    location: str | None = Field(None, min_length=1, max_length=200)
    prize: str | None = Field(None, min_length=1, max_length=100)
    team_size: str | None = Field(None, min_length=1, max_length=50)
    description: str | None = Field(None, min_length=1, max_length=1000)
    tracks: list[str] | None = None
    tags: list[str] | None = None


class AdminHackathonRegistrationItem(BaseModel):
    id: str
    student_id: str
    student_name: str
    student_email: EmailStr
    college: str | None = None
    branch: str | None = None
    year: str | None = None
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminHackathonDetailResponse(BaseModel):
    id: int
    title: str
    organizer: str
    date: datetime
    end_date: datetime
    location: str
    prize: str
    team_size: str
    description: str
    tracks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)
    registration_count: int = 0
    created_at: datetime
    updated_at: datetime
    registrations: list[AdminHackathonRegistrationItem] = []

    model_config = ConfigDict(from_attributes=True)


# ─── Project Management Schemas ───────────────────────────────────────────────
class AdminProjectCreator(BaseModel):
    id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    university: str | None = None
    branch: str | None = None
    year: str | None = None
    is_active: bool = True
    is_verified: bool = False

    model_config = ConfigDict(from_attributes=True)


class AdminProjectSummary(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: str
    deadline: datetime | None = None
    university: str | None = None
    tech: list[str] = Field(default_factory=list)
    open_roles: list[str] = Field(default_factory=list)
    member_count: int = 0
    application_count: int = 0
    creator: AdminProjectCreator
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProjectListResponse(BaseModel):
    items: list[AdminProjectSummary]
    total: int
    page: int
    limit: int
    total_pages: int


class AdminProjectMemberItem(BaseModel):
    id: str
    student_id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    branch: str | None = None
    year: str | None = None
    role: str | None = None
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProjectApplicationItem(BaseModel):
    id: str
    project_id: str
    student_id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    branch: str | None = None
    year: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminProjectDetailResponse(BaseModel):
    id: str
    title: str
    description: str
    category: str
    status: str
    deadline: datetime | None = None
    university: str | None = None
    tech: list[str] = Field(default_factory=list)
    open_roles: list[str] = Field(default_factory=list)
    member_count: int = 0
    application_count: int = 0
    creator: AdminProjectCreator
    created_at: datetime
    updated_at: datetime
    members: list[AdminProjectMemberItem] = []
    applications: list[AdminProjectApplicationItem] = []

    model_config = ConfigDict(from_attributes=True)


class AdminProjectUpdate(BaseModel):
    title: str | None = Field(None, min_length=1, max_length=200)
    description: str | None = Field(None, min_length=1, max_length=1000)
    category: str | None = Field(None, max_length=50)
    status: str | None = Field(None, max_length=30)
    deadline: datetime | None = None
    university: str | None = Field(None, max_length=200)
    tech: list[str] | None = None
    open_roles: list[str] | None = None


# ─── Team Schemas ─────────────────────────────────────────────────────────────
class AdminTeamLeader(BaseModel):
    id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    university: str | None = None
    branch: str | None = None
    year: str | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminTeamSummary(BaseModel):
    id: str
    name: str
    description: str | None = None
    hackathon_id: int | None = None
    status: str
    max_members: int
    member_count: int = 0
    invite_count: int = 0
    leader: AdminTeamLeader
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminTeamListResponse(BaseModel):
    items: list[AdminTeamSummary]
    total: int
    page: int
    limit: int
    total_pages: int


class AdminTeamMemberItem(BaseModel):
    id: str
    student_id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    branch: str | None = None
    year: str | None = None
    role: str
    joined_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminTeamInviteItem(BaseModel):
    id: str
    team_id: str
    student_id: str
    name: str
    username: str
    email: EmailStr
    avatar: str | None = None
    college: str | None = None
    branch: str | None = None
    year: str | None = None
    role: str
    message: str | None = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AdminTeamDetailResponse(BaseModel):
    id: str
    name: str
    description: str | None = None
    hackathon_id: int | None = None
    status: str
    max_members: int
    member_count: int = 0
    invite_count: int = 0
    leader: AdminTeamLeader
    created_at: datetime
    updated_at: datetime
    members: list[AdminTeamMemberItem] = []
    invites: list[AdminTeamInviteItem] = []
    # Dynamic ML team health indicators
    health_scores: dict[str, int] = {}
    missing_roles: list[str] = []
    health_details: dict[str, Any] = {}
    health_score: int | None = None
    ml_health_score: float | None = None
    health_status: str | None = None
    is_ml_powered: bool = False
    model_version: str | None = None
    explainability: dict[str, Any] | None = None

    model_config = ConfigDict(from_attributes=True)


class AdminTeamUpdate(BaseModel):
    name: str | None = Field(None, min_length=1, max_length=100)
    description: str | None = Field(None, max_length=500)
    hackathon_id: int | None = None
    status: str | None = Field(None, max_length=30)
    max_members: int | None = Field(None, ge=2, le=10)


