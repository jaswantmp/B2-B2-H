# app/services/notification_service.py
from sqlalchemy.orm import Session, joinedload
from app.models.notification import Notification, NotificationType


class NotificationService:
    @staticmethod
    def create_notification(
        db: Session,
        recipient_id: str,
        type: NotificationType,
        message: str,
        sender_id: str | None = None,
        action: str | None = None,
    ) -> Notification:
        """Create a new notification record in database."""
        notification = Notification(
            recipient_id=recipient_id,
            sender_id=sender_id,
            type=type,
            message=message,
            action=action,
            read=False,
        )
        db.add(notification)
        db.commit()
        db.refresh(notification)
        return notification

    @staticmethod
    def mark_read(db: Session, notification_id: str, recipient_id: str) -> Notification | None:
        """Mark a notification as read if it belongs to the given recipient."""
        notification = (
            db.query(Notification)
            .filter(
                Notification.id == notification_id,
                Notification.recipient_id == recipient_id,
            )
            .first()
        )
        if notification:
            notification.read = True
            db.add(notification)
            db.commit()
            db.refresh(notification)
        return notification

    @staticmethod
    def list_notifications(db: Session, recipient_id: str) -> list[Notification]:
        """List notifications for a user, sorted by most recent first."""
        return (
            db.query(Notification)
            .options(joinedload(Notification.sender))
            .filter(Notification.recipient_id == recipient_id)
            .order_by(Notification.created_at.desc())
            .all()
        )
