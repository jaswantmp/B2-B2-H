"""
backend/tests/test_admin_students.py

Comprehensive tests for Admin Student Management (Phase 2A).
Verifies:
1. Normal student cannot list students (403).
2. Normal student cannot view student details (403).
3. Normal student cannot change student status (403).
4. Normal student cannot change verification status (403).
5. Admin can list students with pagination and search filters (200).
6. Admin can view comprehensive student details including relationships (200).
7. Admin can deactivate and reactivate student accounts (200).
8. Admin can update student verification flag (200).
9. Deactivated student cannot authenticate via login endpoint (400).
10. Student update schemas do not permit is_admin modification.
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
from app.models.user import User, Skill, UserSkill, AvailabilityStatus
from app.models.project import Project, ProjectMember
from app.models.team import Team, TeamMember
from app.models.hackathon import Hackathon, HackathonRegistration
from app.utils.security import create_access_token, get_password_hash


class TestAdminStudents(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        # Clean up any leftover test records
        cls.db.query(User).filter(
            User.email.in_([
                "student_target_p2a@test.com",
                "student_normal_p2a@test.com",
                "admin_officer_p2a@test.com"
            ])
        ).delete(synchronize_session=False)
        cls.db.commit()

        # 1. Target student with skills, projects, teams
        cls.target_student = User(
            name="Alice Builder",
            username="alicebuilderp2a",
            email="student_target_p2a@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="PSG College of Technology",
            university="Anna University",
            branch="Computer Science and Engineering",
            year="3rd Year",
            is_active=True,
            is_verified=False,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.target_student)

        # 2. Normal authenticated student
        cls.normal_student = User(
            name="Bob Regular",
            username="bobregularp2a",
            email="student_normal_p2a@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="CIT Coimbatore",
            university="Anna University",
            branch="Information Technology",
            year="2nd Year",
            is_active=True,
            is_verified=False,
            is_admin=False,
            status=AvailabilityStatus.OPEN_TO_INVITES,
        )
        cls.db.add(cls.normal_student)

        # 3. Admin user
        cls.admin_user = User(
            name="Super Admin",
            username="superadminp2a",
            email="admin_officer_p2a@test.com",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True,
            is_verified=True,
            is_admin=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.admin_user)
        cls.db.commit()

        cls.db.refresh(cls.target_student)
        cls.db.refresh(cls.normal_student)
        cls.db.refresh(cls.admin_user)

        # Generate JWT tokens
        cls.student_token = create_access_token({"sub": cls.normal_student.id}, timedelta(hours=1))
        cls.admin_token = create_access_token({"sub": cls.admin_user.id}, timedelta(hours=1))

        # Add a skill to the target student
        skill = cls.db.query(Skill).first()
        if not skill:
            skill = Skill(name="Python", category="Technical")
            cls.db.add(skill)
            cls.db.commit()
            cls.db.refresh(skill)

        user_skill = UserSkill(
            user_id=cls.target_student.id,
            skill_id=skill.id,
            proficiency="advanced",
            is_verified=True,
        )
        cls.db.add(user_skill)
        cls.db.commit()

    @classmethod
    def tearDownClass(cls):
        cls.db.query(User).filter(
            User.email.in_([
                "student_target_p2a@test.com",
                "student_normal_p2a@test.com",
                "admin_officer_p2a@test.com"
            ])
        ).delete(synchronize_session=False)
        cls.db.commit()
        cls.db.close()

    # ── Security Tests (Students Denied) ──────────────────────────────────────
    def test_01_student_cannot_list_students(self):
        """Student cannot list students -> 403 Forbidden"""
        res = self.client.get(
            "/api/v1/admin/students",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Administrative privileges required", res.json()["detail"])

    def test_02_student_cannot_get_student_details(self):
        """Student cannot view student details -> 403 Forbidden"""
        res = self.client.get(
            f"/api/v1/admin/students/{self.target_student.id}",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_03_student_cannot_change_status(self):
        """Student cannot alter account active status -> 403 Forbidden"""
        res = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/status",
            headers={"Authorization": f"Bearer {self.student_token}"},
            json={"is_active": False}
        )
        self.assertEqual(res.status_code, 403)

    def test_04_student_cannot_change_verification(self):
        """Student cannot alter verification status -> 403 Forbidden"""
        res = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/verification",
            headers={"Authorization": f"Bearer {self.student_token}"},
            json={"is_verified": True}
        )
        self.assertEqual(res.status_code, 403)

    # ── Admin Capabilities ────────────────────────────────────────────────────
    def test_05_admin_can_list_students_with_pagination(self):
        """Admin can list students with pagination and query metadata"""
        res = self.client.get(
            "/api/v1/admin/students?page=1&limit=10",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertIn("page", data)
        self.assertIn("limit", data)
        self.assertIn("total_pages", data)
        self.assertEqual(data["page"], 1)
        self.assertEqual(data["limit"], 10)
        self.assertGreaterEqual(data["total"], 2)

        # Check fields of summary item
        item = next((s for s in data["items"] if s["id"] == self.target_student.id), None)
        self.assertIsNotNone(item)
        self.assertEqual(item["email"], "student_target_p2a@test.com")
        self.assertNotIn("hashed_password", item)
        self.assertIn("skills_count", item)

    def test_06_admin_can_filter_students(self):
        """Admin can filter students by search term and college"""
        res = self.client.get(
            "/api/v1/admin/students?search=Alice&college=PSG",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertGreaterEqual(len(data["items"]), 1)
        for s in data["items"]:
            self.assertIn("Alice", s["name"])

    def test_07_admin_can_view_student_details(self):
        """Admin can retrieve full student details including skills, projects, teams, hackathons"""
        res = self.client.get(
            f"/api/v1/admin/students/{self.target_student.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], self.target_student.id)
        self.assertEqual(data["name"], "Alice Builder")
        self.assertIn("skills", data)
        self.assertIn("projects", data)
        self.assertIn("teams", data)
        self.assertIn("hackathons", data)
        self.assertNotIn("hashed_password", data)
        self.assertGreaterEqual(len(data["skills"]), 1)

    def test_08_admin_can_deactivate_and_reactivate_student(self):
        """Admin can deactivate a student, preventing login, and reactivate them"""
        # 1. Deactivate target student
        res_deact = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/status",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"is_active": False}
        )
        self.assertEqual(res_deact.status_code, 200)
        self.assertFalse(res_deact.json()["is_active"])

        # 2. Verify target student CANNOT login while deactivated
        login_res = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "student_target_p2a@test.com",
                "password": "Password123!"
            }
        )
        self.assertEqual(login_res.status_code, 400)
        self.assertIn("deactivated", login_res.json()["detail"].lower())

        # 3. Reactivate target student
        res_react = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/status",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"is_active": True}
        )
        self.assertEqual(res_react.status_code, 200)
        self.assertTrue(res_react.json()["is_active"])

        # 4. Verify target student can login again
        login_res_ok = self.client.post(
            "/api/v1/auth/login",
            json={
                "email": "student_target_p2a@test.com",
                "password": "Password123!"
            }
        )
        self.assertEqual(login_res_ok.status_code, 200)
        self.assertIn("access_token", login_res_ok.json())

    def test_09_admin_can_update_verification(self):
        """Admin can update student verification status"""
        res = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/verification",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"is_verified": True}
        )
        self.assertEqual(res.status_code, 200)
        self.assertTrue(res_res_ver := res.json()["is_verified"])

        # Restore
        res_reset = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/verification",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"is_verified": False}
        )
        self.assertEqual(res_reset.status_code, 200)
        self.assertFalse(res_reset.json()["is_verified"])

    def test_10_status_update_schema_cannot_modify_is_admin(self):
        """Sending is_admin in status or verification update schema is rejected or ignored"""
        res = self.client.patch(
            f"/api/v1/admin/students/{self.target_student.id}/status",
            headers={"Authorization": f"Bearer {self.admin_token}"},
            json={"is_active": True, "is_admin": True}
        )
        self.assertEqual(res.status_code, 200)
        # Verify in DB that is_admin is STILL False
        self.db.expire_all()
        student = self.db.query(User).filter(User.id == self.target_student.id).first()
        self.assertFalse(student.is_admin)


if __name__ == "__main__":
    unittest.main()
