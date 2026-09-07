# app/api/v1/team_match.py
import time
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.team_match import TeamMatchRequest, TeamMatchResponse
from app.services.team_match_service import TeamMatchService
from app.services.ml_usage_service import log_ml_usage

router = APIRouter(prefix="/ai", tags=["team-match"])


@router.post("/team-match", response_model=TeamMatchResponse, status_code=status.HTTP_200_OK)
async def get_team_matches(
    request_data: TeamMatchRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommended team matches for the specified builder.
    Requires authentication.
    """
    start_time = time.perf_counter()
    try:
        matches = await TeamMatchService.get_team_matches(db, request_data.user_id)
    except Exception as e:
        elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
        try:
            log_ml_usage(
                db=db,
                user_id=current_user.id,
                feature="team_matcher",
                model_version="GradientBoosting-v1.0",
                success=False,
                response_time_ms=elapsed_ms,
                commit=True,
            )
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during team matching: {str(e)}"
        )

    elapsed_ms = int(round((time.perf_counter() - start_time) * 1000))
    model_ver = "GradientBoosting-v1.0"
    if matches and hasattr(matches[0], 'model_version') and matches[0].model_version:
        model_ver = matches[0].model_version

    try:
        log_ml_usage(
            db=db,
            user_id=current_user.id,
            feature="team_matcher",
            model_version=model_ver,
            success=True,
            response_time_ms=elapsed_ms,
            commit=True,
        )
    except Exception:
        pass

    return TeamMatchResponse(matches=matches)
