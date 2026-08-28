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
    ml_score: Optional[float] = None
    probability_good_fit: Optional[float] = None
    predicted_compatibility: Optional[float] = None
    cluster_segment: Optional[str] = None
    model_version: Optional[str] = None
    compatibility_level: Optional[str] = None
    common_skills: Optional[List[str]] = []
    complementary_skills: Optional[List[str]] = []
    common_domains: Optional[List[str]] = []
    match_reasons: Optional[List[str]] = []
    explanation: Optional[List[str]] = []


class TeamMatchResponse(BaseModel):
    matches: List[TeamMatchCandidate]

