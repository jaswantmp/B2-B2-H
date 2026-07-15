# app/api/v1/hackathons.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.hackathon import Hackathon, HackathonRegistration
from app.schemas.hackathon import HackathonDetailResponse, HackathonRegistrationResponse
from app.dependencies import get_current_user
from app.models.user import User

router = APIRouter(prefix="/hackathons", tags=["hackathons"])


@router.get("/", response_model=list[HackathonDetailResponse])
def list_hackathons(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all hackathons, flagging which ones the current user has registered for."""
    hackathons = db.query(Hackathon).all()

    # Query all hackathon IDs the current user is registered for
    registrations = (
        db.query(HackathonRegistration.hackathon_id)
        .filter(HackathonRegistration.user_id == current_user.id)
        .all()
    )
    registered_ids = {r[0] for r in registrations}

    result = []
    for h in hackathons:
        # Map values to model attributes to build dynamic response schema
        h_detail = HackathonDetailResponse.model_validate(h)
        h_detail.user_registered = h.id in registered_ids
        result.append(h_detail)

    return result


@router.post("/{id}/register", response_model=HackathonRegistrationResponse, status_code=status.HTTP_201_CREATED)
def register_for_hackathon(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Register the currently authenticated user for a hackathon."""
    hackathon = db.query(Hackathon).filter(Hackathon.id == id).first()
    if not hackathon:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Hackathon not found.",
        )

    # Check if already registered
    existing_registration = (
        db.query(HackathonRegistration)
        .filter(
            HackathonRegistration.hackathon_id == id,
            HackathonRegistration.user_id == current_user.id,
        )
        .first()
    )
    if existing_registration:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You are already registered for this hackathon.",
        )

    registration = HackathonRegistration(
        hackathon_id=id,
        user_id=current_user.id,
    )
    db.add(registration)
    db.commit()
    db.refresh(registration)
    return registration


@router.delete("/{id}/register")
def withdraw_from_hackathon(
    id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Withdraw the currently authenticated user from a hackathon."""
    registration = (
        db.query(HackathonRegistration)
        .filter(
            HackathonRegistration.hackathon_id == id,
            HackathonRegistration.user_id == current_user.id,
        )
        .first()
    )
    if not registration:
        return {"success": True, "message": "You were not registered for this hackathon."}

    db.delete(registration)
    db.commit()
    return {"success": True, "message": "Successfully withdrawn from hackathon."}

