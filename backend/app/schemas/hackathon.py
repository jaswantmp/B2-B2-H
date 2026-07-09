# app/schemas/hackathon.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class HackathonBase(BaseModel):
    title: str = Field(..., max_length=200)
    organizer: str = Field(..., max_length=200)
    date: datetime
    end_date: datetime
    location: str = Field(..., max_length=200)
    prize: str = Field(..., max_length=100)
    team_size: str = Field(..., max_length=50)
    description: str = Field(..., max_length=1000)
    tracks: list[str] = Field(default_factory=list)
    tags: list[str] = Field(default_factory=list)


class HackathonCreate(HackathonBase):
    pass


class HackathonUpdate(BaseModel):
    title: str | None = Field(None, max_length=200)
    organizer: str | None = Field(None, max_length=200)
    date: datetime | None = None
    end_date: datetime | None = None
    location: str | None = Field(None, max_length=200)
    prize: str | None = Field(None, max_length=100)
    team_size: str | None = Field(None, max_length=50)
    description: str | None = Field(None, max_length=1000)
    tracks: list[str] | None = None
    tags: list[str] | None = None


class HackathonResponse(HackathonBase):
    id: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class HackathonDetailResponse(HackathonResponse):
    user_registered: bool = False

    model_config = ConfigDict(from_attributes=True)


class HackathonRegistrationResponse(BaseModel):
    id: str
    hackathon_id: int
    user_id: str
    registered_at: datetime

    model_config = ConfigDict(from_attributes=True)
