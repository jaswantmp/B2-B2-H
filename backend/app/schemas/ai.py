# app/schemas/ai.py
from pydantic import BaseModel, Field, model_validator
from typing import List, Optional

class ProjectIdeaRequest(BaseModel):
    domain: str = Field(..., min_length=1, description="The focus area/domain of the project, e.g. Education, Health")
    skills: list[str] = Field(..., min_items=1, description="List of skills the team has or needs")
    theme: str | None = Field(None, description="Hackathon theme or specific focus")
    team_size: int | None = Field(None, description="Target team size")
    difficulty: str | None = Field(None, description="Target difficulty level, e.g. Beginner, Advanced")

class ProjectIdeaResponse(BaseModel):
    title: str = Field(..., description="Generated project title/name")
    problem_statement: str = Field(..., description="Target problem statement")
    solution: str = Field(..., description="Proposed AI solution")
    key_features: list[str] = Field(..., description="Key features of the project")
    tech_stack: list[str] = Field(..., description="Recommended tech stack")
    
    # Legacy fields for frontend compatibility
    project_name: str | None = Field(None, description="Legacy field for frontend compatibility")
    team_roles: list[str] | None = Field(None, description="Legacy field for frontend compatibility")

    @model_validator(mode="after")
    def populate_compatibility_fields(self) -> "ProjectIdeaResponse":
        if not self.project_name:
            self.project_name = self.title
        if not self.team_roles:
            self.team_roles = ["Frontend Developer", "Backend Developer", "AI Engineer"]
        return self


class TeamMatchExplainRequest(BaseModel):
    target_user_id: str


class TeamMatchExplainResponse(BaseModel):
    user_id: str
    target_user_id: str
    ai_explanation: str


class FeatureUsage(BaseModel):
    used: int
    limit: int
    remaining: int


class AIUsageResponse(BaseModel):
    team_matcher: FeatureUsage
    project_generator: FeatureUsage
    hackathon_recommender: FeatureUsage


class TeamRoleItem(BaseModel):
    role: str
    reason: str
    skills: list[str] = []


class TeamGenerateRequest(BaseModel):
    idea: str = Field(..., min_length=1, description="Description of the project idea")
    team_size: Optional[int] = Field(4, ge=2, le=6, description="Target team size from 2 to 6")
    must_have_skills: Optional[list[str]] = Field(default_factory=list, description="Optional must-have skill requirements")


class TeamGenerateResponse(BaseModel):
    idea: str
    team_size: int
    roles: list[TeamRoleItem]
    suggestedBuilders: list[dict]
    team_quality_score: int
    ml_score: float
    model_version: str
    is_ml_powered: bool
    strengths: list[str] = []
    weaknesses: list[str] = []
    category_coverage: Optional[dict] = None
