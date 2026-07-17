# app/services/ai_service.py
import logging
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.ai import ProjectIdeaRequest, ProjectIdeaResponse
from app.services.gemini_service import generate_project_idea, GeminiQuotaExceededException
from app.services.ai_cache_service import AICacheService
from app.services.ai_limit_service import AILimitService

logger = logging.getLogger(__name__)

class AIService:
    @classmethod
    async def generate_project_idea(
        cls, db: Session, request_data: ProjectIdeaRequest, user_id: str
    ) -> ProjectIdeaResponse:
        """
        Generates a project idea using Gemini API with caching and usage limits.
        """
        domain = request_data.domain
        difficulty = request_data.difficulty or "Intermediate"
        feature_name = "project_generator"

        # 1. Deterministic Cache Key
        cache_payload = {
            "domain": domain,
            "difficulty": difficulty,
            "skills": request_data.skills,
            "theme": request_data.theme,
            "team_size": request_data.team_size
        }
        cache_key = AICacheService.generate_cache_key(feature_name, cache_payload)

        # 2. Check Cache
        cached_json = AICacheService.get_cached_response(db, cache_key, user_id)
        if cached_json:
            return ProjectIdeaResponse.model_validate(cached_json)

        # 3. Cache Miss - Verify Daily Limits Before API Call
        AILimitService.check_limit(db, user_id, feature_name)

        try:
            # 4. Invoke Gemini API
            project_idea = generate_project_idea(domain, difficulty)
            
            # 5. Success - Increment Count & Save Cache
            AILimitService.increment_usage(db, user_id, feature_name)
            AICacheService.set_cached_response(db, cache_key, feature_name, project_idea.model_dump())
            
            logger.info(f"Successfully generated project idea via Gemini for domain: {domain}")
            return project_idea
            
        except GeminiQuotaExceededException as e:
            logger.error(f"Gemini API quota exceeded for domain {domain}: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="AI service temporarily unavailable because the Gemini API quota has been exhausted."
            )
        except HTTPException as e:
            # Propagate rate-limit or validation HTTP exceptions directly
            raise e
        except Exception as e:
            logger.error(f"Failed to generate project idea via Gemini for domain {domain}: {str(e)}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to generate project idea due to an internal error."
            )
