"""
backend/tests/test_admin_hackathons.py

Comprehensive test suite for Admin Hackathon Management (Phase 2B).
Verifies:
1. Normal student cannot list hackathons (403).
2. Normal student cannot view hackathon admin details (403).
3. Normal student cannot create hackathon (403).
4. Normal student cannot update hackathon (403).
5. Normal student cannot view hackathon registrations (403).
6. Normal student cannot delete hackathon (403).
7. Unauthenticated client receives 401 Unauthorized.
8. Admin can list hackathons with pagination, search, and filters (200).
9. Admin can create hackathon with valid required fields (201).
10. Admin can update hackathon fields (200).
11. Admin can view hackathon details including registration counts & students (200).
12. Validation rejects invalid date ranges (end_date < date -> 400).
13. Validation rejects missing mandatory fields (422).
14. Safe deletion protects data integrity:
    - Attempting to delete a hackathon with registered students yields 409 Conflict.
    - Deleting a hackathon with 0 registrations & 0 teams succeeds with 200 OK.
15. Existing student registration flow remains functional:
    - Normal student can register for a hackathon.
    - Normal student can withdraw registration.
"""

import sys
import os
import unittest
from datetime import datetime, timedelta, timezone
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
from app.models.hackathon import Hackathon, HackathonRegistration
from app.models.team import Team
from app.utils.security import create_access_token, get_password_hash


