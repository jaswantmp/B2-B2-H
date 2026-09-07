# app/models/ai.py
import uuid
from datetime import datetime, date, timezone
from typing import TYPE_CHECKING
from sqlalchemy import (
    String, Integer, Boolean, DateTime, ForeignKey,
    UniqueConstraint, Date, JSON, Index, func, text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base

if TYPE_CHECKING:
    from app.models.user import User


class AIUsage(Base):
    __tablename__ = "ai_usages"
    __table_args__ = (
        UniqueConstraint("user_id", "feature_name", "usage_date", name="uq_user_feature_date"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feature_name: Mapped[str] = mapped_column(String(50), nullable=False)  # team_matcher, project_generator, hackathon_recommender
    usage_date: Mapped[date] = mapped_column(Date, nullable=False)
    request_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime, default=datetime.utcnow, onupdate=datetime.utcnow
    )

    def __repr__(self) -> str:
        return f"<AIUsage user={self.user_id} feature={self.feature_name} count={self.request_count}>"


class AICache(Base):
    __tablename__ = "ai_caches"
    __table_args__ = (
        UniqueConstraint("cache_key", name="uq_cache_key"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    cache_key: Mapped[str] = mapped_column(String(256), unique=True, index=True, nullable=False)
    feature_name: Mapped[str] = mapped_column(String(50), nullable=False)
    response_json: Mapped[dict] = mapped_column(JSON, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    def __repr__(self) -> str:
        return f"<AICache key={self.cache_key} feature={self.feature_name}>"


class MLUsageEvent(Base):
    __tablename__ = "ml_usage_events"
    __table_args__ = (
        Index("ix_ml_usage_events_feature_created_at", "feature", "created_at"),
    )

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        UUID(as_uuid=False), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    feature: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    model_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    success: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True, server_default=text("true"))
    response_time_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        default=lambda: datetime.now(timezone.utc),
        index=True,
    )

    # Relationships
    user: Mapped["User"] = relationship("User", back_populates="ml_usage_events")

    def __repr__(self) -> str:
        return f"<MLUsageEvent id={self.id} user_id={self.user_id} feature={self.feature} success={self.success}>"
