# app/schemas/ai.py
from pydantic import BaseModel, Field

class ProjectIdeaRequest(BaseModel):
    domain: str = Field(..., min_length=1, description="The focus area/domain of the project, e.g. Education, Health")
    skills: list[str] = Field(..., min_items=1, description="List of skills the team has or needs")
    theme: str | None = Field(None, description="Hackathon theme or specific focus")
    team_size: int | None = Field(None, description="Target team size")
    difficulty: str | None = Field(None, description="Target difficulty level, e.g. Beginner, Advanced")

class ProjectIdeaResponse(BaseModel):
    project_name: str = Field(..., description="Generated project name")
    problem_statement: str = Field(..., description="Target problem statement")
    solution: str = Field(..., description="Proposed AI solution")
    tech_stack: list[str] = Field(..., description="Recommended tech stack")
    team_roles: list[str] = Field(..., description="Required roles for the project team")
