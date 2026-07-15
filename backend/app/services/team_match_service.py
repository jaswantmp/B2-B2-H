# app/services/team_match_service.py
import logging
from sqlalchemy.orm import Session, joinedload
from app.models.user import User, UserSkill, AvailabilityStatus
from app.schemas.team_match import TeamMatchCandidate

logger = logging.getLogger(__name__)

# Map skill names (lowercase) to five core roles
SKILL_TO_ROLE = {
    # Frontend
    "react": "Frontend",
    "angular": "Frontend",
    "vue.js": "Frontend",
    "vue": "Frontend",
    "flutter": "Frontend",
    "android": "Frontend",
    "ios": "Frontend",
    "javascript": "Frontend",
    "typescript": "Frontend",
    "tailwind css": "Frontend",
    "tailwind": "Frontend",
    # Backend
    "node.js": "Backend",
    "node": "Backend",
    "express.js": "Backend",
    "express": "Backend",
    "fastapi": "Backend",
    "django": "Backend",
    "spring boot": "Backend",
    "spring": "Backend",
    "java": "Backend",
    "c++": "Backend",
    "c": "Backend",
    "python": "Backend",
    "postgresql": "Backend",
    "mysql": "Backend",
    "mongodb": "Backend",
    "firebase": "Backend",
    "aws": "Backend",
    "azure": "Backend",
    "docker": "Backend",
    "kubernetes": "Backend",
    "devops": "Backend",
    # AI/ML
    "machine learning": "AI/ML",
    "deep learning": "AI/ML",
    "artificial intelligence": "AI/ML",
    "generative ai": "AI/ML",
    "ai": "AI/ML",
    "data science": "AI/ML",
    # Design
    "ui design": "Design",
    "ux design": "Design",
    "ui/ux": "Design",
    "figma": "Design",
    "canva": "Design",
    "graphic design": "Design",
    "wireframing": "Design",
    "prototyping": "Design",
    # Product / Pitch / Soft Skills
    "product management": "Product/Pitch",
    "business analysis": "Product/Pitch",
    "market research": "Product/Pitch",
    "startup strategy": "Product/Pitch",
    "public speaking": "Product/Pitch",
    "presentation": "Product/Pitch",
    "pitching": "Product/Pitch",
    "technical writing": "Product/Pitch",
    "documentation": "Product/Pitch",
    "team leadership": "Product/Pitch",
    "project management": "Product/Pitch",
    "problem solving": "Product/Pitch",
    "innovation": "Product/Pitch",
    "ideation": "Product/Pitch",
    "pitch deck creation": "Product/Pitch",
    "demo building": "Product/Pitch",
    "research": "Product/Pitch",
    "rapid prototyping": "Product/Pitch"
}

ROLE_LABELS = {
    "Frontend": "Frontend Developer",
    "Backend": "Backend Developer",
    "AI/ML": "AI Engineer",
    "Design": "UI/UX Designer",
    "Product/Pitch": "Product Lead"
}

ALL_ROLES = {"Frontend", "Backend", "AI/ML", "Design", "Product/Pitch"}


