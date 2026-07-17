# app/services/ai_cache_service.py
import json
import hashlib
import logging
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.ai import AICache

logger = logging.getLogger(__name__)

EXPIRY_DAYS = {
    "project_generator": 7,
    "team_matcher": 1,
    "hackathon_recommender": 1
}

class AICacheService:
    @classmethod
    def cleanup_expired_caches(cls, db: Session) -> None:
        """Delete all expired cache records from the database."""
        now = datetime.utcnow()
        try:
            deleted_count = db.query(AICache).filter(AICache.expires_at < now).delete()
            if deleted_count > 0:
                db.commit()
                logger.info(f"Cleaned up {deleted_count} expired AI cache records.")
        except Exception as e:
            db.rollback()
            logger.error(f"Error cleaning up expired AI cache records: {e}")

    @classmethod
    def generate_cache_key(cls, feature_name: str, payload: dict) -> str:
        """Generate a deterministic SHA256 cache key based on feature name and input payload."""
        # Convert list of skills or other objects to standard form (sort lists, sort dictionary keys)
        def clean_payload(obj):
            if isinstance(obj, dict):
                return {k: clean_payload(v) for k, v in sorted(obj.items())}
            elif isinstance(obj, list):
                return sorted([clean_payload(x) for x in obj], key=lambda x: str(x))
            else:
                return str(obj)

        cleaned = clean_payload(payload)
        serialized = json.dumps(cleaned, sort_keys=True)
        hash_val = hashlib.sha256(serialized.encode("utf-8")).hexdigest()
        return f"{feature_name}:{hash_val}"

    @classmethod
    def get_cached_response(cls, db: Session, cache_key: str, user_id: str = "anonymous") -> dict | None:
        """Retrieve cached response if it exists and is not expired."""
        # Clean expired cache records on read
        cls.cleanup_expired_caches(db)

        now = datetime.utcnow()
        cache = db.query(AICache).filter(
            AICache.cache_key == cache_key,
            AICache.expires_at > now
        ).first()

        if cache:
            logger.info(
                f"[CACHE HIT] user_id={user_id} cache_key={cache_key} "
                f"feature_name={cache.feature_name} timestamp={now.isoformat()}"
            )
            return cache.response_json
        
        logger.info(
            f"[CACHE MISS] user_id={user_id} cache_key={cache_key} "
            f"timestamp={now.isoformat()}"
        )
        return None

    @classmethod
    def set_cached_response(cls, db: Session, cache_key: str, feature_name: str, response_json: dict) -> None:
        """Store the response in database cache with expiry offset."""
        # Clean expired cache records on write
        cls.cleanup_expired_caches(db)

        now = datetime.utcnow()
        days_to_expire = EXPIRY_DAYS.get(feature_name, 1)
        expires_at = now + timedelta(days=days_to_expire)

        # Check if record already exists (upsert logic)
        cache = db.query(AICache).filter(AICache.cache_key == cache_key).first()
        if cache:
            cache.response_json = response_json
            cache.expires_at = expires_at
            cache.created_at = now
        else:
            cache = AICache(
                cache_key=cache_key,
                feature_name=feature_name,
                response_json=response_json,
                created_at=now,
                expires_at=expires_at
            )
        
        try:
            db.add(cache)
            db.commit()
            db.refresh(cache)
            logger.info(f"Successfully cached response for key: {cache_key}")
        except Exception as e:
            db.rollback()
            logger.error(f"Error saving to AICache: {e}")
