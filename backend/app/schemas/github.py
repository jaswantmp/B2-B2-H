# app/schemas/github.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class GithubProfileBase(BaseModel):
    username: str = Field(..., max_length=100)
    repos: int = Field(0, ge=0)
    commits: int = Field(0, ge=0)
    stars: int = Field(0, ge=0)


class GithubProfileCreate(GithubProfileBase):
    user_id: str


class GithubProfileUpdate(BaseModel):
    username: str | None = Field(None, max_length=100)
    repos: int | None = Field(None, ge=0)
    commits: int | None = Field(None, ge=0)
    stars: int | None = Field(None, ge=0)


class GithubProfileResponse(GithubProfileBase):
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
