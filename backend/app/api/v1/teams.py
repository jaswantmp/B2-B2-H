# app/api/v1/teams.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session, joinedload
from app.database import get_db
from app.models.team import Team, TeamMember, TeamInvite
from app.models.notification import Notification, NotificationType
from app.schemas.team import TeamCreate, TeamUpdate, TeamDetailResponse, TeamInviteCreate, TeamInviteResponse, UserTeamInviteResponse, TeamInviteActionResponse
from app.dependencies import get_current_user
from app.models.user import User
from app.services.team_health_service import TeamHealthService

router = APIRouter(prefix="/teams", tags=["teams"])


def _attach_team_health(team: Team, db: Session) -> Team:
    if team:
        health_info = TeamHealthService.get_full_team_health(team, db)
        team.health_scores = health_info.get("health_scores", {})
        team.missing_roles = health_info.get("missing_roles", [])
        team.health_details = health_info.get("health_details", {})
        team.health_score = health_info.get("health_score")
        team.ml_health_score = health_info.get("ml_health_score")
        team.health_status = health_info.get("health_status")
        team.is_ml_powered = health_info.get("is_ml_powered", False)
        team.model_version = health_info.get("model_version")
        team.explainability = health_info.get("explainability", {})
    return team


@router.post("/", response_model=TeamDetailResponse, status_code=status.HTTP_201_CREATED)
def create_team(
    team_in: TeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new team for a hackathon, making the current user the leader."""
    if team_in.max_members < 2 or team_in.max_members > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team size must be between 2 and 10.",
        )

    team = Team(
        name=team_in.name,
        description=team_in.description,
        hackathon_id=team_in.hackathon_id,
        status=team_in.status,
        leader_id=current_user.id,
        max_members=team_in.max_members,
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

    fetched_team = (
        db.query(Team)
        .options(
            joinedload(Team.leader),
            joinedload(Team.members).joinedload(TeamMember.user),
            joinedload(Team.invites).joinedload(TeamInvite.user),
        )
        .filter(Team.id == team.id)
        .first()
    )
    return _attach_team_health(fetched_team, db)


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
    return _attach_team_health(team, db)


@router.post("/invite", response_model=TeamInviteResponse, status_code=status.HTTP_201_CREATED)
def invite_member(
    invite_in: TeamInviteCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Invite a builder to join the current user's team."""
    # 1. Check if inviter belongs to any team
    membership = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You must be part of a team to send invitations. Create a team first.",
        )

    # 2. Check if inviter is the team leader
    team = db.query(Team).filter(Team.id == membership.team_id).first()
    if not team or team.leader_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the team leader can invite members.",
        )

    # A. Inviter cannot invite themselves
    if invite_in.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot invite yourself.",
        )

    # B. Target user not already member
    is_member = db.query(TeamMember).filter(
        TeamMember.team_id == team.id,
        TeamMember.user_id == invite_in.user_id
    ).first()
    if is_member:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already a member of this team.",
        )

    # C. Team not full
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if member_count >= team.max_members:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Team is already full.",
        )

    # D. No pending invite already exists
    pending_invite = db.query(TeamInvite).filter(
        TeamInvite.team_id == team.id,
        TeamInvite.user_id == invite_in.user_id,
        TeamInvite.status == "pending"
    ).first()
    if pending_invite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invitation already sent.",
        )

    # E. Target user not already in another team
    in_other_team = db.query(TeamMember).filter(
        TeamMember.user_id == invite_in.user_id
    ).first()
    if in_other_team:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User already belongs to another team.",
        )

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
        invite_id=invite.id,
    )
    db.add(notification)
    db.commit()

    return db.query(TeamInvite).options(joinedload(TeamInvite.user)).filter(TeamInvite.id == invite.id).first()


