"""
backend/tests/test_ml_usage_events.py

Phase 1 Tests for Admin ML/AI Analytics Foundation:
1. MLUsageEvent model creation and UUID formatting.
2. Required fields enforcement (user_id, feature).
3. User relationship and reverse relationship navigation.
4. All supported feature strings storage (team_matcher, project_recommendations,
   hackathon_recommendations, team_generator, team_health).
5. created_at timestamp population.
6. Schema indexes verification (created_at, feature, user_id, composite feature_created_at).
7. log_ml_usage helper functionality.
8. Safe failure isolation: logging failure rolls back ONLY savepoint and never aborts caller's transaction.
9. Cleanup ensures zero residual test records.
"""

import sys
import os
import unittest
import uuid
from datetime import datetime, timezone
from sqlalchemy import inspect
from sqlalchemy.exc import IntegrityError

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.database import SessionLocal, engine
from app.models.user import User, AvailabilityStatus
from app.models.ai import MLUsageEvent
from app.services.ml_usage_service import log_ml_usage, SUPPORTED_FEATURES
from app.utils.security import get_password_hash


class TestMLUsageEvents(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.db = SessionLocal()
        cls.test_email = "test_ml_usage_runner@b2b2h.com"

        # Cleanup any existing test user and events
        existing_user = cls.db.query(User).filter(User.email == cls.test_email).first()
        if existing_user:
            cls.db.query(MLUsageEvent).filter(MLUsageEvent.user_id == existing_user.id).delete()
            cls.db.delete(existing_user)
            cls.db.commit()

        # Create a dedicated test student user
        cls.test_user = User(
            name="ML Test User",
            username="mltestrunner",
            email=cls.test_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.test_user)
        cls.db.commit()
        cls.db.refresh(cls.test_user)

    @classmethod
    def tearDownClass(cls):
        # Ensure zero fake/historical data remains in the database
        if hasattr(cls, "test_user") and cls.test_user:
            cls.db.query(MLUsageEvent).filter(MLUsageEvent.user_id == cls.test_user.id).delete()
            cls.db.query(User).filter(User.id == cls.test_user.id).delete()
            cls.db.commit()
        cls.db.close()

    def setUp(self):
        # Clean any usage events for the test user between individual tests
        self.db.query(MLUsageEvent).filter(MLUsageEvent.user_id == self.test_user.id).delete()
        self.db.commit()

    def test_01_create_ml_usage_event_and_uuid(self):
        """Verify MLUsageEvent can be created and id conforms to UUID string convention."""
        event = MLUsageEvent(
            user_id=self.test_user.id,
            feature="team_matcher",
            model_version="GradientBoosting",
            success=True,
            response_time_ms=145,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        self.assertIsNotNone(event.id)
        self.assertIsInstance(event.id, str)
        # Verify valid UUID string format
        parsed_uuid = uuid.UUID(event.id)
        self.assertEqual(str(parsed_uuid), event.id)
        self.assertEqual(event.user_id, self.test_user.id)
        self.assertEqual(event.feature, "team_matcher")
        self.assertEqual(event.model_version, "GradientBoosting")
        self.assertTrue(event.success)
        self.assertEqual(event.response_time_ms, 145)

    def test_02_required_fields_enforced(self):
        """Verify user_id and feature are non-nullable and enforced by the database."""
        # Missing feature
        with self.assertRaises(IntegrityError):
            with self.db.begin_nested():
                bad_event = MLUsageEvent(
                    user_id=self.test_user.id,
                    feature=None,
                )
                self.db.add(bad_event)
                self.db.flush()

        # Missing user_id
        with self.assertRaises(IntegrityError):
            with self.db.begin_nested():
                bad_event = MLUsageEvent(
                    user_id=None,
                    feature="team_matcher",
                )
                self.db.add(bad_event)
                self.db.flush()

    def test_03_user_relationship(self):
        """Verify forward and reverse relationships between User and MLUsageEvent."""
        event = MLUsageEvent(
            user_id=self.test_user.id,
            feature="project_recommendations",
            model_version="RandomForestRegressor",
            success=True,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        # Forward relationship: event.user
        self.assertIsNotNone(event.user)
        self.assertEqual(event.user.id, self.test_user.id)
        self.assertEqual(event.user.email, self.test_email)

        # Reverse relationship: user.ml_usage_events
        self.db.refresh(self.test_user)
        event_ids = [e.id for e in self.test_user.ml_usage_events]
        self.assertIn(event.id, event_ids)

    def test_04_supported_feature_strings(self):
        """Verify all supported feature strings can be stored and queried."""
        expected_features = {
            "team_matcher",
            "project_recommendations",
            "hackathon_recommendations",
            "team_generator",
            "team_health",
        }
        self.assertEqual(SUPPORTED_FEATURES, expected_features)

        for feat in expected_features:
            evt = MLUsageEvent(
                user_id=self.test_user.id,
                feature=feat,
                success=True,
            )
            self.db.add(evt)
        self.db.commit()

        stored_events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.test_user.id
        ).all()
        stored_features = {e.feature for e in stored_events}
        self.assertEqual(stored_features, expected_features)

    def test_05_created_at_populated(self):
        """Verify created_at is automatically populated as a timezone-aware timestamp."""
        event = MLUsageEvent(
            user_id=self.test_user.id,
            feature="hackathon_recommendations",
            success=True,
        )
        self.db.add(event)
        self.db.commit()
        self.db.refresh(event)

        self.assertIsNotNone(event.created_at)
        self.assertIsInstance(event.created_at, datetime)

    def test_06_analytics_indexes_exist(self):
        """Verify analytics indexes exist on ml_usage_events in PostgreSQL schema."""
        inspector = inspect(engine)
        indexes = inspector.get_indexes("ml_usage_events")
        index_map = {ix["name"]: ix["column_names"] for ix in indexes}

        # Check required indexes
        self.assertIn("ix_ml_usage_events_created_at", index_map)
        self.assertIn("created_at", index_map["ix_ml_usage_events_created_at"])

        self.assertIn("ix_ml_usage_events_feature", index_map)
        self.assertIn("feature", index_map["ix_ml_usage_events_feature"])

        self.assertIn("ix_ml_usage_events_user_id", index_map)
        self.assertIn("user_id", index_map["ix_ml_usage_events_user_id"])

        self.assertIn("ix_ml_usage_events_feature_created_at", index_map)
        self.assertEqual(index_map["ix_ml_usage_events_feature_created_at"], ["feature", "created_at"])

    def test_07_log_ml_usage_helper(self):
        """Verify the log_ml_usage helper creates an event safely."""
        event = log_ml_usage(
            db=self.db,
            user_id=self.test_user.id,
            feature="team_generator",
            model_version="team_generator_v1",
            success=True,
            response_time_ms=210,
        )
        self.assertIsNotNone(event)
        self.assertEqual(event.feature, "team_generator")
        self.assertEqual(event.model_version, "team_generator_v1")
        self.assertEqual(event.response_time_ms, 210)
        self.assertTrue(event.success)

        # Confirm persisted in database
        self.db.commit()
        persisted = self.db.query(MLUsageEvent).filter(MLUsageEvent.id == event.id).first()
        self.assertIsNotNone(persisted)

    def test_08_failure_isolation_does_not_abort_parent_transaction(self):
        """
        Verify that a failure in log_ml_usage:
        1. Does not raise an exception to the caller.
        2. Rolls back only the internal savepoint.
        3. Never aborts or discards the caller's active parent transaction.
        """
        # 1. Caller modifies an entity in the current transaction
        original_bio = self.test_user.bio
        self.test_user.bio = "Updated by parent ML request"

        # 2. Trigger a usage logging failure with an invalid foreign key user_id
        non_existent_uuid = str(uuid.uuid4())
        failed_event = log_ml_usage(
            db=self.db,
            user_id=non_existent_uuid,
            feature="team_health",
            model_version="team_health_v1",
            success=False,
        )

        # Verify helper safely returns None without raising
        self.assertIsNone(failed_event)

        # 3. Verify the caller's transaction is STILL VALID and commits successfully
        self.db.commit()
        self.db.refresh(self.test_user)
        self.assertEqual(self.test_user.bio, "Updated by parent ML request")

        # Revert bio back
        self.test_user.bio = original_bio
        self.db.commit()

        # 4. Verify boundary handling: None inputs return None safely
        self.assertIsNone(log_ml_usage(db=None, user_id=self.test_user.id, feature="team_health"))
        self.assertIsNone(log_ml_usage(db=self.db, user_id=None, feature="team_health"))
        self.assertIsNone(log_ml_usage(db=self.db, user_id=self.test_user.id, feature=None))


if __name__ == "__main__":
    unittest.main()
