# app/models/notification.py
from __future__ import annotations
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from app.models.user import User
import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Boolean, DateTime, ForeignKey, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


class NotificationType(str, enum.Enum):
    INVITE = "invite"
    MATCH = "match"
    UPDATE = "update"
    HACKATHON = "hackathon"
    SYSTEM = "system"
    INVITE_DECLINED = "invite_declined"


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    recipient_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    sender_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
    )
    type: Mapped[NotificationType] = mapped_column(
        SAEnum(NotificationType, name="notificationtype"),
        nullable=False,
    )
    message: Mapped[str] = mapped_column(String(500), nullable=False)
    action: Mapped[str | None] = mapped_column(String(100), nullable=True)  # view_invite, view_matches, view_hackathon, etc.
    invite_id: Mapped[str | None] = mapped_column(
        UUID(as_uuid=False),
        ForeignKey("team_invites.id", ondelete="SET NULL"),
        nullable=True,
    )
    read: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    # Relationships
    recipient: Mapped["User"] = relationship(
        "User", back_populates="notifications", foreign_keys=[recipient_id]
    )
    sender: Mapped["User | None"] = relationship("User", foreign_keys=[sender_id])

    def __repr__(self) -> str:
        return f"<Notification {self.type} to {self.recipient_id}>"
