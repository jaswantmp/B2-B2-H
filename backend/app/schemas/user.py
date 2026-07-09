# app/schemas/user.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, EmailStr, Field
from app.models.user import AvailabilityStatus


# ─── Skill Schemas ───────────────────────────────────────────────────────────
class SkillBase(BaseModel):
    name: str = Field(..., max_length=100)
    category: str | None = Field(None, max_length=60)


class SkillCreate(SkillBase):
    pass


class SkillResponse(SkillBase):
    id: int

    model_config = ConfigDict(from_attributes=True)


# ─── User Skill Schemas ───────────────────────────────────────────────────────
class UserSkillBase(BaseModel):
    skill_id: int
    proficiency: str | None = Field(None, max_length=20)


class UserSkillCreate(UserSkillBase):
    pass


class UserSkillUpdate(BaseModel):
    proficiency: str | None = Field(None, max_length=20)
    is_verified: bool | None = None


class UserSkillResponse(BaseModel):
    id: int
    user_id: str
    skill_id: int
    is_verified: bool
    proficiency: str | None
    skill: SkillResponse

    model_config = ConfigDict(from_attributes=True)


# ─── User Profile Schemas ─────────────────────────────────────────────────────
class UserBase(BaseModel):
    name: str = Field(..., max_length=120)
    username: str = Field(..., max_length=60)
    email: EmailStr
    bio: str | None = None
    avatar: str | None = None
    location: str | None = Field(None, max_length=200)
    university: str | None = Field(None, max_length=200)
    college: str | None = Field(None, max_length=200)
    district: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    year: str | None = Field(None, max_length=30)
    branch: str | None = Field(None, max_length=120)
    github: str | None = Field(None, max_length=100)
    linkedin: str | None = Field(None, max_length=200)
    twitter: str | None = Field(None, max_length=200)
    website: str | None = Field(None, max_length=300)
    status: AvailabilityStatus = AvailabilityStatus.LOOKING_FOR_TEAM
    hackathons_won: int = 0


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    name: str | None = Field(None, max_length=120)
    username: str | None = Field(None, max_length=60)
    email: EmailStr | None = None
    bio: str | None = None
    avatar: str | None = None
    location: str | None = Field(None, max_length=200)
    university: str | None = Field(None, max_length=200)
    college: str | None = Field(None, max_length=200)
    district: str | None = Field(None, max_length=100)
    city: str | None = Field(None, max_length=100)
    state: str | None = Field(None, max_length=100)
    year: str | None = Field(None, max_length=30)
    branch: str | None = Field(None, max_length=120)
    github: str | None = Field(None, max_length=100)
    linkedin: str | None = Field(None, max_length=200)
    twitter: str | None = Field(None, max_length=200)
    website: str | None = Field(None, max_length=300)
    status: AvailabilityStatus | None = None
    hackathons_won: int | None = None


class UserResponse(UserBase):
    id: str
    is_active: bool
    is_verified: bool
    profile_views: int
    joined_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Detailed response including user's skills
class UserDetailResponse(UserResponse):
    user_skills: list[UserSkillResponse] = []

    model_config = ConfigDict(from_attributes=True)
