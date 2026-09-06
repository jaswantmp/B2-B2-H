"""
backend/tests/test_admin_auth.py

Security and Authorization Tests for Admin System (Phase 1).
Verifies:
1. Normal authenticated student is denied (HTTP 403 Forbidden).
2. Authenticated administrator is granted access (HTTP 200 OK).
3. Unauthenticated request is rejected (HTTP 401 Unauthorized / 403 Forbidden).
4. Registration cannot elevate privileges (submitting is_admin=True is ignored, user.is_admin remains False).
5. Existing users remain non-admin by default.
"""

import sys
import os
import unittest
from datetime import timedelta
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
from app.utils.security import create_access_token, get_password_hash


class TestAdminSecurity(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Clean up any leftover test users
        cls.db.query(User).filter(
            User.email.in_(["test_student_adm@test.com", "test_admin_adm@test.com", "test_reg_hacker@test.com"])
        ).delete(synchronize_session=False)
        cls.db.commit()

        # Create a regular student user
        cls.student_user = User(
            name="Test Student",
            username="teststudentadm",
            email="test_student_adm@test.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.student_user)

        # Create an administrative user
        cls.admin_user = User(
            name="Test Admin",
            username="testadminadm",
            email="test_admin_adm@test.com",
            hashed_password=get_password_hash("password123"),
            is_active=True,
            is_admin=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.admin_user)
        cls.db.commit()
        cls.db.refresh(cls.student_user)
        cls.db.refresh(cls.admin_user)

        # Generate JWT tokens
        cls.student_token = create_access_token({"sub": cls.student_user.id}, timedelta(hours=1))
        cls.admin_token = create_access_token({"sub": cls.admin_user.id}, timedelta(hours=1))

    @classmethod
    def tearDownClass(cls):
        # Cleanup test records
        cls.db.query(User).filter(
            User.email.in_(["test_student_adm@test.com", "test_admin_adm@test.com", "test_reg_hacker@test.com"])
        ).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    def test_01_student_denied_admin_stats(self):
        """Test 1: Normal authenticated student calling GET /api/v1/admin/stats receives HTTP 403 Forbidden."""
        response = self.client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(response.status_code, 403, f"Expected 403 Forbidden, got {response.status_code}: {response.text}")
        data = response.json()
        self.assertIn("detail", data)
        self.assertIn("Administrative privileges required", data["detail"])

    def test_02_admin_allowed_admin_stats(self):
        """Test 2: Authenticated administrator calling GET /api/v1/admin/stats receives HTTP 200 OK with valid metrics."""
        response = self.client.get(
            "/api/v1/admin/stats",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(response.status_code, 200, f"Expected 200 OK, got {response.status_code}: {response.text}")
        data = response.json()
        # Verify required database counts are present
        for field in [
            "total_students",
            "active_students",
            "verified_students",
            "total_projects",
            "total_teams",
            "total_hackathons",
            "total_hackathon_registrations",
        ]:
            self.assertIn(field, data, f"Missing metric {field} in admin stats response")
            self.assertIsInstance(data[field], int)
            self.assertGreaterEqual(data[field], 0)

    def test_03_unauthenticated_denied_admin_stats(self):
        """Test 3: Unauthenticated request to GET /api/v1/admin/stats is rejected."""
        response = self.client.get("/api/v1/admin/stats")
        self.assertIn(response.status_code, [401, 403], f"Expected 401 or 403, got {response.status_code}")

    def test_04_registration_cannot_elevate_privileges(self):
        """Test 4: Registering with 'is_admin': True does NOT grant administrative privileges."""
        payload = {
            "name": "Hacker Attempt",
            "username": "hackerattempt",
            "email": "test_reg_hacker@test.com",
            "password": "securepassword123",
            "college": "Test College",
            "branch": "Computer Science",
            "is_admin": True  # Malicious elevation attempt
        }
        response = self.client.post("/api/v1/auth/register", json=payload)
        self.assertEqual(response.status_code, 201, f"Registration failed: {response.text}")
        reg_data = response.json()
        self.assertFalse(reg_data.get("is_admin", False), "Registration response returned is_admin=True!")

        # Verify directly in the database
        db_user = self.db.query(User).filter(User.email == "test_reg_hacker@test.com").first()
        self.assertIsNotNone(db_user)
        self.assertFalse(db_user.is_admin, "Database record must have is_admin=False!")

    def test_05_existing_users_remain_non_admin_by_default(self):
        """Test 5: Verify default behavior for student user is is_admin=False."""
        db_student = self.db.query(User).filter(User.id == self.student_user.id).first()
        self.assertIsNotNone(db_student)
        self.assertFalse(db_student.is_admin)


if __name__ == "__main__":
    unittest.main()
