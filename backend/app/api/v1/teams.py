# app/api/v1/teams.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.team import Team, TeamMember, TeamInvite
from app.models.notification import Notification, NotificationType
from app.schemas.team import TeamCreate, TeamDetailResponse, TeamInviteCreate, TeamInviteResponse
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/teams", tags=["teams"])


@router.post("/", response_model=TeamDetailResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new team for a hackathon, making the current user the leader."""
    team = Team(
        name=team_in.name,
        description=team_in.description,
        hackathon_id=team_in.hackathon_id,
        status=team_in.status,
        leader_id=current_user.id,
    )
    db.add(team)
    db.commit()
    db.refresh(team)

    # Automatically add leader as a member
    member = TeamMember(
        team_id=team.id,
        user_id=current_user.id,
        role="Team Lead",
    )
    db.add(member)
    db.commit()
    db.refresh(team)

    return (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.invites).joinedload(TeamInvite.user),
        )
        .filter(Team.id == team.id)
        .first()
    )


@router.get("/my", response_model=TeamDetailResponse)
def get_my_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetch the team details of the currently authenticated user's active team."""
    # Find any team membership for the current user
    membership = (
        db.query(TeamMember)
        .filter(TeamMember.user_id == current_user.id)
        .first()
    )

    if not membership:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not currently in any team.",
        )

    team = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.invites).joinedload(TeamInvite.user),
        )
        .filter(Team.id == membership.team_id)
        .first()
    )
    return team


@router.post("/invite", response_model=TeamInviteResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    invite_in: TeamInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a builder to join the current user's team."""
    # Find user's led team
    team = db.query(Team).filter(Team.leader_id == current_user.id).first()
    if not team:
        # Fallback: check if user is a member of any team and allow invites
        membership = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You must be part of a team to send invitations.",
            )
        team = db.query(Team).filter(Team.id == membership.team_id).first()

    # Create team invite model
    invite = TeamInvite(
        team_id=team.id,
        user_id=invite_in.user_id,
        role=invite_in.role,
        message=invite_in.message,
        status="pending",
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)

    # Automatically trigger a user notification for the recipient
    notification = Notification(
        recipient_id=invite_in.user_id,
        sender_id=current_user.id,
        type=NotificationType.INVITE,
        message=f"{current_user.name} invited you to join team '{team.name}' as a {invite_in.role}.",
        action="view_invite",
    )
    db.add(notification)
    db.commit()

    return db.query(TeamInvite).options(joinedload(TeamInvite.user)).filter(TeamInvite.id == invite.id).first()


@router.post("/invites/{invite_id}/accept", response_model=TeamDetailResponse)
def accept_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a pending team invitation and become a team member."""
    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id).first()
    if not invite:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    if invite.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to accept this invitation.",
        )

    if invite.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This invitation is already {invite.status}.",
        )

    # Check if user is already in a team
    existing_membership = db.query(TeamMember).filter(TeamMember.user_id == current_user.id, TeamMember.team_id == invite.team_id).first()
    if existing_membership:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already a member of this team.",
        )

    # Accept invite
    invite.status = "accepted"

    # Add as team member
    member = TeamMember(
        team_id=invite.team_id,
        user_id=current_user.id,
        role=invite.role,
    )
    db.add(member)

    # Fetch team to send notification to leader
    team = db.query(Team).filter(Team.id == invite.team_id).first()

    # Notify team leader
    notification = Notification(
        recipient_id=team.leader_id,
        sender_id=current_user.id,
        type=NotificationType.UPDATE,
        message=f"{current_user.name} accepted your invitation to join '{team.name}' as a {invite.role}.",
        action=None,
    )
    db.add(notification)
    db.commit()

    return (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.invites).joinedload(TeamInvite.user),
        )
        .filter(Team.id == invite.team_id)
        .first()
    )
