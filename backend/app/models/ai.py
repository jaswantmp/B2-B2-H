# app/models/ai.py
from datetime import datetime, date
from sqlalchemy import String, Integer, DateTime, ForeignKey, UniqueConstraint, Date, JSON
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.database import Base


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
