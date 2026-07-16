# app/schemas/ai.py
from pydantic import BaseModel, Field, model_validator

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

