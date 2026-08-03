# app/schemas/notification.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator
from app.models.notification import NotificationType
from app.schemas.user import UserResponse


class NotificationBase(BaseModel):
    recipient_id: str
    sender_id: str | None = None
    type: NotificationType
    message: str = Field(..., max_length=500)
    action: str | None = Field(None, max_length=100)
    invite_id: str | None = None
    invite_message: str | None = None


class NotificationCreate(NotificationBase):
    pass


class NotificationUpdate(BaseModel):
    read: bool | None = None


class NotificationResponse(NotificationBase):
    id: str
    read: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


# Detailed response including sender profile info and invite message if available
class NotificationDetailResponse(NotificationResponse):
    sender: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)

    @model_validator(mode="before")
    def populate_invite_message(cls, data):
        if hasattr(data, "invite") and data.invite and hasattr(data.invite, "message"):
            if getattr(data, "invite_message", None) is None:
                try:
                    setattr(data, "invite_message", data.invite.message)
                except Exception:
                    pass
        elif isinstance(data, dict):
            if "invite" in data and isinstance(data["invite"], dict) and "message" in data["invite"]:
                data.setdefault("invite_message", data["invite"]["message"])
        return data
