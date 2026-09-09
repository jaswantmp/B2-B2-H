"""
backend/tests/test_admin_ml_statistics.py

Comprehensive test suite for Admin ML/AI Operational Usage Analytics (Phase 3).
Verifies:
1. Unauthenticated requests return 401 Unauthorized.
2. Non-admin student requests return 403 Forbidden.
3. Admin access returns 200 OK with correct schema.
4. Empty database behavior returns valid zero statistics without division by zero.
5. Overall summary aggregations (total, success, failed, success rate, unique users, avg response time).
6. Feature usage breakdown across all 5 tracked features.
7. Time window aggregations (today, last 7 days, last 30 days).
8. Model version aggregation reflects actual observed model versions.
9. Team Health distribution dynamically computes healthy, moderate, and at-risk counts.
10. Model registry returns production model metadata, and Student Clustering is marked is_tracked=False.
11. Tests strictly clean up all test usage events and fixtures.
"""

import os
import sys
import time
import unittest
from datetime import datetime, timezone, timedelta
from fastapi.testclient import TestClient

backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

project_root = os.path.abspath(os.path.join(backend_path, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.main import app
from app.database import SessionLocal
from app.models.user import User, AvailabilityStatus
from app.models.team import Team, TeamMember
from app.models.ai import MLUsageEvent
from app.utils.security import create_access_token, get_password_hash


class TestAdminMLStatistics(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        for attempt in range(3):
            try:
                cls.db = SessionLocal()
                # Test connection
                cls.db.query(User).first()
                break
            except Exception:
                if attempt == 2:
                    raise
                time.sleep(2)

        cls.student_email = "test_student_stats@b2b2h.com"
        cls.admin_email = "test_admin_stats@b2b2h.com"
        cls.user2_email = "test_user2_stats@b2b2h.com"

        # 1. Clean up any existing test records & ML usage events
        cls.db.query(MLUsageEvent).delete(synchronize_session=False)
        cls.db.commit()
        cls._cleanup_test_data()

        # 2. Create Student User
        cls.student_user = User(
            name="Stats Student",
            username="statsstudent",
            email=cls.student_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.student_user)

        # 3. Create Admin User
        cls.admin_user = User(
            name="Stats Admin",
            username="statsadmin",
            email=cls.admin_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            is_admin=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.admin_user)

        # 4. Create Secondary User (for distinct user count tests)
        cls.user2 = User(
            name="Stats User Two",
            username="statsusertwo",
            email=cls.user2_email,
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_verified=True,
            onboarding_completed=True,
            is_admin=False,
            status=AvailabilityStatus.OPEN_TO_INVITES,
        )
        cls.db.add(cls.user2)
        cls.db.commit()

        cls.db.refresh(cls.student_user)
        cls.db.refresh(cls.admin_user)
        cls.db.refresh(cls.user2)

        # Authentication Tokens
        cls.student_token = create_access_token(data={"sub": cls.student_user.id}, expires_delta=timedelta(hours=1))
        cls.admin_token = create_access_token(data={"sub": cls.admin_user.id}, expires_delta=timedelta(hours=1))

        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    @classmethod
    def _cleanup_test_data(cls):
        emails = [
            "test_student_stats@b2b2h.com",
            "test_admin_stats@b2b2h.com",
            "test_user2_stats@b2b2h.com",
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
        cls.db.query(MLUsageEvent).delete(synchronize_session=False)
        cls.db.commit()
        cls._cleanup_test_data()
        cls.db.close()

    def setUp(self):
        # Clear all usage events before each test to guarantee a clean ml_usage_events table and deterministic isolation
        self.db.query(MLUsageEvent).delete(synchronize_session=False)
        self.db.commit()

    def tearDown(self):
        # Clean all usage events after each test
        self.db.query(MLUsageEvent).delete(synchronize_session=False)
        self.db.commit()

    # ──────────────────────────────────────────────────────────────────────────
    # Authorization Tests
    # ──────────────────────────────────────────────────────────────────────────

    def test_01_unauthenticated_request_rejected(self):
        """Unauthenticated requests must be rejected with 401 Unauthorized."""
        resp = self.client.get("/api/v1/admin/statistics/ml")
        self.assertEqual(resp.status_code, 401)

    def test_02_non_admin_student_rejected(self):
        """Non-admin student must be rejected with 403 Forbidden."""
        resp = self.client.get(
            "/api/v1/admin/statistics/ml",
            headers=self.student_headers,
        )
        self.assertEqual(resp.status_code, 403)

    def test_03_admin_access_allowed(self):
        """Admin user can successfully access the endpoint with 200 OK."""
        resp = self.client.get(
            "/api/v1/admin/statistics/ml",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("overall_summary", data)
        self.assertIn("feature_usage", data)
        self.assertIn("time_windows", data)
        self.assertIn("model_version_analytics", data)
        self.assertIn("team_health_analytics", data)
        self.assertIn("active_models", data)

    # ──────────────────────────────────────────────────────────────────────────
    # Empty Usage Table Behavior
    # ──────────────────────────────────────────────────────────────────────────

    def test_04_empty_database_zero_statistics(self):
        """With 0 usage events, returns valid zero values and no division by zero."""
        resp = self.client.get(
            "/api/v1/admin/statistics/ml",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        overall = data["overall_summary"]
        self.assertEqual(overall["total_requests"], 0)
        self.assertEqual(overall["successful_requests"], 0)
        self.assertEqual(overall["failed_requests"], 0)
        self.assertEqual(overall["success_rate"], 0.0)
        self.assertEqual(overall["unique_users"], 0)
        self.assertIsNone(overall["average_response_time_ms"])

        # All 5 tracked features present with 0s
        features = data["feature_usage"]
        self.assertEqual(len(features), 5)
        feature_names = {f["feature"] for f in features}
        expected_features = {
            "team_matcher",
            "project_recommendations",
            "hackathon_recommendations",
            "team_generator",
            "team_health",
        }
        self.assertEqual(feature_names, expected_features)
        for f in features:
            self.assertEqual(f["total_requests"], 0)
            self.assertEqual(f["success_rate"], 0.0)
            self.assertIsNone(f["average_response_time_ms"])
            self.assertIsNone(f["last_used_at"])

        # Time windows all zero
        windows = data["time_windows"]
        for w_name in ["today", "last_7_days", "last_30_days"]:
            self.assertEqual(windows[w_name]["total_requests"], 0)
            self.assertEqual(windows[w_name]["successful_requests"], 0)
            self.assertEqual(windows[w_name]["failed_requests"], 0)
            self.assertEqual(windows[w_name]["unique_users"], 0)

        # Model version analytics is empty list
        self.assertEqual(data["model_version_analytics"], [])

    # ──────────────────────────────────────────────────────────────────────────
    # Populated Events Aggregation Tests
    # ──────────────────────────────────────────────────────────────────────────

    def test_05_populated_usage_aggregations(self):
        """Verify summary, feature breakdown, time windows, and model version aggregations."""
        now = datetime.now(timezone.utc)
        yesterday = now - timedelta(days=1)
        two_weeks_ago = now - timedelta(days=14)

        # Event 1: student, team_matcher, today, success, 120ms
        e1 = MLUsageEvent(
            user_id=self.student_user.id,
            feature="team_matcher",
            model_version="GradientBoosting-v1.0",
            success=True,
            response_time_ms=120,
            created_at=now,
        )
        # Event 2: student, team_matcher, today, fail, 80ms
        e2 = MLUsageEvent(
            user_id=self.student_user.id,
            feature="team_matcher",
            model_version="GradientBoosting-v1.0",
            success=False,
            response_time_ms=80,
            created_at=now,
        )
        # Event 3: user2, team_generator, yesterday (in 7d window), success, 200ms
        e3 = MLUsageEvent(
            user_id=self.user2.id,
            feature="team_generator",
            model_version="team_generator_v1",
            success=True,
            response_time_ms=200,
            created_at=yesterday,
        )
        # Event 4: student, hackathon_recommendations, 14 days ago (in 30d window), success, 100ms
        e4 = MLUsageEvent(
            user_id=self.student_user.id,
            feature="hackathon_recommendations",
            model_version="hackathon_recommender_v1",
            success=True,
            response_time_ms=100,
            created_at=two_weeks_ago,
        )

        self.db.add_all([e1, e2, e3, e4])
        self.db.commit()

        resp = self.client.get(
            "/api/v1/admin/statistics/ml",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        # Overall summary: 4 total, 3 success, 1 fail, 2 unique users (student and user2)
        overall = data["overall_summary"]
        self.assertEqual(overall["total_requests"], 4)
        self.assertEqual(overall["successful_requests"], 3)
        self.assertEqual(overall["failed_requests"], 1)
        self.assertEqual(overall["unique_users"], 2)
        self.assertEqual(overall["success_rate"], 75.0)
        # Avg response time: (120 + 80 + 200 + 100) / 4 = 125.0
        self.assertAlmostEqual(overall["average_response_time_ms"], 125.0, places=1)

        # Feature usage
        f_map = {f["feature"]: f for f in data["feature_usage"]}
        tm = f_map["team_matcher"]
        self.assertEqual(tm["total_requests"], 2)
        self.assertEqual(tm["successful_requests"], 1)
        self.assertEqual(tm["failed_requests"], 1)
        self.assertEqual(tm["success_rate"], 50.0)
        self.assertEqual(tm["unique_users"], 1)
        self.assertAlmostEqual(tm["average_response_time_ms"], 100.0, places=1)
        self.assertIsNotNone(tm["last_used_at"])

        tg = f_map["team_generator"]
        self.assertEqual(tg["total_requests"], 1)
        self.assertEqual(tg["successful_requests"], 1)
        self.assertEqual(tg["failed_requests"], 0)
        self.assertEqual(tg["unique_users"], 1)

        # Unused features return 0
        pr = f_map["project_recommendations"]
        self.assertEqual(pr["total_requests"], 0)
        self.assertEqual(pr["success_rate"], 0.0)

        # Time Windows
        windows = data["time_windows"]
        # Today: e1 and e2
        self.assertEqual(windows["today"]["total_requests"], 2)
        self.assertEqual(windows["today"]["successful_requests"], 1)
        self.assertEqual(windows["today"]["failed_requests"], 1)
        self.assertEqual(windows["today"]["unique_users"], 1)

        # Last 7 Days: e1, e2, e3 (3 total, 2 unique users)
        self.assertEqual(windows["last_7_days"]["total_requests"], 3)
        self.assertEqual(windows["last_7_days"]["successful_requests"], 2)
        self.assertEqual(windows["last_7_days"]["failed_requests"], 1)
        self.assertEqual(windows["last_7_days"]["unique_users"], 2)

        # Last 30 Days: e1, e2, e3, e4 (4 total, 2 unique users)
        self.assertEqual(windows["last_30_days"]["total_requests"], 4)
        self.assertEqual(windows["last_30_days"]["successful_requests"], 3)
        self.assertEqual(windows["last_30_days"]["failed_requests"], 1)
        self.assertEqual(windows["last_30_days"]["unique_users"], 2)

        # Model Version Analytics
        mv_list = data["model_version_analytics"]
        self.assertGreaterEqual(len(mv_list), 3)
        mv_map = {(m["feature"], m["model_version"]): m for m in mv_list}

        self.assertIn(("team_matcher", "GradientBoosting-v1.0"), mv_map)
        item = mv_map[("team_matcher", "GradientBoosting-v1.0")]
        self.assertEqual(item["request_count"], 2)
        self.assertEqual(item["successful_requests"], 1)
        self.assertEqual(item["failed_requests"], 1)
        self.assertAlmostEqual(item["average_response_time_ms"], 100.0, places=1)

    # ──────────────────────────────────────────────────────────────────────────
    # Team Health Distribution
    # ──────────────────────────────────────────────────────────────────────────

    def test_06_team_health_distribution(self):
        """Team health distribution aggregates existing teams dynamically with thresholds."""
        resp = self.client.get(
            "/api/v1/admin/statistics/ml",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        th = data["team_health_analytics"]
        self.assertIn("total_teams", th)
        self.assertIn("average_health_score", th)
        self.assertIn("healthy_count", th)
        self.assertIn("moderate_count", th)
        self.assertIn("at_risk_count", th)

        # Sum of categorized counts must equal total_teams
        self.assertEqual(
            th["healthy_count"] + th["moderate_count"] + th["at_risk_count"],
            th["total_teams"]
        )
        self.assertGreaterEqual(th["total_teams"], 0)

    # ──────────────────────────────────────────────────────────────────────────
    # Active Model Registry Tests
    # ──────────────────────────────────────────────────────────────────────────

    def test_07_active_model_registry(self):
        """Model registry contains production models and marks student clustering as is_tracked=False."""
        resp = self.client.get(
            "/api/v1/admin/statistics/ml",
            headers=self.admin_headers,
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()

        active = data["active_models"]
        self.assertEqual(len(active), 6)

        reg_map = {m["feature"]: m for m in active}
        self.assertIn("team_matcher", reg_map)
        self.assertTrue(reg_map["team_matcher"]["is_tracked"])
        self.assertEqual(reg_map["team_matcher"]["model_version"], "GradientBoosting-v1.0")

        self.assertIn("project_recommendations", reg_map)
        self.assertTrue(reg_map["project_recommendations"]["is_tracked"])
        self.assertEqual(reg_map["project_recommendations"]["model_version"], "GradientBoosting-v1.0")

        self.assertIn("hackathon_recommendations", reg_map)
        self.assertTrue(reg_map["hackathon_recommendations"]["is_tracked"])
        self.assertEqual(reg_map["hackathon_recommendations"]["model_version"], "hackathon_recommender_v1")

        self.assertIn("team_generator", reg_map)
        self.assertTrue(reg_map["team_generator"]["is_tracked"])
        self.assertEqual(reg_map["team_generator"]["model_version"], "team_generator_v1")

        self.assertIn("team_health", reg_map)
        self.assertTrue(reg_map["team_health"]["is_tracked"])
        self.assertEqual(reg_map["team_health"]["model_version"], "team_health_v1")

        # Student Clustering: exposed in registry but is_tracked is False
        self.assertIn("student_clustering", reg_map)
        self.assertFalse(reg_map["student_clustering"]["is_tracked"])

        # Ensure student_clustering is NOT included in feature_usage
        feature_names = [f["feature"] for f in data["feature_usage"]]
        self.assertNotIn("student_clustering", feature_names)


if __name__ == "__main__":
    unittest.main()
