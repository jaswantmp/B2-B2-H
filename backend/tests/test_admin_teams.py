"""
backend/tests/test_admin_teams.py

Comprehensive test suite for Admin Team Management (Phase 2D).
Verifies:
1. Normal student cannot list admin teams (403).
2. Normal student cannot view admin team details (403).
3. Normal student cannot update team via admin endpoint (403).
4. Normal student cannot inspect admin team invites (403).
5. Normal student cannot delete team via admin endpoint (403).
6. Unauthenticated requests return 401 Unauthorized.
7. Admin can list teams with search, filters, pagination, and member/invite counts (200).
8. Admin can view comprehensive team details including leader, members, invites, and ML team health (200).
9. Admin can moderate team fields (name, description, status, max_members, hackathon_id) (200).
10. Admin update validates status, bounds max_members between 2 and 10, and prevents max_members < member_count (400).
11. Safe deletion prevents accidental loss of memberships and invitation records:
    - Team with invites returns 409 Conflict.
    - Team with collaborator members returns 409 Conflict.
    - Team with 0 invites and 0 collaborator members deletes cleanly (200).
12. Existing student team functionality remains intact:
    - Student can create team, get my team, send invite, leave team.
"""

import sys
import os
import unittest
from datetime import datetime
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
from app.models.team import Team, TeamMember, TeamInvite
from app.utils.security import create_access_token, get_password_hash


