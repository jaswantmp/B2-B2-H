# backend/app/services/ml_usage_service.py
"""
Service and helper functions for recording ML/AI usage events safely.
Phase 1 Foundation:
- Logs execution metadata for ML/AI services (team_matcher, project_recommendations,
  hackathon_recommendations, team_generator, team_health).
- Uses transaction savepoints to ensure zero interference with caller transactions.
- Never raises exceptions or causes the parent ML/AI request to fail.
- Stores zero prompts, recommendation contents, passwords, tokens, or PII.
"""

import logging
import uuid
from typing import Optional
from sqlalchemy.orm import Session
from app.models.ai import MLUsageEvent

logger = logging.getLogger(__name__)

SUPPORTED_FEATURES = {
    "team_matcher",
    "project_recommendations",
    "hackathon_recommendations",
    "team_generator",
    "team_health",
}


class MLUsageService:
    @classmethod
    def log_usage(
        cls,
        db: Session,
        user_id: str,
        feature: str,
        model_version: Optional[str] = None,
        success: bool = True,
        response_time_ms: Optional[int] = None,
        commit: bool = False,
    ) -> Optional[MLUsageEvent]:
        """
        Record an ML/AI usage event safely using a transaction savepoint.

        Guarantees:
        - NEVER throws an exception to caller.
        - NEVER issues an unrestricted db.rollback() that would discard the caller's transaction.
        - If logging fails, only the savepoint is rolled back; caller's session remains un-aborted.
        - Does NOT store prompts, recommendation contents, passwords, tokens, or PII.
        """
        if not db or not user_id or not feature:
            logger.warning("[ML USAGE] Missing required parameter: db, user_id, or feature.")
            return None

        try:
            # Use begin_nested() to create a SAVEPOINT.
            # If inserting the usage event fails, only this savepoint is rolled back.
            # The parent transaction remains intact.
            with db.begin_nested():
                event = MLUsageEvent(
                    id=str(uuid.uuid4()),
                    user_id=str(user_id),
                    feature=str(feature),
                    model_version=str(model_version) if model_version is not None else None,
                    success=bool(success),
                    response_time_ms=int(response_time_ms) if response_time_ms is not None else None,
                )
                db.add(event)
                db.flush()

            if commit:
                try:
                    db.commit()
                except Exception as commit_err:
                    logger.warning(
                        f"[ML USAGE COMMIT FAILED] user_id={user_id} feature={feature} error={commit_err}",
                        exc_info=False
                    )

            return event
        except Exception as e:
            logger.warning(
                f"[ML USAGE LOGGING FAILED] user_id={user_id} feature={feature} error={e}",
                exc_info=False
            )
            return None


def log_ml_usage(
    db: Session,
    user_id: str,
    feature: str,
    model_version: Optional[str] = None,
    success: bool = True,
    response_time_ms: Optional[int] = None,
    commit: bool = False,
) -> Optional[MLUsageEvent]:
    """
    Convenience function to log an ML/AI usage event safely.
    """
    return MLUsageService.log_usage(
        db=db,
        user_id=user_id,
        feature=feature,
        model_version=model_version,
        success=success,
        response_time_ms=response_time_ms,
        commit=commit,
    )
