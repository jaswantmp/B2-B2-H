# app/services/student_clustering_service.py
from sqlalchemy.orm import Session
from app.models.user import User, UserSkill
from app.models.project import Project, ProjectMember
from ml.inference import get_inference_engine


class StudentClusteringService:
    @staticmethod
    def get_user_cluster(db: Session, user: User) -> dict:
        """
        Computes K-Means skill cluster assignment, centroid distance, confidence,
        dominant skills/domains, and explainable rationale for a given user.
        """
        # 1. Safely extract user skills, domains, and interests from current user
        user_skills_raw = [us.skill.name for us in getattr(user, 'user_skills', []) if getattr(us, 'skill', None)]
        user_domains = getattr(user, 'domains', []) or []
        user_interests = getattr(user, 'interests', []) or []

        # 2. Extract GitHub statistics safely
        gh = getattr(user, 'github_profile', None)
        repos = getattr(gh, 'repos', 0) if gh else 0
        commits = getattr(gh, 'commits', 0) if gh else 0
        stars = getattr(gh, 'stars', 0) if gh else 0
        followers = getattr(gh, 'followers', 0) if gh else 0

        # 3. Fast project count queries
        created_count = db.query(Project.id).filter(Project.creator_id == user.id).count()
        member_count = db.query(ProjectMember.id).filter(ProjectMember.user_id == user.id).count()
        total_projects = created_count + member_count
        proj_tech_count = total_projects * 2

        # 4. Extract hackathon statistics safely
        hackathons_won = getattr(user, 'hackathons_won', 0) or 0
        hackathons_participated = hackathons_won + (1 if total_projects > 0 else 0)

        # 5. Compute profile completion score (0.0 to 1.0)
        completed_fields = sum([
            bool(getattr(user, 'name', None)),
            bool(getattr(user, 'bio', None)),
            bool(getattr(user, 'university', None)),
            bool(user_skills_raw),
            bool(user_domains),
            bool(getattr(user, 'github', None))
        ])
        profile_completion = round(completed_fields / 6.0, 2)

        # 6. Build feature payload (PII STRICTLY EXCLUDED)
        student_profile_dict = {
            "skills": user_skills_raw,
            "interests": user_interests,
            "domains": user_domains,
            "skill_count": len(user_skills_raw),
            "interest_count": len(user_interests),
            "domain_count": len(user_domains),
            "project_count": total_projects,
            "project_technology_count": proj_tech_count,
            "hackathons_participated": hackathons_participated,
            "hackathons_won": hackathons_won,
            "github_repos": repos,
            "github_commits": commits,
            "github_stars": stars,
            "github_followers": followers,
            "profile_completion": profile_completion
        }

        # 7. Execute ML inference using pre-trained K-Means model
        ml_engine = get_inference_engine()
        return ml_engine.predict_cluster_detailed(student_profile_dict)
