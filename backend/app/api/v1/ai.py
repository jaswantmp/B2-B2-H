# app/api/v1/ai.py
from fastapi import APIRouter, Depends, status
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.ai import ProjectIdeaRequest, ProjectIdeaResponse
from app.services.ai_service import AIService

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/project-idea", response_model=ProjectIdeaResponse, status_code=status.HTTP_200_OK)
async def generate_project_idea(
    request_data: ProjectIdeaRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Generate an AI-powered project idea based on a specified domain and required skills.
    Requires authentication.
    """
    return await AIService.generate_project_idea(request_data)