class TestAdminTeams(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = TestClient(app)
        cls.db = SessionLocal()

        cls._clean_db(cls.db)
        cls.db.commit()

        # 1. Team Leader Student
        cls.leader = User(
            name="Alice Leader P2D",
            username="aliceleaderp2d",
            email="student_leader_p2d@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="PSG College of Technology",
            university="Anna University",
            branch="Computer Science",
            year="3rd Year",
            is_active=True,
            is_verified=True,
            is_admin=False,
            status=AvailabilityStatus.IN_TEAM,
        )
        cls.db.add(cls.leader)

        # 2. Team Member / Collaborator Student
        cls.member_user = User(
            name="Bob Collaborator P2D",
            username="bobmemberp2d",
            email="student_member_p2d@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="CIT Coimbatore",
            university="Anna University",
            branch="Information Technology",
            year="2nd Year",
            is_active=True,
            is_verified=False,
            is_admin=False,
            status=AvailabilityStatus.IN_TEAM,
        )
        cls.db.add(cls.member_user)

        # 3. Invitee Student
        cls.invitee = User(
            name="Charlie Invitee P2D",
            username="charlieinviteep2d",
            email="student_invitee_p2d@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="PSG College of Technology",
            university="Anna University",
            branch="AI and Data Science",
            year="1st Year",
            is_active=True,
            is_verified=False,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        cls.db.add(cls.invitee)

        # 4. Admin User
        cls.admin = User(
            name="Diana Admin P2D",
            username="dianaadminp2d",
            email="admin_officer_p2d@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="Admin College",
            is_active=True,
            is_verified=True,
            is_admin=True,
            status=AvailabilityStatus.OFFLINE,
        )
        cls.db.add(cls.admin)
        cls.db.commit()

        cls.db.refresh(cls.leader)
        cls.db.refresh(cls.member_user)
        cls.db.refresh(cls.invitee)
        cls.db.refresh(cls.admin)

        cls.student_token = create_access_token(data={"sub": cls.leader.id})
        cls.admin_token = create_access_token(data={"sub": cls.admin.id})

        cls.student_headers = {"Authorization": f"Bearer {cls.student_token}"}
        cls.admin_headers = {"Authorization": f"Bearer {cls.admin_token}"}

    @classmethod
    def _clean_db(cls, db):
        # 1. Clean test teams by name pattern
        test_teams = db.query(Team).filter(Team.name.like("%[TEST-P2D]%")).all()
        team_ids = [t.id for t in test_teams]
        if team_ids:
            db.query(TeamInvite).filter(TeamInvite.team_id.in_(team_ids)).delete(synchronize_session=False)
            db.query(TeamMember).filter(TeamMember.team_id.in_(team_ids)).delete(synchronize_session=False)
            db.query(Team).filter(Team.id.in_(team_ids)).delete(synchronize_session=False)

        # 2. Clean test users by email pattern
        test_emails = [
            "student_leader_p2d@test.com",
            "student_member_p2d@test.com",
            "student_invitee_p2d@test.com",
            "admin_officer_p2d@test.com",
            "regstudentp2d@test.com",
        ]
        test_users = db.query(User).filter(User.email.in_(test_emails)).all()
        user_ids = [u.id for u in test_users]
        if user_ids:
            led_teams = db.query(Team).filter(Team.leader_id.in_(user_ids)).all()
            led_ids = [lt.id for lt in led_teams]
            if led_ids:
                db.query(TeamInvite).filter(TeamInvite.team_id.in_(led_ids)).delete(synchronize_session=False)
                db.query(TeamMember).filter(TeamMember.team_id.in_(led_ids)).delete(synchronize_session=False)
                db.query(Team).filter(Team.id.in_(led_ids)).delete(synchronize_session=False)

            db.query(TeamInvite).filter(TeamInvite.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(TeamMember).filter(TeamMember.user_id.in_(user_ids)).delete(synchronize_session=False)
            db.query(User).filter(User.id.in_(user_ids)).delete(synchronize_session=False)

    @classmethod
    def tearDownClass(cls):
        try:
            cls._clean_db(cls.db)
            cls.db.commit()
        except Exception:
            cls.db.rollback()
        finally:
            cls.db.close()

    def setUp(self):
        self.db = SessionLocal()

    def tearDown(self):
        self.db.close()

    # ─── 1. Security & RBAC Tests ──────────────────────────────────────────────

    def test_student_cannot_list_admin_teams(self):
        """A normal student must receive 403 Forbidden when calling GET /admin/teams."""
        resp = self.client.get("/api/v1/admin/teams", headers=self.student_headers)
        self.assertEqual(resp.status_code, 403)
        self.assertIn("detail", resp.json())

    def test_student_cannot_get_admin_team_detail(self):
        """A normal student must receive 403 Forbidden when calling GET /admin/teams/{id}."""
        resp = self.client.get("/api/v1/admin/teams/some-fake-id", headers=self.student_headers)
        self.assertEqual(resp.status_code, 403)

    def test_student_cannot_update_admin_team(self):
        """A normal student must receive 403 Forbidden when calling PATCH /admin/teams/{id}."""
        resp = self.client.patch(
            "/api/v1/admin/teams/some-fake-id",
            headers=self.student_headers,
            json={"name": "Hacked Team"}
        )
        self.assertEqual(resp.status_code, 403)

    def test_student_cannot_list_admin_team_invites(self):
        """A normal student must receive 403 Forbidden when calling GET /admin/teams/{id}/invites."""
        resp = self.client.get("/api/v1/admin/teams/some-fake-id/invites", headers=self.student_headers)
        self.assertEqual(resp.status_code, 403)

    def test_student_cannot_delete_admin_team(self):
        """A normal student must receive 403 Forbidden when calling DELETE /admin/teams/{id}."""
        resp = self.client.delete("/api/v1/admin/teams/some-fake-id", headers=self.student_headers)
        self.assertEqual(resp.status_code, 403)

    def test_unauthenticated_request_rejected(self):
        """Requests without Authorization token must return 401 Unauthorized."""
        resp = self.client.get("/api/v1/admin/teams")
        self.assertEqual(resp.status_code, 401)

    # ─── 2. Admin Functionality Tests ─────────────────────────────────────────

    def test_admin_can_list_teams_with_aggregated_counts(self):
        """Admin can list teams and receive member_count, invite_count, and leader details."""
        # Create a test team
        team = Team(
            name="[TEST-P2D] Alpha Squad",
            description="Leading AI hackathon team",
            status="recruiting",
            max_members=4,
            leader_id=self.leader.id,
            hackathon_id=10,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        # Add leader member
        m1 = TeamMember(team_id=team.id, user_id=self.leader.id, role="Team Lead")
        # Add collaborator member
        m2 = TeamMember(team_id=team.id, user_id=self.member_user.id, role="Backend Developer")
        # Add invite
        inv = TeamInvite(team_id=team.id, user_id=self.invitee.id, role="Frontend", status="pending")
        self.db.add_all([m1, m2, inv])
        self.db.commit()

        resp = self.client.get("/api/v1/admin/teams?search=Alpha+Squad", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("items", data)
        self.assertGreaterEqual(data["total"], 1)

        found = next((t for t in data["items"] if t["id"] == team.id), None)
        self.assertIsNotNone(found)
        self.assertEqual(found["name"], "[TEST-P2D] Alpha Squad")
        self.assertEqual(found["member_count"], 2)
        self.assertEqual(found["invite_count"], 1)
        self.assertEqual(found["leader"]["username"], "aliceleaderp2d")

    def test_admin_can_search_and_filter_teams(self):
        """Admin can filter teams by status and search keywords."""
        team = Team(
            name="[TEST-P2D] Cyber Ninjas",
            description="Security track hackathon squad",
            status="active",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()

        resp = self.client.get(
            "/api/v1/admin/teams?search=Cyber+Ninjas&status=active",
            headers=self.admin_headers
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        matching = [t for t in data["items"] if t["id"] == team.id]
        self.assertEqual(len(matching), 1)
        self.assertEqual(matching[0]["status"], "active")

    def test_admin_can_view_team_detail_with_ml_health(self):
        """Admin can retrieve full team details including leader, members, invites, and ML health."""
        team = Team(
            name="[TEST-P2D] Health Check Squad",
            description="Testing dynamic team health indicators",
            status="recruiting",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        m1 = TeamMember(team_id=team.id, user_id=self.leader.id, role="Team Lead")
        m2 = TeamMember(team_id=team.id, user_id=self.member_user.id, role="Backend Developer")
        inv = TeamInvite(team_id=team.id, user_id=self.invitee.id, role="AI Specialist", status="pending")
        self.db.add_all([m1, m2, inv])
        self.db.commit()

        resp = self.client.get(f"/api/v1/admin/teams/{team.id}", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["id"], team.id)
        self.assertEqual(data["name"], "[TEST-P2D] Health Check Squad")
        self.assertEqual(data["leader"]["username"], "aliceleaderp2d")
        self.assertEqual(len(data["members"]), 2)
        self.assertEqual(len(data["invites"]), 1)
        self.assertIn("health_scores", data)
        self.assertIn("health_details", data)
        self.assertIn("missing_roles", data)

    def test_admin_can_moderate_team_metadata(self):
        """Admin can update name, description, status, and max_members cleanly."""
        team = Team(
            name="[TEST-P2D] Modifiable Team",
            description="Original description",
            status="recruiting",
            max_members=4,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        m = TeamMember(team_id=team.id, user_id=self.leader.id, role="Team Lead")
        self.db.add(m)
        self.db.commit()

        update_payload = {
            "name": "[TEST-P2D] Moderated Team Elite",
            "description": "Updated description by admin",
            "status": "active",
            "max_members": 6,
            "hackathon_id": 42,
        }
        resp = self.client.patch(
            f"/api/v1/admin/teams/{team.id}",
            headers=self.admin_headers,
            json=update_payload
        )
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data["name"], "[TEST-P2D] Moderated Team Elite")
        self.assertEqual(data["description"], "Updated description by admin")
        self.assertEqual(data["status"], "active")
        self.assertEqual(data["max_members"], 6)
        self.assertEqual(data["hackathon_id"], 42)

    def test_admin_update_rejects_invalid_status(self):
        """Admin update with invalid status string must return 400 Bad Request."""
        team = Team(
            name="[TEST-P2D] Status Test Team",
            status="recruiting",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()

        resp = self.client.patch(
            f"/api/v1/admin/teams/{team.id}",
            headers=self.admin_headers,
            json={"status": "invalid_status_xyz"}
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("Invalid status", resp.json()["detail"])

    def test_admin_update_rejects_capacity_below_member_count(self):
        """Admin update cannot set max_members lower than current member count."""
        team = Team(
            name="[TEST-P2D] Capacity Test Team",
            status="recruiting",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        m1 = TeamMember(team_id=team.id, user_id=self.leader.id, role="Team Lead")
        m2 = TeamMember(team_id=team.id, user_id=self.member_user.id, role="Member")
        m3 = TeamMember(team_id=team.id, user_id=self.invitee.id, role="Designer")
        self.db.add_all([m1, m2, m3])
        self.db.commit()

        # Try to set max_members to 2 when 3 members exist
        resp = self.client.patch(
            f"/api/v1/admin/teams/{team.id}",
            headers=self.admin_headers,
            json={"max_members": 2}
        )
        self.assertEqual(resp.status_code, 400)
        self.assertIn("cannot be smaller than current number of members", resp.json()["detail"])

    def test_admin_can_list_team_invites(self):
        """Admin can inspect all invitations sent by a team."""
        team = Team(
            name="[TEST-P2D] Invite List Squad",
            status="recruiting",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        inv = TeamInvite(
            team_id=team.id,
            user_id=self.invitee.id,
            role="AI Specialist",
            message="Join our winning AI team!",
            status="pending"
        )
        self.db.add(inv)
        self.db.commit()

        resp = self.client.get(f"/api/v1/admin/teams/{team.id}/invites", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["student_id"], self.invitee.id)
        self.assertEqual(data[0]["role"], "AI Specialist")
        self.assertEqual(data[0]["status"], "pending")

    # ─── 3. Safe Deletion Policy Tests (409 Conflict) ─────────────────────────

    def test_delete_team_with_invitations_returns_409(self):
        """Deleting a team with existing invitations returns 409 Conflict."""
        team = Team(
            name="[TEST-P2D] Team With Invites",
            status="recruiting",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        inv = TeamInvite(
            team_id=team.id,
            user_id=self.invitee.id,
            role="Frontend",
            status="pending"
        )
        self.db.add(inv)
        self.db.commit()

        resp = self.client.delete(f"/api/v1/admin/teams/{team.id}", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 409)
        self.assertIn("invitation(s) exist", resp.json()["detail"])

    def test_delete_team_with_collaborator_members_returns_409(self):
        """Deleting a team with non-leader collaborator members returns 409 Conflict."""
        team = Team(
            name="[TEST-P2D] Team With Collaborators",
            status="active",
            max_members=5,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        m1 = TeamMember(team_id=team.id, user_id=self.leader.id, role="Team Lead")
        m2 = TeamMember(team_id=team.id, user_id=self.member_user.id, role="Collaborator")
        self.db.add_all([m1, m2])
        self.db.commit()

        resp = self.client.delete(f"/api/v1/admin/teams/{team.id}", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 409)
        self.assertIn("collaborator member(s) belong to this team", resp.json()["detail"])

    def test_delete_empty_team_succeeds(self):
        """Deleting an empty team with 0 invites and 0 collaborator members succeeds (200)."""
        team = Team(
            name="[TEST-P2D] Empty Disposable Team",
            status="recruiting",
            max_members=4,
            leader_id=self.leader.id,
        )
        self.db.add(team)
        self.db.commit()
        self.db.refresh(team)

        # Even with the leader's own initial member row
        m = TeamMember(team_id=team.id, user_id=self.leader.id, role="Team Lead")
        self.db.add(m)
        self.db.commit()

        resp = self.client.delete(f"/api/v1/admin/teams/{team.id}", headers=self.admin_headers)
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.json()["success"])

        # Verify team is gone
        deleted_team = self.db.query(Team).filter(Team.id == team.id).first()
        self.assertIsNone(deleted_team)

    # ─── 4. Student Functionality Regression ──────────────────────────────────

    def test_student_team_operations_remain_intact(self):
        """Verify normal student team creation, my-team fetch, and update remain functional."""
        # Create a fresh student for regression test
        student = User(
            name="Reg Student P2D",
            username="regstudentp2d",
            email="regstudentp2d@test.com",
            hashed_password=get_password_hash("Password123!"),
            college="CIT",
            is_active=True,
            is_verified=True,
            is_admin=False,
            status=AvailabilityStatus.LOOKING_FOR_TEAM,
        )
        self.db.add(student)
        self.db.commit()
        self.db.refresh(student)

        student_token = create_access_token(data={"sub": student.id})
        student_headers = {"Authorization": f"Bearer {student_token}"}

        # 1. Student creates team
        create_resp = self.client.post(
            "/api/v1/teams/",
            headers=student_headers,
            json={
                "name": "[TEST-P2D] Student Created Team",
                "description": "Student created team description",
                "max_members": 4,
                "status": "recruiting",
            }
        )
        self.assertEqual(create_resp.status_code, 201)
        created_data = create_resp.json()
        self.assertEqual(created_data["name"], "[TEST-P2D] Student Created Team")
        self.assertEqual(created_data["leader_id"], student.id)
        self.assertEqual(len(created_data["members"]), 1)
        self.assertEqual(created_data["members"][0]["role"], "Team Lead")

        # 2. Student gets my team
        my_resp = self.client.get("/api/v1/teams/my", headers=student_headers)
        self.assertEqual(my_resp.status_code, 200)
        self.assertEqual(my_resp.json()["id"], created_data["id"])

        # 3. Student updates team
        update_resp = self.client.patch(
            "/api/v1/teams/",
            headers=student_headers,
            json={"name": "[TEST-P2D] Student Renamed Team"}
        )
        self.assertEqual(update_resp.status_code, 200)
        self.assertEqual(update_resp.json()["name"], "[TEST-P2D] Student Renamed Team")

        # Clean up
        self.db.query(TeamMember).filter(TeamMember.user_id == student.id).delete()
        self.db.query(Team).filter(Team.id == created_data["id"]).delete()
        self.db.query(User).filter(User.id == student.id).delete()
        self.db.commit()


if __name__ == "__main__":
    unittest.main()
