# app/api/v1/notifications.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload, selectinload
from app.database import get_db
from app.models.notification import Notification
from app.schemas.notification import NotificationDetailResponse, NotificationResponse
from app.dependencies import get_current_user
from app.models.user import User, UserSkill

router = APIRouter(prefix="/notifications", tags=["notifications"])


@router.get("/", response_model=list[NotificationDetailResponse])
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieve all notifications for the currently authenticated user."""
    notifications = (
        db.query(Notification)
        .options(
            joinedload(Notification.sender).selectinload(User.user_skills).joinedload(UserSkill.skill),
            joinedload(Notification.invite),
        )
        .filter(Notification.recipient_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .all()
    )
    return notifications


@router.patch("/{id}/read", response_model=NotificationResponse)
def mark_notification_as_read(
    id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Mark a specific notification as read."""
    notification = (
        db.query(Notification)
        .filter(Notification.id == id, Notification.recipient_id == current_user.id)
        .first()
    )

    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found.",
        )

    notification.read = True
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification
