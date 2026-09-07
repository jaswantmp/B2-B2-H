"""
backend/tests/test_ml_instrumentation.py

Phase 2 Tests for ML/AI Usage Instrumentation:
Verifies production instrumentation across all 5 features:
1. team_matcher (POST /api/v1/ai/team-match)
2. project_recommendations (GET /api/v1/ai/project-recommendations)
3. hackathon_recommendations (GET /api/v1/ai/hackathon-recommendations)
4. team_generator (POST /api/v1/ai/team-generator)
5. team_health (GET /api/v1/admin/teams/{id} and GET /api/v1/admin/teams/{id}/health)
6. Read-only GET persistence verification
7. Failure logging records success=False
8. Logging failure isolation (endpoint still succeeds)
9. Strict cleanup ensures 0 residual test analytics
"""

import sys
import os
import unittest
from datetime import datetime, timezone, timedelta
from unittest.mock import patch
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

from app.main import app
from app.database import SessionLocal
from app.models.user import User, AvailabilityStatus
from app.models.team import Team, TeamMember
from app.models.ai import MLUsageEvent
from app.utils.security import create_access_token, get_password_hash


class TestMLInstrumentation(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls.student_email = "test_student_inst@b2b2h.com"
        cls.candidate_email = "test_candidate_inst@b2b2h.com"
        cls.admin_email = "test_admin_inst@b2b2h.com"

        # 1. Clean up existing test users/teams/events
        cls._cleanup_test_data()

        # 2. Create student user
        cls.student_user = User(
            name="Instrumentation Student",
            username="inststudent",
            email=cls.student_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.student_user)

        # 3. Create candidate user for team matcher
        cls.candidate_user = User(
            name="Instrumentation Candidate",
            username="instcandidate",
            email=cls.candidate_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            is_admin=False,
            status=AvailabilityStatus.OPEN_TO_INVITES,
        )
        cls.db.add(cls.candidate_user)

        # 4. Create admin user
        cls.admin_user = User(
            name="Instrumentation Admin",
            username="instadmin",
            email=cls.admin_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            is_admin=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.admin_user)
        cls.db.commit()

        cls.db.refresh(cls.student_user)
        cls.db.refresh(cls.candidate_user)
        cls.db.refresh(cls.admin_user)

        # 5. Create a test team for team health
        cls.test_team = Team(
            name="Instrumentation Test Team",
            description="Testing ML team health instrumentation",
            leader_id=cls.admin_user.id,
            max_members=4,
            status="recruiting",
        )
        cls.db.add(cls.test_team)
        cls.db.commit()
        cls.db.refresh(cls.test_team)

        # Add leader as member
        cls.team_member = TeamMember(
            team_id=cls.test_team.id,
            user_id=cls.admin_user.id,
            role="Leader",
        )
        cls.db.add(cls.team_member)
        cls.db.commit()

        # Tokens
        cls.student_token = create_access_token(data={"sub": cls.student_user.id}, expires_delta=timedelta(hours=1))
        cls.admin_token = create_access_token(data={"sub": cls.admin_user.id}, expires_delta=timedelta(hours=1))

        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    @classmethod
    def _cleanup_test_data(cls):
        # 1. Clean test teams by name pattern
        test_teams = cls.db.query(Team).filter(
            Team.name.in_(["Instrumentation Test Team", "Instrumentation AI Team"])
        ).all()
        team_ids = [t.id for t in test_teams]
        if team_ids:
            cls.db.query(TeamMember).filter(TeamMember.team_id.in_(team_ids)).delete(synchronize_session=False)
            cls.db.query(Team).filter(Team.id.in_(team_ids)).delete(synchronize_session=False)

        # 2. Clean users and referenced records
        emails = [
            "test_student_inst@b2b2h.com",
            "test_candidate_inst@b2b2h.com",
            "test_admin_inst@b2b2h.com",
        ]
        users = cls.db.query(User).filter(User.email.in_(emails)).all()
        user_ids = [u.id for u in users]
        if user_ids:
            cls.db.query(MLUsageEvent).filter(MLUsageEvent.user_id.in_(user_ids)).delete(synchronize_session=False)
            led_teams = cls.db.query(Team).filter(Team.leader_id.in_(user_ids)).all()
            led_ids = [lt.id for lt in led_teams]
            if led_ids:
                cls.db.query(TeamMember).filter(TeamMember.team_id.in_(led_ids)).delete(synchronize_session=False)
                cls.db.query(Team).filter(Team.id.in_(led_ids)).delete(synchronize_session=False)

            cls.db.query(TeamMember).filter(TeamMember.user_id.in_(user_ids)).delete(synchronize_session=False)
            cls.db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls._cleanup_test_data()
        cls.db.close()

    def setUp(self):
        # Clear usage events for our test users before each test
        user_ids = [self.student_user.id, self.candidate_user.id, self.admin_user.id]
        self.db.query(MLUsageEvent).filter(MLUsageEvent.user_id.in_(user_ids)).delete(synchronize_session=False)
        self.db.commit()

    def test_01_team_matcher_instrumentation(self):
        """Verify POST /api/v1/ai/team-match records a team_matcher event."""
        resp = self.client.post(
            "/api/v1/ai/team-match",
            json={"user_id": self.student_user.id},
            headers=self.student_headers,
        )
        self.assertEqual(resp.status_code, 200)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.student_user.id,
            MLUsageEvent.feature == "team_matcher"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "team_matcher")
        self.assertTrue(evt.success)
        self.assertIsNotNone(evt.model_version)
        self.assertIn("GradientBoosting", evt.model_version)
        self.assertIsNotNone(evt.response_time_ms)
        self.assertGreaterEqual(evt.response_time_ms, 0)

    def test_02_project_recommendations_instrumentation(self):
        """Verify GET /api/v1/ai/project-recommendations persists a project_recommendations event."""
        resp = self.client.get(
            "/api/v1/ai/project-recommendations",
            headers=self.student_headers,
        )
        self.assertEqual(resp.status_code, 200)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.student_user.id,
            MLUsageEvent.feature == "project_recommendations"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "project_recommendations")
        self.assertTrue(evt.success)
        self.assertIsNotNone(evt.model_version)
        self.assertIsNotNone(evt.response_time_ms)
        self.assertGreaterEqual(evt.response_time_ms, 0)

    def test_03_hackathon_recommendations_instrumentation(self):
        """Verify GET /api/v1/ai/hackathon-recommendations persists a hackathon_recommendations event."""
        resp = self.client.get(
            "/api/v1/ai/hackathon-recommendations",
            headers=self.student_headers,
        )
        self.assertEqual(resp.status_code, 200)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.student_user.id,
            MLUsageEvent.feature == "hackathon_recommendations"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "hackathon_recommendations")
        self.assertTrue(evt.success)
        self.assertEqual(evt.model_version, "hackathon_recommender_v1")
        self.assertIsNotNone(evt.response_time_ms)
        self.assertGreaterEqual(evt.response_time_ms, 0)

    def test_04_team_generator_instrumentation(self):
        """Verify POST /api/v1/ai/team-generator records a team_generator event."""
        resp = self.client.post(
            "/api/v1/ai/team-generator",
            json={
                "idea": "Build a smart health monitor with IoT",
                "team_size": 3,
                "must_have_skills": ["Python", "React"]
            },
            headers=self.student_headers,
        )
        self.assertEqual(resp.status_code, 200)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.student_user.id,
            MLUsageEvent.feature == "team_generator"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "team_generator")
        self.assertTrue(evt.success)
        self.assertEqual(evt.model_version, "team_generator_v1")
        self.assertIsNotNone(evt.response_time_ms)
        self.assertGreaterEqual(evt.response_time_ms, 0)

    def test_05_team_health_instrumentation_via_admin_team_detail(self):
        """Verify GET /api/v1/admin/teams/{id} calculates team health and logs usage."""
        resp = self.client.get(
            f"/api/v1/admin/teams/{self.test_team.id}",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("health_scores", data)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.admin_user.id,
            MLUsageEvent.feature == "team_health"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "team_health")
        self.assertTrue(evt.success)
        self.assertEqual(evt.model_version, "team_health_v1")
        self.assertIsNotNone(evt.response_time_ms)
        self.assertGreaterEqual(evt.response_time_ms, 0)

    def test_06_team_health_dedicated_endpoint(self):
        """Verify GET /api/v1/admin/teams/{id}/health logs team_health event."""
        resp = self.client.get(
            f"/api/v1/admin/teams/{self.test_team.id}/health",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("health_scores", data)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.admin_user.id,
            MLUsageEvent.feature == "team_health"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "team_health")
        self.assertTrue(evt.success)
        self.assertEqual(evt.model_version, "team_health_v1")

    def test_07_failure_logging_records_success_false(self):
        """Verify that when an ML operation fails, success=False is recorded."""
        # Call team match with non-existent candidate user id causing service error
        with patch("app.services.team_match_service.TeamMatchService.get_team_matches", side_effect=ValueError("Simulated ML engine crash")):
            resp = self.client.post(
                "/api/v1/ai/team-match",
                json={"user_id": self.student_user.id},
                headers=self.student_headers,
            )
            # Original endpoint error behavior preserved (HTTP 500)
            self.assertEqual(resp.status_code, 500)

        events = self.db.query(MLUsageEvent).filter(
            MLUsageEvent.user_id == self.student_user.id,
            MLUsageEvent.feature == "team_matcher"
        ).all()
        self.assertEqual(len(events), 1)
        evt = events[0]
        self.assertEqual(evt.feature, "team_matcher")
        self.assertFalse(evt.success)

    def test_08_logging_failure_does_not_break_endpoint(self):
        """Verify that if log_ml_usage itself fails, the endpoint still succeeds with 200 OK."""
        with patch("app.services.ml_usage_service.MLUsageService.log_usage", side_effect=Exception("Database logger network error")):
            resp = self.client.post(
                "/api/v1/ai/team-generator",
                json={
                    "idea": "Autonomous drone navigation",
                    "team_size": 3,
                    "must_have_skills": ["Python"]
                },
                headers=self.student_headers,
            )
            # Endpoint must succeed cleanly despite logger failure
            self.assertEqual(resp.status_code, 200)
            data = resp.json()
            self.assertIn("suggestedBuilders", data)
            self.assertIn("roles", data)


if __name__ == "__main__":
    unittest.main()
