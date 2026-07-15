# app/api/v1/team_match.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.team_match import TeamMatchRequest, TeamMatchResponse
from app.services.team_match_service import TeamMatchService

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
    try:
        matches = await TeamMatchService.get_team_matches(db, request_data.user_id)
        return TeamMatchResponse(matches=matches)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred during team matching: {str(e)}"
        )
