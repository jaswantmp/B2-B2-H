# app/services/ai_limit_service.py
import logging
from datetime import datetime
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.ai import AIUsage

logger = logging.getLogger(__name__)

LIMITS = {
    "team_matcher": 20,
    "project_generator": 5,
    "hackathon_recommender": 20
}

class AILimitService:
    @classmethod
    def get_usage_for_today(cls, db: Session, user_id: str, feature_name: str) -> AIUsage:
        """Get or create the AIUsage record for today (UTC)."""
        today = datetime.utcnow().date()
        usage = db.query(AIUsage).filter(
            AIUsage.user_id == user_id,
            AIUsage.feature_name == feature_name,
            AIUsage.usage_date == today
        ).first()
        
        if not usage:
            usage = AIUsage(
                user_id=user_id,
                feature_name=feature_name,
                usage_date=today,
                request_count=0
            )
            try:
                db.add(usage)
                db.commit()
                db.refresh(usage)
            except Exception as e:
                db.rollback()
                # Handle potential race conditions from concurrent calls creating the same record
                usage = db.query(AIUsage).filter(
                    AIUsage.user_id == user_id,
                    AIUsage.feature_name == feature_name,
                    AIUsage.usage_date == today
                ).first()
                if not usage:
                    raise e
        return usage

    @classmethod
    def check_limit(cls, db: Session, user_id: str, feature_name: str) -> None:
        """Check if user has reached today's daily limit for the feature."""
        limit = LIMITS.get(feature_name, 20)
        usage = cls.get_usage_for_today(db, user_id, feature_name)
        
        if usage.request_count >= limit:
            logger.warning(
                f"[USAGE LIMIT EXCEEDED] user_id={user_id} feature_name={feature_name} "
                f"usage={usage.request_count}/{limit} timestamp={datetime.utcnow().isoformat()}"
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Daily AI usage limit reached. Please try again tomorrow."
            )

    @classmethod
    def increment_usage(cls, db: Session, user_id: str, feature_name: str) -> None:
        """Increment count for the given user's feature usage today."""
        usage = cls.get_usage_for_today(db, user_id, feature_name)
        usage.request_count += 1
        db.add(usage)
        db.commit()
        db.refresh(usage)
        logger.info(
            f"[USAGE INCREMENTED] user_id={user_id} feature_name={feature_name} "
            f"new_count={usage.request_count} timestamp={datetime.utcnow().isoformat()}"
        )
