# app/api/v1/demo.py
"""
Demo Account Reset System for B2B2H

Provides an endpoint to reset the official demo account (`demo@b2b2h.com`)
back to its pristine seeded state so evaluators and judges can freely interact
with the platform without permanently modifying demo data.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_, text
from pydantic import BaseModel, EmailStr

from app.database import get_db
from app.models.user import User, Skill, UserSkill, AvailabilityStatus
from app.models.team import Team, TeamMember, TeamInvite
from app.models.project import Project, ProjectMember, ProjectApplication
from app.models.notification import Notification
from app.models.ai import AIUsage
from app.models.chat import ChatMessage
from app.utils.security import get_password_hash

router = APIRouter(prefix="/demo", tags=["demo"])

# Strictly allow ONLY the official demo account
OFFICIAL_DEMO_EMAIL = "demo@b2b2h.com"


class ResetDemoRequest(BaseModel):
    email: EmailStr | None = OFFICIAL_DEMO_EMAIL


@router.post("/reset", status_code=status.HTTP_200_OK)
def reset_demo_account(
    body: ResetDemoRequest | None = None,
    db: Session = Depends(get_db)
):
    """
    Resets the official demo account to its pristine initial state.
    
    Deletes all demo-created team invitations, team memberships, notifications,
    project memberships, project applications, chat messages, AI usages,
    projects, and teams in a strictly ordered foreign-key safe single transaction,
    restoring profile attributes and default verified skills.
    
    Strictly restricted to the official demo email ('demo@b2b2h.com').
    """
    target_email = (body.email if body and body.email else OFFICIAL_DEMO_EMAIL).strip().lower()
    
    if target_email != OFFICIAL_DEMO_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Reset endpoint is strictly restricted to the official demo account (demo@b2b2h.com)."
        )

    try:
        # 1. Find demo user or create default if missing
        demo_user = db.query(User).filter(User.email == OFFICIAL_DEMO_EMAIL).first()

        if not demo_user:
            demo_user = User(
                name="Jaswant MP",
                username="jaswantmp",
                email=OFFICIAL_DEMO_EMAIL,
                hashed_password=get_password_hash("password123"),
                bio="Full-stack developer and AI enthusiast from Dindigul, Tamil Nadu. Building B2B2H to help every student builder find the right team. Passionate about hackathons, open source, and solving real problems.",
                location="Dindigul, Tamil Nadu",
                university="SKCET",
                college="SKCET",
                district="Dindigul",
                city="Dindigul",
                state="Tamil Nadu",
                year="3rd Year",
                branch="Computer Science and Engineering",
                status=AvailabilityStatus.LOOKING_FOR_TEAM,
                avatar="https://api.dicebear.com/8.x/adventurer/svg?seed=JaswantMP",
                onboarding_completed=True,
                is_active=True,
                is_verified=True,
                hackathons_won=2,
                github="jaswantmp",
                linkedin="jaswantmp",
                domains=["Web", "AI/ML", "EdTech"]
            )
            db.add(demo_user)
            db.flush()
        else:
            # Step 10, 12, 13: Restore profile, domains, and availability
            demo_user.name = "Jaswant MP"
            demo_user.username = "jaswantmp"
            # Only calculate expensive bcrypt hash if missing/invalid
            if not demo_user.hashed_password or not demo_user.hashed_password.startswith("$2"):
                demo_user.hashed_password = get_password_hash("password123")
            demo_user.bio = "Full-stack developer and AI enthusiast from Dindigul, Tamil Nadu. Building B2B2H to help every student builder find the right team. Passionate about hackathons, open source, and solving real problems."
            demo_user.location = "Dindigul, Tamil Nadu"
            demo_user.university = "SKCET"
            demo_user.college = "SKCET"
            demo_user.district = "Dindigul"
            demo_user.city = "Dindigul"
            demo_user.state = "Tamil Nadu"
            demo_user.year = "3rd Year"
            demo_user.branch = "Computer Science and Engineering"
            demo_user.status = AvailabilityStatus.LOOKING_FOR_TEAM
            demo_user.avatar = "https://api.dicebear.com/8.x/adventurer/svg?seed=JaswantMP"
            demo_user.onboarding_completed = True
            demo_user.is_active = True
            demo_user.is_verified = True
            demo_user.hackathons_won = 2
            demo_user.profile_views = 0
            demo_user.github = "jaswantmp"
            demo_user.linkedin = "jaswantmp"
            demo_user.domains = ["Web", "AI/ML", "EdTech"]
            db.add(demo_user)

        user_id = demo_user.id

        # 1. Find team IDs led by demo user and project IDs created by demo user
        led_team_ids = [t.id for t in db.query(Team.id).filter(Team.leader_id == user_id).all()]
        created_project_ids = [p.id for p in db.query(Project.id).filter(Project.creator_id == user_id).all()]

        # 2. Foreign Key Safe Deletions in single batch
        if led_team_ids or created_project_ids:
            db.query(TeamInvite).filter(or_(TeamInvite.user_id == user_id, TeamInvite.team_id.in_(led_team_ids))).delete(synchronize_session=False)
            db.query(TeamMember).filter(or_(TeamMember.user_id == user_id, TeamMember.team_id.in_(led_team_ids))).delete(synchronize_session=False)
            db.query(Notification).filter(or_(Notification.recipient_id == user_id, Notification.sender_id == user_id)).delete(synchronize_session=False)
            db.query(ProjectMember).filter(or_(ProjectMember.user_id == user_id, ProjectMember.project_id.in_(created_project_ids))).delete(synchronize_session=False)
            db.query(ProjectApplication).filter(or_(ProjectApplication.user_id == user_id, ProjectApplication.project_id.in_(created_project_ids))).delete(synchronize_session=False)
            db.query(ChatMessage).filter(or_(ChatMessage.sender_id == user_id, ChatMessage.team_id.in_(led_team_ids))).delete(synchronize_session=False)
            db.query(AIUsage).filter(AIUsage.user_id == user_id).delete(synchronize_session=False)
            db.query(Project).filter(Project.creator_id == user_id).delete(synchronize_session=False)
            db.query(Team).filter(Team.leader_id == user_id).delete(synchronize_session=False)
            db.query(UserSkill).filter(UserSkill.user_id == user_id).delete(synchronize_session=False)
        else:
            # Fast-path single SQL statement batch for standard demo account reset
            batch_sql = text("""
                DELETE FROM team_invites WHERE user_id = :uid;
                DELETE FROM team_members WHERE user_id = :uid;
                DELETE FROM notifications WHERE recipient_id = :uid OR sender_id = :uid;
                DELETE FROM project_members WHERE user_id = :uid;
                DELETE FROM project_applications WHERE user_id = :uid;
                DELETE FROM chat_messages WHERE sender_id = :uid;
                DELETE FROM ai_usages WHERE user_id = :uid;
                DELETE FROM projects WHERE creator_id = :uid;
                DELETE FROM teams WHERE leader_id = :uid;
                DELETE FROM user_skills WHERE user_id = :uid;
            """)
            db.execute(batch_sql, {"uid": user_id})

        # 3. Restore default skills in a single pre-fetched query
        DEFAULT_SKILLS = [
            ("React", True, "advanced"),
            ("Node.js", True, "advanced"),
            ("TypeScript", True, "advanced"),
            ("Python", False, "intermediate"),
            ("FastAPI", False, "intermediate"),
            ("Tailwind CSS", False, "intermediate")
        ]
        skill_names = [s[0] for s in DEFAULT_SKILLS]
        existing_skills = db.query(Skill).filter(Skill.name.in_(skill_names)).all()
        skills_map = {s.name.lower(): s for s in existing_skills}

        for skill_name, verified, proficiency in DEFAULT_SKILLS:
            skill = skills_map.get(skill_name.lower())
            if not skill:
                skill = Skill(name=skill_name, category="Technical")
                db.add(skill)
                db.flush()
                skills_map[skill_name.lower()] = skill
            
            user_skill = UserSkill(
                user_id=user_id,
                skill_id=skill.id,
                is_verified=verified,
                proficiency=proficiency
            )
            db.add(user_skill)

        # 4. Commit single atomic transaction
        db.commit()

        return {
            "status": "success",
            "message": f"Official demo account ({OFFICIAL_DEMO_EMAIL}) reset to pristine seeded state.",
            "user_id": user_id
        }

    except Exception as err:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to reset demo account: {str(err)}"
        )
