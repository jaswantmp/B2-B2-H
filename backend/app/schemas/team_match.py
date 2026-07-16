# app/schemas/team_match.py
from pydantic import BaseModel
from typing import List, Optional


class TeamMatchRequest(BaseModel):
    user_id: str


class TeamMatchCandidate(BaseModel):
    user_id: str
    id: str
    name: str
    compatibility_score: int
    reasons: List[str]
    recommended_role: str
    avatar: Optional[str] = None
    branch: Optional[str] = None
    year: Optional[str] = None
    university: Optional[str] = None
    ai_explanation: Optional[str] = None



class TeamMatchResponse(BaseModel):
    matches: List[TeamMatchCandidate]