class TestAdminHackathons(unittest.TestCase):

    @classmethod
    def _clean_db(cls, db):
        # 1. Clean registrations & teams linked to test hackathons
        test_hacks = db.query(Hackathon).filter(Hackathon.title.like("%[TEST-P2B]%")).all()
        h_ids = [h.id for h in test_hacks]
        if h_ids:
            db.query(HackathonRegistration).filter(HackathonRegistration.hackathon_id.in_(h_ids)).delete(synchronize_session=False)
            db.query(Team).filter(Team.hackathon_id.in_(h_ids)).delete(synchronize_session=False)
            db.query(Hackathon).filter(Hackathon.id.in_(h_ids)).delete(synchronize_session=False)

        # 2. Clean registrations & users
        test_users = db.query(User).filter(User.email.in_([
            "student_p2b@test.com",
            "admin_p2b@test.com"
        ])).all()
        u_ids = [u.id for u in test_users]
        if u_ids:
            db.query(HackathonRegistration).filter(HackathonRegistration.user_id.in_(u_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(u_ids)).delete(synchronize_session=False)
        db.commit()

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls._clean_db(cls.db)

        # 1. Normal Student
        cls.student = User(
            name="Bob Student P2B",
            username="bobstudentp2b",
            email="student_p2b@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="PSG College of Technology",
            university="Anna University",
            branch="Computer Science",
            year="3rd Year",
            is_active=True,
            is_verified=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.student)

        # 2. Admin User
        cls.admin = User(
            name="Admin Officer P2B",
            username="adminp2b",
            email="admin_p2b@test.com",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True,
            is_verified=True,
            is_admin=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.admin)
        cls.db.commit()

        cls.db.refresh(cls.student)
        cls.db.refresh(cls.admin)

        # 3. Create a test hackathon with registrations
        now = datetime.now(timezone.utc)
        cls.test_hackathon_with_reg = Hackathon(
            title="[TEST-P2B] AI Agents Championship",
            organizer="AI Frontier Labs",
            date=now + timedelta(days=10),
            end_date=now + timedelta(days=12),
            location="Bengaluru, Karnataka",
            prize="₹3,00,000",
            team_size="2-4",
            description="Build agentic workflows and computer vision tools.",
            tracks=["AI Agents", "LLMOps"],
            tags=["AI/ML", "Python"],
        )
        cls.db.add(cls.test_hackathon_with_reg)
        cls.db.commit()
        cls.db.refresh(cls.test_hackathon_with_reg)

        # Register the student into this hackathon
        cls.reg = HackathonRegistration(
            hackathon_id=cls.test_hackathon_with_reg.id,
            user_id=cls.student.id,
        )
        cls.db.add(cls.reg)

        # 4. Create an empty test hackathon (0 registrations) for deletion test
        cls.test_hackathon_empty = Hackathon(
            title="[TEST-P2B] Disposable Hackathon",
            organizer="Sandbox Organizer",
            date=now + timedelta(days=20),
            end_date=now + timedelta(days=22),
            location="Online",
            prize="₹50,000",
            team_size="1-3",
            description="Temporary event to verify deletion safety.",
            tracks=["Web"],
            tags=["JavaScript"],
        )
        cls.db.add(cls.test_hackathon_empty)
        cls.db.commit()
        cls.db.refresh(cls.test_hackathon_empty)

        # JWT tokens
        cls.student_token = create_access_token({"sub": cls.student.id}, timedelta(hours=1))
        cls.admin_token = create_access_token({"sub": cls.admin.id}, timedelta(hours=1))

    @classmethod
    def tearDownClass(cls):
        cls._clean_db(cls.db)
        cls.db.close()

    # ── Security Tests (Student Denied: 403) ───────────────────────────────────

    def test_01_student_cannot_list_admin_hackathons(self):
        """Student cannot access GET /api/v1/admin/hackathons -> 403"""
        res = self.client.get(
            "/api/v1/admin/hackathons",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Administrative privileges required", res.json()["detail"])

    def test_02_student_cannot_view_admin_hackathon_detail(self):
        """Student cannot access GET /api/v1/admin/hackathons/{id} -> 403"""
        res = self.client.get(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_03_student_cannot_create_hackathon(self):
        """Student cannot access POST /api/v1/admin/hackathons -> 403"""
        now = datetime.now(timezone.utc)
        payload = {
            "title": "[TEST-P2B] Unauthorized Hackathon",
            "organizer": "Hacker",
            "date": (now + timedelta(days=5)).isoformat(),
            "end_date": (now + timedelta(days=6)).isoformat(),
            "location": "Online",
            "prize": "₹10,000",
            "team_size": "2",
            "description": "Unauthorized submission",
            "tracks": [],
            "tags": []
        }
        res = self.client.post(
            "/api/v1/admin/hackathons",
            json=payload,
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_04_student_cannot_update_hackathon(self):
        """Student cannot access PATCH /api/v1/admin/hackathons/{id} -> 403"""
        res = self.client.patch(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}",
            json={"title": "[TEST-P2B] Defaced Title"},
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_05_student_cannot_view_registrations(self):
        """Student cannot access GET /api/v1/admin/hackathons/{id}/registrations -> 403"""
        res = self.client.get(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}/registrations",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_06_student_cannot_delete_hackathon(self):
        """Student cannot access DELETE /api/v1/admin/hackathons/{id} -> 403"""
        res = self.client.delete(
            f"/api/v1/admin/hackathons/{self.test_hackathon_empty.id}",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_07_unauthenticated_requests_denied(self):
        """Unauthenticated requests yield 401 Unauthorized"""
        res = self.client.get("/api/v1/admin/hackathons")
        self.assertEqual(res.status_code, 401)

    # ── Admin Functionality Tests ─────────────────────────────────────────────

    def test_08_admin_can_list_hackathons(self):
        """Admin can list hackathons with pagination and count aggregation -> 200"""
        res = self.client.get(
            "/api/v1/admin/hackathons?search=Championship",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertGreaterEqual(data["total"], 1)

        found = next((h for h in data["items"] if h["id"] == self.test_hackathon_with_reg.id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found["registration_count"], 1)
        self.assertEqual(found["organizer"], "AI Frontier Labs")

    def test_09_admin_can_view_hackathon_detail(self):
        """Admin can view detailed hackathon with student registrations -> 200"""
        res = self.client.get(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], self.test_hackathon_with_reg.id)
        self.assertEqual(data["registration_count"], 1)
        self.assertEqual(len(data["registrations"]), 1)

        reg_info = data["registrations"][0]
        self.assertEqual(reg_info["student_id"], self.student.id)
        self.assertEqual(reg_info["student_name"], self.student.name)
        self.assertEqual(reg_info["student_email"], self.student.email)
        self.assertEqual(reg_info["college"], self.student.college)
        self.assertNotIn("hashed_password", reg_info)

    def test_10_admin_can_create_hackathon(self):
        """Admin can create a new hackathon with valid required fields -> 201"""
        now = datetime.now(timezone.utc)
        payload = {
            "title": "[TEST-P2B] Admin Created Hackathon",
            "organizer": "National Tech Council",
            "date": (now + timedelta(days=30)).isoformat(),
            "end_date": (now + timedelta(days=32)).isoformat(),
            "location": "Chennai, Tamil Nadu",
            "prize": "₹10,00,000",
            "team_size": "3-5",
            "description": "Premier hackathon focused on sustainable AI and clean energy tech.",
            "tracks": ["CleanTech", "AI Agents"],
            "tags": ["Sustainability", "FastAPI"]
        }
        res = self.client.post(
            "/api/v1/admin/hackathons",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 201)
        data = res.json()
        self.assertEqual(data["title"], payload["title"])
        self.assertEqual(data["registration_count"], 0)
        self.assertEqual(data["tracks"], payload["tracks"])
        self.assertEqual(data["tags"], payload["tags"])

        created_id = data["id"]
        # Verify in database
        hack = self.db.query(Hackathon).filter(Hackathon.id == created_id).first()
        self.assertIsNotNone(hack)
        self.assertEqual(hack.prize, "₹10,00,000")

    def test_11_admin_can_update_hackathon(self):
        """Admin can update an existing hackathon -> 200"""
        update_payload = {
            "title": "[TEST-P2B] AI Agents Championship (Updated)",
            "prize": "₹4,50,000",
            "team_size": "2-5"
        }
        res = self.client.patch(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}",
            json=update_payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["title"], "[TEST-P2B] AI Agents Championship (Updated)")
        self.assertEqual(data["prize"], "₹4,50,000")
        self.assertEqual(data["team_size"], "2-5")

    def test_12_admin_can_view_registrations_endpoint(self):
        """Admin can call dedicated registrations endpoint -> 200"""
        res = self.client.get(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}/registrations",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["student_id"], self.student.id)

    # ── Validation & Integrity Tests ──────────────────────────────────────────

    def test_13_validation_rejects_invalid_date_range(self):
        """Creation or update with end_date < date yields 400 Bad Request"""
        now = datetime.now(timezone.utc)
        payload = {
            "title": "[TEST-P2B] Invalid Date Hackathon",
            "organizer": "Bad Dates Inc",
            "date": (now + timedelta(days=10)).isoformat(),
            "end_date": (now + timedelta(days=5)).isoformat(),  # Earlier!
            "location": "Online",
            "prize": "₹1,000",
            "team_size": "2",
            "description": "Invalid dates",
            "tracks": [],
            "tags": []
        }
        res = self.client.post(
            "/api/v1/admin/hackathons",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("cannot be earlier than start date", res.json()["detail"])

    def test_14_validation_rejects_missing_mandatory_fields(self):
        """Creation missing required title or description yields 422"""
        payload = {
            "organizer": "No Title Inc"
        }
        res = self.client.post(
            "/api/v1/admin/hackathons",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 422)

    # ── Safe Deletion Decision Tests ──────────────────────────────────────────

    def test_15_delete_blocked_when_registrations_exist(self):
        """Safe deletion: Hackathon with active registrations returns 409 Conflict"""
        res = self.client.delete(
            f"/api/v1/admin/hackathons/{self.test_hackathon_with_reg.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 409)
        detail = res.json()["detail"]
        self.assertIn("Cannot delete hackathon", detail)
        self.assertIn("student registration", detail)

    def test_16_delete_succeeds_when_zero_registrations(self):
        """Safe deletion: Hackathon with 0 registrations & 0 teams deletes cleanly -> 200"""
        res = self.client.delete(
            f"/api/v1/admin/hackathons/{self.test_hackathon_empty.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("successfully deleted", res.json()["message"])

        # Confirm deleted in DB
        db_check = self.db.query(Hackathon).filter(Hackathon.id == self.test_hackathon_empty.id).first()
        self.assertIsNone(db_check)

    # ── Regression: Student Registration Flow Remains Functional ──────────────

    def test_17_student_registration_and_withdrawal_still_works(self):
        """Verify normal student registration and withdrawal on public hackathons endpoint"""
        now = datetime.now(timezone.utc)
        # Create an open hackathon
        h = Hackathon(
            title="[TEST-P2B] Open Student Challenge",
            organizer="Community Organizers",
            date=now + timedelta(days=15),
            end_date=now + timedelta(days=17),
            location="Online",
            prize="₹1,00,000",
            team_size="2-4",
            description="Open event for student testing.",
            tracks=["Open"],
            tags=["AI"],
        )
        self.db.add(h)
        self.db.commit()
        self.db.refresh(h)

        # Student registers
        reg_res = self.client.post(
            f"/api/v1/hackathons/{h.id}/register",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertIn(reg_res.status_code, [200, 201])
        self.assertEqual(reg_res.json()["hackathon_id"], h.id)
        self.assertEqual(reg_res.json()["user_id"], self.student.id)

        # Student withdraws
        withdraw_res = self.client.delete(
            f"/api/v1/hackathons/{h.id}/register",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(withdraw_res.status_code, 200)
        self.assertTrue(withdraw_res.json()["success"])


if __name__ == "__main__":
    unittest.main()