class TeamMatchService:

    @classmethod
    def calculate_match(cls, user: User, candidate: User) -> tuple[int, list[str], str]:
        """
        Calculate compatibility score and compile match reasons for a candidate.
        Returns:
            - score: integer from 0 to 100
            - reasons: list of strings detailing match reasons
            - recommended_role: string representing the candidate's top role
        """
        reasons = []

        # 1. extract skills
        user_skills_map = {us.skill.name.lower(): us.skill.name for us in user.user_skills if us.skill}
        user_skills = set(user_skills_map.keys())

        candidate_skills_map = {us.skill.name.lower(): us.skill.name for us in candidate.user_skills if us.skill}
        candidate_skills = set(candidate_skills_map.keys())

        # Determine candidate's recommended role dynamically
        role_counts = {r: 0 for r in ALL_ROLES}
        for s in candidate_skills:
            r = SKILL_TO_ROLE.get(s)
            if r:
                role_counts[r] += 1

        max_role = max(role_counts, key=role_counts.get)
        recommended_role = ROLE_LABELS[max_role] if role_counts[max_role] > 0 else "Full Stack Developer"

        # A. Skills Similarity Score (fraction of user's skills the candidate also has)
        if user_skills:
            shared = user_skills.intersection(candidate_skills)
            similarity_score = (len(shared) / len(user_skills)) * 100.0
            
            # Add shared skill reasons (limit to top 3 for brevity)
            for s in list(shared)[:3]:
                reasons.append(f"Shared {user_skills_map[s]} skill")
        else:
            similarity_score = 0.0

        # B. Skills Complementarity Score (how well candidate covers roles user lacks)
        user_roles = {SKILL_TO_ROLE[s] for s in user_skills if s in SKILL_TO_ROLE}
        candidate_roles = {SKILL_TO_ROLE[s] for s in candidate_skills if s in SKILL_TO_ROLE}

        user_lacking_roles = ALL_ROLES - user_roles
        if user_lacking_roles and candidate_roles:
            covered_lacking = user_lacking_roles.intersection(candidate_roles)
            complementarity_score = (len(covered_lacking) / len(user_lacking_roles)) * 100.0

            # Add complementarity explanations
            for role in covered_lacking:
                reasons.append(f"Complements you with {ROLE_LABELS[role]} skills")
        else:
            complementarity_score = 0.0

        # Combine: Skills Score is the best of Similarity and Complementarity (max)
        # Handles empty sets gracefully by falling back to 0.0
        skills_score = max(similarity_score, complementarity_score)

        # 2. Branch Match (25%)
        branch_score = 0.0
        if user.branch and candidate.branch:
            if user.branch.strip().lower() == candidate.branch.strip().lower():
                branch_score = 100.0
                reasons.append("Same branch")

        # 3. Year Match (15%)
        year_score = 0.0
        if user.year and candidate.year:
            if user.year.strip().lower() == candidate.year.strip().lower():
                year_score = 100.0
                reasons.append("Same academic year")

        # 4. University Match (10%)
        uni_score = 0.0
        if user.university and candidate.university:
            if user.university.strip().lower() == candidate.university.strip().lower():
                uni_score = 100.0
                reasons.append("Same university")

        # 5. Status Match (10%)
        status_score = 0.0
        if user.status and candidate.status:
            if user.status == candidate.status:
                status_score = 100.0
                if user.status == AvailabilityStatus.LOOKING_FOR_TEAM:
                    reasons.append("Both looking for team")
                else:
                    reasons.append("Same availability status")

        # Weighted calculation
        total_score = round(
            skills_score * 0.40 +
            branch_score * 0.25 +
            year_score * 0.15 +
            uni_score * 0.10 +
            status_score * 0.10
        )

        return total_score, reasons, recommended_role

    @classmethod
    async def get_team_matches(cls, db: Session, user_id: str) -> list[TeamMatchCandidate]:
        """
        Retrieve and calculate top 10 matches for a given user.
        """
        # Fetch current user
        user = db.query(User).options(
            joinedload(User.user_skills).joinedload(UserSkill.skill)
        ).filter(User.id == user_id).first()

        if not user:
            return []

        # Fetch other active builders
        candidates = db.query(User).options(
            joinedload(User.user_skills).joinedload(UserSkill.skill)
        ).filter(
            User.id != user_id,
            User.is_active == True
        ).all()

        matches = []
        for c in candidates:
            score, reasons, recommended_role = cls.calculate_match(user, c)
            
            # FUTURE READY: Structure for Gemini API to summarize explanations
            # try:
            #     from google import genai
            #     client = genai.Client()
            #     prompt = (
            #         f"Describe in one short sentence why {c.name} is a great hackathon teammate "
            #         f"for {user.name} based on these reasons: {reasons}."
            #     )
            #     response = client.models.generate_content(
            #         model='gemini-2.5-flash',
            #         contents=prompt
            #     )
            #     # Can replace reasons or augment them
            # except Exception as e:
            #     logger.warning(f"Error calling Gemini: {e}")

            matches.append(TeamMatchCandidate(
                user_id=c.id,
                id=c.id,
                name=c.name,
                compatibility_score=score,
                reasons=reasons,
                recommended_role=recommended_role,
                avatar=c.avatar,
                branch=c.branch,
                year=c.year,
                university=c.university
            ))

        # Sort descending by compatibility score
        matches.sort(key=lambda x: x.compatibility_score, reverse=True)

        # Return top 10
        return matches[:10]
