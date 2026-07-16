# app/services/ai_service.py
import logging
from fastapi import HTTPException, status
from app.schemas.ai import ProjectIdeaRequest, ProjectIdeaResponse
from app.services.gemini_service import generate_project_idea

logger = logging.getLogger(__name__)

class AIService:
    @classmethod
    async def generate_project_idea(cls, request_data: ProjectIdeaRequest) -> ProjectIdeaResponse:
        """
        Generates a project idea using Gemini API.
        """
        domain = request_data.domain
        difficulty = request_data.difficulty or "Intermediate"
        
        try:
            # Generate project idea using Gemini
            project_idea = generate_project_idea(domain, difficulty)
            
            # log success
            logger.info(f"Successfully generated project idea via Gemini for domain: {domain}")
            return project_idea
            
        except Exception as e:
            # log failure
            logger.error(f"Failed to generate project idea via Gemini for domain {domain}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate project idea: {str(e)}"
            )
