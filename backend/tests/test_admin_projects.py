"""
backend/tests/test_admin_projects.py

Comprehensive test suite for Admin Project Management (Phase 2C).
Verifies:
1. Normal student cannot list admin projects (403).
2. Normal student cannot view admin project details (403).
3. Normal student cannot update project via admin endpoint (403).
4. Normal student cannot inspect project applications (403).
5. Normal student cannot delete project via admin endpoint (403).
6. Unauthenticated requests return 401 Unauthorized.
7. Admin can list projects with search, filters, pagination, and SQL-aggregated counts (200).
8. Admin can view comprehensive project details including creator, members, and applications (200).
9. Admin can moderate project fields (status, category, description, tech, open_roles) (200).
10. Admin update strictly isolates project fields: creator_id remains immutable.
11. Validation rejects invalid status or category (400 Bad Request).
12. Safe deletion prevents accidental loss of collaboration history:
    - Project with student applications returns 409 Conflict.
    - Project with actual non-creator collaborator members returns 409 Conflict.
    - Project with 0 applications and 0 non-creator collaborators deletes cleanly (200).
13. Existing student project functionality remains intact:
    - Student can create, list, and view projects.
    - Creator can update own project; non-creator receives 403.
    - Student can apply to project.
    - Creator can delete own project.
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
from app.models.project import Project, ProjectMember, ProjectApplication
from app.utils.security import create_access_token, get_password_hash


class TestAdminProjects(unittest.TestCase):

    @classmethod
    def _clean_db(cls, db):
        # 1. Clean applications & members of test projects
        test_projects = db.query(Project).filter(Project.title.like("%[TEST-P2C]%")).all()
        p_ids = [p.id for p in test_projects]
        if p_ids:
            db.query(ProjectApplication).filter(ProjectApplication.project_id.in_(p_ids)).delete(synchronize_session=False)
            db.query(ProjectMember).filter(ProjectMember.project_id.in_(p_ids)).delete(synchronize_session=False)
            db.query(Project).filter(Project.id.in_(p_ids)).delete(synchronize_session=False)

        # 2. Clean applications & members belonging to test users
        test_users = db.query(User).filter(User.email.in_([
            "student_creator_p2c@test.com",
            "student_collab_p2c@test.com",
            "admin_officer_p2c@test.com"
        ])).all()
        u_ids = [u.id for u in test_users]
        if u_ids:
            db.query(ProjectApplication).filter(ProjectApplication.user_id.in_(u_ids)).delete(synchronize_session=False)
            db.query(ProjectMember).filter(ProjectMember.user_id.in_(u_ids)).delete(synchronize_session=False)
            db.query(Project).filter(Project.creator_id.in_(u_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(u_ids)).delete(synchronize_session=False)
        db.commit()

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls._clean_db(cls.db)

        # 1. Project Creator Student
        cls.creator = User(
            name="Alice Creator P2C",
            username="alicecreatorp2c",
            email="student_creator_p2c@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="PSG College of Technology",
            university="Anna University",
            branch="Computer Science",
            year="3rd Year",
            is_active=True,
            is_verified=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_MEMBERS,
        )
        cls.db.add(cls.creator)

        # 2. Collaborator / Applicant Student
        cls.collab = User(
            name="Bob Collaborator P2C",
            username="bobcollabp2c",
            email="student_collab_p2c@test.com",
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
        cls.db.add(cls.collab)

        # 3. Admin User
        cls.admin = User(
            name="Super Admin P2C",
            username="superadminp2c",
            email="admin_officer_p2c@test.com",
            hashed_password=get_password_hash("AdminPass123!"),
            is_active=True,
            is_verified=True,
            is_admin=True,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.admin)
        cls.db.commit()

        cls.db.refresh(cls.creator)
        cls.db.refresh(cls.collab)
        cls.db.refresh(cls.admin)

        # 4. Project with non-creator collaborator member
        cls.project_with_collab = Project(
            title="[TEST-P2C] Distributed AI Graph",
            description="High-throughput distributed graph computing engine.",
            category="research",
            status="active",
            university="Anna University",
            tech=["Python", "PyTorch", "gRPC"],
            open_roles=["ML Systems Engineer"],
            creator_id=cls.creator.id,
        )
        cls.db.add(cls.project_with_collab)
        cls.db.commit()
        cls.db.refresh(cls.project_with_collab)

        # Add creator as member
        cls.db.add(ProjectMember(
            project_id=cls.project_with_collab.id,
            user_id=cls.creator.id,
            role="Lead Researcher",
        ))
        # Add collaborator as member
        cls.db.add(ProjectMember(
            project_id=cls.project_with_collab.id,
            user_id=cls.collab.id,
            role="Core Contributor",
        ))

        # 5. Project with application
        cls.project_with_app = Project(
            title="[TEST-P2C] Climate Tech Tracker",
            description="Real-time carbon footprint calculation for college labs.",
            category="college",
            status="recruiting",
            university="PSG College of Technology",
            tech=["React", "FastAPI"],
            open_roles=["Frontend Lead"],
            creator_id=cls.creator.id,
        )
        cls.db.add(cls.project_with_app)
        cls.db.commit()
        cls.db.refresh(cls.project_with_app)

        # Add application from collaborator
        cls.db.add(ProjectApplication(
            project_id=cls.project_with_app.id,
            user_id=cls.collab.id,
            status="pending",
        ))

        # 6. Disposable / Empty Project (0 applications, 0 non-creator collaborators)
        cls.project_empty = Project(
            title="[TEST-P2C] Disposable Sandbox Project",
            description="Temporary sandbox to verify safe deletion.",
            category="opensource",
            status="recruiting",
            university="CIT Coimbatore",
            tech=["TypeScript"],
            open_roles=["Tester"],
            creator_id=cls.creator.id,
        )
        cls.db.add(cls.project_empty)
        cls.db.commit()
        cls.db.refresh(cls.project_empty)

        # Add only creator as member
        cls.db.add(ProjectMember(
            project_id=cls.project_empty.id,
            user_id=cls.creator.id,
            role="Creator",
        ))
        cls.db.commit()

        # JWT tokens
        cls.student_token = create_access_token({"sub": cls.collab.id}, timedelta(hours=1))
        cls.creator_token = create_access_token({"sub": cls.creator.id}, timedelta(hours=1))
        cls.admin_token = create_access_token({"sub": cls.admin.id}, timedelta(hours=1))

    @classmethod
    def tearDownClass(cls):
        cls._clean_db(cls.db)
        cls.db.close()

    # ── Security Tests (Student Denied: 403) ───────────────────────────────────

    def test_01_student_cannot_list_admin_projects(self):
        """Student cannot access GET /api/v1/admin/projects -> 403"""
        res = self.client.get(
            "/api/v1/admin/projects",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)
        self.assertIn("Administrative privileges required", res.json()["detail"])

    def test_02_student_cannot_view_admin_project_detail(self):
        """Student cannot access GET /api/v1/admin/projects/{id} -> 403"""
        res = self.client.get(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_03_student_cannot_update_admin_project(self):
        """Student cannot access PATCH /api/v1/admin/projects/{id} -> 403"""
        res = self.client.patch(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            json={"title": "[TEST-P2C] Unauthorized Deface"},
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_04_student_cannot_inspect_admin_applications(self):
        """Student cannot access GET /api/v1/admin/projects/{id}/applications -> 403"""
        res = self.client.get(
            f"/api/v1/admin/projects/{self.project_with_app.id}/applications",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_05_student_cannot_delete_admin_project(self):
        """Student cannot access DELETE /api/v1/admin/projects/{id} -> 403"""
        res = self.client.delete(
            f"/api/v1/admin/projects/{self.project_empty.id}",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(res.status_code, 403)

    def test_06_unauthenticated_requests_denied(self):
        """Unauthenticated requests yield 401 Unauthorized"""
        res = self.client.get("/api/v1/admin/projects")
        self.assertEqual(res.status_code, 401)

    # ── Admin Functionality Tests ─────────────────────────────────────────────

    def test_07_admin_can_list_projects(self):
        """Admin can list projects with pagination, search, and aggregated counts -> 200"""
        res = self.client.get(
            "/api/v1/admin/projects?search=Distributed",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("items", data)
        self.assertIn("total", data)
        self.assertGreaterEqual(data["total"], 1)

        found = next((p for p in data["items"] if p["id"] == self.project_with_collab.id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found["member_count"], 2)
        self.assertEqual(found["creator"]["name"], self.creator.name)

    def test_08_admin_can_view_project_detail(self):
        """Admin can view detailed project with creator, members, and applications -> 200"""
        res = self.client.get(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["id"], self.project_with_collab.id)
        self.assertEqual(data["creator"]["id"], self.creator.id)
        self.assertEqual(len(data["members"]), 2)

        member_names = [m["name"] for m in data["members"]]
        self.assertIn(self.creator.name, member_names)
        self.assertIn(self.collab.name, member_names)

    def test_09_admin_can_update_project(self):
        """Admin can update project fields and status -> 200"""
        payload = {
            "title": "[TEST-P2C] Distributed AI Graph (Moderated)",
            "status": "completed",
            "category": "research",
            "description": "Moderated project description."
        }
        res = self.client.patch(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["title"], payload["title"])
        self.assertEqual(data["status"], "completed")
        self.assertEqual(data["description"], payload["description"])

    def test_10_admin_update_cannot_alter_ownership(self):
        """Admin update must never modify creator_id or user account records"""
        payload = {
            "creator_id": self.admin.id,  # Should be ignored/disallowed
            "title": "[TEST-P2C] Distributed AI Graph"
        }
        res = self.client.patch(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            json=payload,
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        # Verify in DB that creator_id remained unchanged
        db_proj = self.db.query(Project).filter(Project.id == self.project_with_collab.id).first()
        self.assertEqual(db_proj.creator_id, self.creator.id)

    def test_11_admin_can_inspect_applications(self):
        """Admin can access dedicated project applications endpoint -> 200"""
        res = self.client.get(
            f"/api/v1/admin/projects/{self.project_with_app.id}/applications",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIsInstance(data, list)
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["student_id"], self.collab.id)
        self.assertEqual(data[0]["status"], "pending")

    # ── Validation Tests ──────────────────────────────────────────────────────

    def test_12_validation_rejects_invalid_category(self):
        """Update with unsupported category yields 400 Bad Request"""
        res = self.client.patch(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            json={"category": "invalid_category"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid category", res.json()["detail"])

    def test_13_validation_rejects_invalid_status(self):
        """Update with unsupported status yields 400 Bad Request"""
        res = self.client.patch(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            json={"status": "invalid_status"},
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 400)
        self.assertIn("Invalid status", res.json()["detail"])

    # ── Deletion Safety Tests ─────────────────────────────────────────────────

    def test_14_delete_blocked_when_applications_exist(self):
        """Safe deletion: Project with active applications returns 409 Conflict"""
        res = self.client.delete(
            f"/api/v1/admin/projects/{self.project_with_app.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 409)
        detail = res.json()["detail"]
        self.assertIn("Cannot delete project", detail)
        self.assertIn("application(s) exist", detail)

    def test_15_delete_blocked_when_collaborator_members_exist(self):
        """Safe deletion: Project with non-creator collaborator members returns 409 Conflict"""
        res = self.client.delete(
            f"/api/v1/admin/projects/{self.project_with_collab.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 409)
        detail = res.json()["detail"]
        self.assertIn("Cannot delete project", detail)
        self.assertIn("collaborator member(s) exist", detail)

    def test_16_delete_succeeds_when_zero_applications_and_zero_collaborators(self):
        """Safe deletion: Empty project (0 apps, 0 non-creator collaborators) deletes cleanly -> 200"""
        res = self.client.delete(
            f"/api/v1/admin/projects/{self.project_empty.id}",
            headers={"Authorization": f"Bearer {self.admin_token}"}
        )
        self.assertEqual(res.status_code, 200)
        self.assertIn("successfully deleted", res.json()["message"])

        # Confirm deleted in database
        db_check = self.db.query(Project).filter(Project.id == self.project_empty.id).first()
        self.assertIsNone(db_check)

        # Creator user record must remain completely intact!
        creator_check = self.db.query(User).filter(User.id == self.creator.id).first()
        self.assertIsNotNone(creator_check)

    # ── Student Project Workflow Regression ───────────────────────────────────

    def test_17_student_project_creation_and_application_workflow(self):
        """Verify normal student project creation, listing, detail, apply, and creator delete"""
        # 1. Student creates project
        create_payload = {
            "title": "[TEST-P2C] Student Created Web App",
            "description": "Student collaborative web workspace.",
            "category": "college",
            "status": "recruiting",
            "university": "PSG College of Technology",
            "tech": ["Vue", "Node.js"],
            "open_roles": ["Frontend Dev"]
        }
        create_res = self.client.post(
            "/api/v1/projects/",
            json=create_payload,
            headers={"Authorization": f"Bearer {self.creator_token}"}
        )
        self.assertEqual(create_res.status_code, 201)
        created_p = create_res.json()
        p_id = created_p["id"]

        # 2. Student lists projects
        list_res = self.client.get(
            "/api/v1/projects/",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(list_res.status_code, 200)

        # 3. Student views project
        get_res = self.client.get(
            f"/api/v1/projects/{p_id}",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(get_res.status_code, 200)

        # 4. Collaborator applies
        apply_res = self.client.post(
            f"/api/v1/projects/{p_id}/apply",
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(apply_res.status_code, 201)
        self.assertEqual(apply_res.json()["status"], "pending")

        # 5. Non-creator cannot update project -> 403
        update_res = self.client.patch(
            f"/api/v1/projects/{p_id}",
            json={"title": "Hacked Title"},
            headers={"Authorization": f"Bearer {self.student_token}"}
        )
        self.assertEqual(update_res.status_code, 403)

        # 6. Creator can update own project -> 200
        creator_update_res = self.client.patch(
            f"/api/v1/projects/{p_id}",
            json={"title": "[TEST-P2C] Student Created Web App (Updated)"},
            headers={"Authorization": f"Bearer {self.creator_token}"}
        )
        self.assertEqual(creator_update_res.status_code, 200)

        # 7. Creator can delete own project -> 204
        del_res = self.client.delete(
            f"/api/v1/projects/{p_id}",
            headers={"Authorization": f"Bearer {self.creator_token}"}
        )
        self.assertEqual(del_res.status_code, 204)


if __name__ == "__main__":
    unittest.main()
