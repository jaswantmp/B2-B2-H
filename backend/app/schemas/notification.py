# app/schemas/notification.py
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from app.models.notification import NotificationType
from app.schemas.user import UserResponse


class NotificationBase(BaseModel):
    recipient_id: str
    sender_id: str | None = None
    type: NotificationType
    message: str = Field(..., max_length=500)
    action: str | None = Field(None, max_length=100)


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


# Detailed response including sender profile info if available
class NotificationDetailResponse(NotificationResponse):
    sender: UserResponse | None = None

    model_config = ConfigDict(from_attributes=True)
