# app/api/v1/ai.py
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User, UserSkill
from app.models.ai import AIUsage
from app.schemas.ai import (
    ProjectIdeaRequest,
    ProjectIdeaResponse,
    TeamMatchExplainRequest,
    TeamMatchExplainResponse,
    AIUsageResponse,
    FeatureUsage
)
from app.services.ai_service import AIService
from app.services.ai_limit_service import AILimitService, LIMITS
from app.services.ai_cache_service import AICacheService
from app.services.gemini_service import generate_match_explanation, GeminiQuotaExceededException
from app.services.team_match_service import TeamMatchService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/project-idea", response_model=ProjectIdeaResponse, status_code=status.HTTP_200_OK)
async def generate_project_idea(
    request_data: ProjectIdeaRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate an AI-powered project idea based on a specified domain and required skills.
    Requires authentication. Uses caching and daily limits.
    """
    return await AIService.generate_project_idea(db, request_data, current_user.id)


@router.post("/team-match/explain", response_model=TeamMatchExplainResponse, status_code=status.HTTP_200_OK)
async def explain_team_match(
    request_data: TeamMatchExplainRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate a Gemini match explanation for a target user.
    Uses caching and checks/enforces the daily 'team_matcher' limit.
    """
    target_user_id = request_data.target_user_id
    feature_name = "team_matcher"

    # 1. Deterministic Cache Key
    cache_payload = {
        "user_id": current_user.id,
        "target_user_id": target_user_id
    }
    cache_key = AICacheService.generate_cache_key(feature_name, cache_payload)

    # 2. Check Cache
    cached_json = AICacheService.get_cached_response(db, cache_key, current_user.id)
    if cached_json:
        return TeamMatchExplainResponse(
            user_id=current_user.id,
            target_user_id=target_user_id,
            ai_explanation=cached_json["ai_explanation"]
        )

    # 3. Cache Miss - Verify Daily Limits Before Calling Gemini
    AILimitService.check_limit(db, current_user.id, feature_name)

    # Fetch users with skills
    user = db.query(User).options(
        joinedload(User.user_skills).joinedload(UserSkill.skill)
    ).filter(User.id == current_user.id).first()

    target_user = db.query(User).options(
        joinedload(User.user_skills).joinedload(UserSkill.skill)
    ).filter(User.id == target_user_id).first()

    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Target user not found."
        )

    # Calculate match properties
    score, reasons, recommended_role = TeamMatchService.calculate_match(user, target_user)
    user_skills = [us.skill.name for us in user.user_skills if us.skill]
    target_skills = [us.skill.name for us in target_user.user_skills if us.skill]

    try:
        # 4. Invoke Gemini API
        explanation = generate_match_explanation(
            user_name=user.name,
            user_skills=user_skills,
            candidate_name=target_user.name,
            candidate_skills=target_skills,
            compatibility_score=score
        )

        response_data = {
            "ai_explanation": explanation
        }

        # 5. Success - Increment Count & Save Cache
        AILimitService.increment_usage(db, current_user.id, feature_name)
        AICacheService.set_cached_response(db, cache_key, feature_name, response_data)

        return TeamMatchExplainResponse(
            user_id=current_user.id,
            target_user_id=target_user_id,
            ai_explanation=explanation
        )

    except GeminiQuotaExceededException as e:
        logger.error(f"Gemini API quota exceeded during match explanation: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="AI service temporarily unavailable because the Gemini API quota has been exhausted."
        )
    except Exception as e:
        logger.error(f"Failed to generate match explanation: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate match explanation due to an internal error."
        )


@router.get("/usage", response_model=AIUsageResponse, status_code=status.HTTP_200_OK)
def get_ai_usage(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current user's daily usage status for all AI features.
    """
    response_data = {}
    for feature_name, limit in LIMITS.items():
        usage = AILimitService.get_usage_for_today(db, current_user.id, feature_name)
        used = usage.request_count
        remaining = max(0, limit - used)
        response_data[feature_name] = FeatureUsage(
            used=used,
            limit=limit,
            remaining=remaining
        )

    return AIUsageResponse(**response_data)


@router.get("/hackathon-recommendations", status_code=status.HTTP_200_OK)
def get_hackathon_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user-specific hackathon recommendations based on skills, domains, branch, and academic year.
    Does not use Gemini or external APIs. Fully deterministic and rule-based.
    """
    # Fetch user eagerly with their skills loaded
    user = db.query(User).options(
        joinedload(User.user_skills).joinedload(UserSkill.skill)
    ).filter(User.id == current_user.id).first()

    from app.services.hackathon_recommendation_service import HackathonRecommendationService
    res = HackathonRecommendationService.get_recommendations(db, user)

    # Format the SQLAlchemy hackathon object to dict and inject user_registered
    for rec in res["recommendations"]:
        hk = rec["hackathon"]
        user_registered = any(r.user_id == current_user.id for r in getattr(hk, 'registrations', []))
        rec["hackathon"] = {
            "id": hk.id,
            "title": hk.title,
            "organizer": hk.organizer,
            "date": hk.date.isoformat() if hk.date else None,
            "end_date": hk.end_date.isoformat() if hk.end_date else None,
            "location": hk.location,
            "prize": hk.prize,
            "team_size": hk.team_size,
            "description": hk.description,
            "tracks": hk.tracks,
            "tags": hk.tags,
            "user_registered": user_registered
        }

    return res