@router.get("/invites", response_model=list[UserTeamInviteResponse])
def list_user_invites(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all pending team invitations for the currently authenticated user."""
    invites = (
        db.query(TeamInvite)
        .options(
            joinedload(TeamInvite.team).joinedload(Team.leader)
        )
        .filter(
            TeamInvite.user_id == current_user.id,
            TeamInvite.status == "pending"
        )
        .all()
    )

    return [
        {
            "id": invite.id,
            "team_id": invite.team_id,
            "team_name": invite.team.name,
            "sender_id": invite.team.leader_id,
            "sender_name": invite.team.leader.name,
            "role": invite.role,
            "message": invite.message,
            "status": invite.status,
            "created_at": invite.created_at,
        }
        for invite in invites
    ]


@router.post("/invites/{invite_id}/decline", response_model=TeamInviteActionResponse)
def decline_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Decline a pending team invitation."""
    import logging
    logger = logging.getLogger(__name__)

    invite = db.query(TeamInvite).filter(TeamInvite.id == invite_id).first()
    if not invite:
        logger.warning(f"Decline invite failed: Invite {invite_id} not found.")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Invitation not found.",
        )

    if invite.user_id != current_user.id:
        logger.warning(f"Decline invite failed: User {current_user.id} does not own invite {invite_id}.")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to decline this invitation.",
        )

    if invite.status == "declined":
        logger.info(f"Invite {invite_id} is already declined. Returning success idempotently.")
        return {
            "success": True,
            "status": "declined",
            "message": "Invitation declined"
        }

    if invite.status == "accepted":
        logger.warning(f"Decline invite failed: Invite {invite_id} is already accepted.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot decline an invitation that has already been accepted.",
        )

    if invite.status != "pending":
        logger.warning(f"Decline invite failed: Invite {invite_id} status is {invite.status}.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This invitation is already {invite.status}.",
        )

    try:
        invite.status = "declined"
        db.commit()

        # Create notification for team leader
        team = invite.team
        if team and getattr(team, "leader_id", None):
            # Check duplicate
            dup = db.query(Notification).filter(
                Notification.type == NotificationType.INVITE_DECLINED,
                Notification.invite_id == invite.id
            ).first()
            if not dup:
                notification = Notification(
                    recipient_id=team.leader_id,
                    sender_id=current_user.id,
                    type=NotificationType.INVITE_DECLINED,
                    message=f"{current_user.name} declined your invitation to join team '{team.name}'.",
                    action="view_team",
                    invite_id=invite.id,
                )
                db.add(notification)
                db.commit()
    except Exception as e:
        logger.exception(f"Exception raised while declining invitation {invite_id}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to decline invitation: {str(e)}"
        )

    return {
        "success": True,
        "status": "declined",
        "message": "Invitation declined"
    }



@router.post("/invites/{invite_id}/accept", response_model=TeamInviteActionResponse)
def accept_invite(
    invite_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Accept a pending team invitation and become a team member."""
    invite = db.query(TeamInvite).options(joinedload(TeamInvite.team)).filter(TeamInvite.id == invite_id).first()
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

    # Check if team is full
    team = invite.team
    if team:
        current_members_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if current_members_count >= team.max_members:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This team is already at full capacity.",
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

    # Check if team is now full
    if team and current_members_count + 1 >= team.max_members:
        team.status = "full"

    # Fetch team to send notification to leader
    team = invite.team

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

    return {
        "success": True,
        "status": "accepted",
        "team_id": team.id,
        "team_name": team.name,
    }


@router.patch("/", response_model=TeamDetailResponse)
def update_team(
    team_in: TeamUpdate = Body(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update team details and size configurations."""
    # Find user's led team
    team = db.query(Team).filter(Team.leader_id == current_user.id).first()
    if not team:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="You are not the leader of any team.",
        )

    # Validate team size constraints if max_members is being updated
    if team_in.max_members is not None:
        if team_in.max_members < 2 or team_in.max_members > 10:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team size must be between 2 and 10.",
            )
        
        # Check current member count
        member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
        if team_in.max_members < member_count:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Team size cannot be smaller than the current number of members.",
            )
        
        team.max_members = team_in.max_members

        # Adjust status automatically:
        if member_count >= team.max_members:
            team.status = "full"
        else:
            team.status = "recruiting"

    if team_in.name is not None:
        team.name = team_in.name
    if team_in.description is not None:
        team.description = team_in.description
    if team_in.status is not None:
        team.status = team_in.status

    db.commit()
    db.refresh(team)

    return _attach_team_health(team, db)


@router.delete("/members/leave", status_code=status.HTTP_204_NO_CONTENT)
def leave_team(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Leave the current team."""
    membership = db.query(TeamMember).filter(TeamMember.user_id == current_user.id).first()
    if not membership:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are not currently in any team.",
        )

    team = membership.team
    
    # If the user is the leader, they cannot leave without transferring leadership or deleting the team.
    if team.leader_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="As the team leader, you cannot leave the team. You must delete the team or transfer leadership.",
        )

    db.delete(membership)
    db.commit()

    # Automatically transition status to recruiting if it was full
    member_count = db.query(TeamMember).filter(TeamMember.team_id == team.id).count()
    if member_count < team.max_members:
        team.status = "recruiting"
        db.commit()

    return
