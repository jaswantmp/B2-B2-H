# app/api/v1/ai.py
import time
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.services.ml_usage_service import log_ml_usage
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
    FeatureUsage,
    TeamGenerateRequest,
    TeamGenerateResponse
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
    Get user-specific hackathon recommendations generated by the trained ML recommendation pipeline (hackathon_recommender_v1).
    Uses live PostgreSQL features, TF-IDF text similarity, and HistGradientBoostingRegressor inference.
    """
    start_time = time.perf_counter()
    try:
        # Fetch user eagerly with their skills loaded
        user = db.query(User).options(
            joinedload(User.user_skills).joinedload(UserSkill.skill),
            joinedload(User.github_profile)
        ).filter(User.id == current_user.id).first()

        from app.services.hackathon_recommendation_service import HackathonRecommendationService
        res = HackathonRecommendationService.get_recommendations(db, user)

        model_ver = "hackathon_recommender_v1"
        # Format the SQLAlchemy hackathon object to dict and inject user_registered
        for rec in res["recommendations"]:
            hk = rec["hackathon"]
            user_registered = any(r.user_id == current_user.id for r in getattr(hk, 'registrations', []))
            rec["hackathon"] = {
                "id": hk.id,
                "title": hk.title,
                "name": hk.title,
                "organizer": hk.organizer,
                "date": hk.date.isoformat() if hk.date else None,
                "end_date": hk.end_date.isoformat() if hk.end_date else None,
                "location": hk.location,
                "prize": hk.prize,
                "team_size": hk.team_size,
                "description": hk.description,
                "tracks": hk.tracks or [],
                "tags": hk.tags or [],
                "technologies": hk.tracks or [],
                "status": "open" if hk.end_date and hk.end_date >= datetime.utcnow() else "closed",
                "user_registered": user_registered,
                "userRegistered": user_registered
            }
            rec["recommendation_score"] = rec.get("recommendation_score", rec.get("score", 85))
            rec["score"] = rec.get("score", rec["recommendation_score"])
            rec["ml_score"] = rec.get("ml_score", float(rec["score"]))
            rec["model_version"] = rec.get("model_version", "hackathon_recommender_v1")
            model_ver = rec["model_version"]
            rec["match_reasons"] = rec.get("match_reasons", rec.get("explanation", []))
    except Exception as e:
        elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
        try:
            log_ml_usage(
                db=db,
                user_id=current_user.id,
                feature="hackathon_recommendations",
                model_version="hackathon_recommender_v1",
                success=False,
                response_time_ms=elapsed_ms,
                commit=True,
            )
        except Exception:
            pass
        raise e

    elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
    try:
        log_ml_usage(
            db=db,
            user_id=current_user.id,
            feature="hackathon_recommendations",
            model_version=model_ver,
            success=True,
            response_time_ms=elapsed_ms,
            commit=True,
        )
    except Exception:
        pass

    return res



@router.get("/project-recommendations", status_code=status.HTTP_200_OK)
def get_project_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ML-based project recommendations for the authenticated user based on skills,
    interests, academic background, and TF-IDF profile text similarity.
    """
    start_time = time.perf_counter()
    from app.services.project_recommendation_service import ProjectRecommendationService
    try:
        res = ProjectRecommendationService.get_recommendations(db, current_user)
    except Exception as e:
        elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
        try:
            log_ml_usage(
                db=db,
                user_id=current_user.id,
                feature="project_recommendations",
                model_version="GradientBoosting-v1.0",
                success=False,
                response_time_ms=elapsed_ms,
                commit=True,
            )
        except Exception:
            pass
        raise e

    elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
    model_ver = "GradientBoosting-v1.0"
    try:
        log_ml_usage(
            db=db,
            user_id=current_user.id,
            feature="project_recommendations",
            model_version=model_ver,
            success=True,
            response_time_ms=elapsed_ms,
            commit=True,
        )
    except Exception:
        pass

    return res


@router.get("/student-cluster", status_code=status.HTTP_200_OK)
def get_student_cluster(
    current_user: User = Depends(get_current_user)
):
    """
    Get K-Means ML skill cluster assignment, centroid distance, confidence,
    dominant skills/domains, and explainable rationale for the authenticated user.
    """
    from app.services.student_clustering_service import StudentClusteringService
    from app.database import SessionLocal

    db = SessionLocal()
    try:
        return StudentClusteringService.get_user_cluster(db, current_user)
    finally:
        db.close()


@router.post("/team-generator", response_model=TeamGenerateResponse, status_code=status.HTTP_200_OK)
@router.post("/recommend-team", response_model=TeamGenerateResponse, status_code=status.HTTP_200_OK)
def generate_team_recommendations(
    request_data: TeamGenerateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate an ML-optimized, cross-functional team (team_generator_v1) satisfying size
    and must-have skill constraints using 2-level HistGradientBoostingRegressor inference.
    """
    start_time = time.perf_counter()
    from app.services.team_generator_service import TeamGeneratorService
    try:
        result = TeamGeneratorService.generate_team(
            db=db,
            idea=request_data.idea,
            team_size=request_data.team_size or 4,
            must_have_skills=request_data.must_have_skills or [],
            current_user_id=str(current_user.id) if current_user else None
        )
    except Exception as e:
        elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
        try:
            log_ml_usage(
                db=db,
                user_id=current_user.id,
                feature="team_generator",
                model_version="team_generator_v1",
                success=False,
                response_time_ms=elapsed_ms,
                commit=True,
            )
        except Exception:
            pass
        raise e

    elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
    model_ver = getattr(result, "model_version", None) or (result.get("model_version") if isinstance(result, dict) else None) or "team_generator_v1"
    try:
        log_ml_usage(
            db=db,
            user_id=current_user.id,
            feature="team_generator",
            model_version=model_ver,
            success=True,
            response_time_ms=elapsed_ms,
            commit=True,
        )
    except Exception:
        pass

    return result

