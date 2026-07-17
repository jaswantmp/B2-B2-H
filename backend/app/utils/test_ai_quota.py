# app/utils/test_ai_quota.py
import sys
import unittest
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.models.ai import AIUsage, AICache
from app.services.ai_limit_service import AILimitService, LIMITS
from app.services.ai_cache_service import AICacheService
from app.services.ai_service import AIService
from app.schemas.ai import ProjectIdeaRequest


class TestAIQuotaAndCaching(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Fetch one of our seeded demo users
        self.user = self.db.query(User).filter(User.username == "jaswant").first()
        if not self.user:
            self.user = self.db.query(User).first()
        assert self.user is not None, "A test user must exist in the database."
        
        # Clear existing usages and caches for tests
        self.db.query(AIUsage).filter(AIUsage.user_id == self.user.id).delete()
        self.db.query(AICache).delete()
        self.db.commit()

    def tearDown(self):
        self.db.query(AIUsage).filter(AIUsage.user_id == self.user.id).delete()
        self.db.query(AICache).delete()
        self.db.commit()
        self.db.close()

    def test_daily_limits(self):
        print("Testing daily usage limits...")
        user_id = self.user.id
        feature = "project_generator"
        limit = LIMITS[feature] # Should be 5

        # Check we can increment up to limit
        for i in range(limit):
            AILimitService.check_limit(self.db, user_id, feature)
            AILimitService.increment_usage(self.db, user_id, feature)

        # The (limit + 1)th check should raise HTTPException 429
        from fastapi import HTTPException
        with self.assertRaises(HTTPException) as context:
            AILimitService.check_limit(self.db, user_id, feature)
        
        self.assertEqual(context.exception.status_code, 429)
        self.assertIn("Daily AI usage limit reached", context.exception.detail)
        print("Daily limits verified successfully.")

    def test_deterministic_caching(self):
        print("Testing deterministic cache keys...")
        payload_1 = {
            "domain": "AI",
            "category": "Healthcare",
            "difficulty": "Intermediate",
            "skills": ["Python", "React"]
        }
        # Scrambled key order and list order
        payload_2 = {
            "difficulty": "Intermediate",
            "category": "Healthcare",
            "domain": "AI",
            "skills": ["React", "Python"]
        }

        key_1 = AICacheService.generate_cache_key("project_generator", payload_1)
        key_2 = AICacheService.generate_cache_key("project_generator", payload_2)

        self.assertEqual(key_1, key_2)
        print(f"Generated cache key: {key_1}")
        print("Deterministic caching verified successfully.")

    def test_cache_expiry_and_cleanup(self):
        print("Testing cache expiration and auto-cleanup...")
        key = "test_feature:expiry_key"
        feature = "project_generator"
        response = {"hello": "world"}
        
        # Set cache
        AICacheService.set_cached_response(self.db, key, feature, response)
        
        # Verify it exists and is hit
        hit = AICacheService.get_cached_response(self.db, key)
        self.assertEqual(hit, response)
        
        # Artificially expire the cache record in the DB
        expired_time = datetime.utcnow() - timedelta(hours=1)
        cache_record = self.db.query(AICache).filter(AICache.cache_key == key).first()
        cache_record.expires_at = expired_time
        self.db.commit()
        
        # Verify it results in a cache miss and gets cleaned up automatically
        miss = AICacheService.get_cached_response(self.db, key)
        self.assertIsNone(miss)
        
        # Verify the record is completely deleted from the database
        deleted_record = self.db.query(AICache).filter(AICache.cache_key == key).first()
        self.assertIsNone(deleted_record)
        print("Cache expiry and automatic cleanup verified successfully.")


def run_tests():
    suite = unittest.TestLoader().loadTestsFromTestCase(TestAIQuotaAndCaching)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    if not result.wasSuccessful():
        sys.exit(1)


if __name__ == "__main__":
    run_tests()
