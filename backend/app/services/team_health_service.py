# app/services/team_health_service.py
from app.models.team import Team


class TeamHealthService:
    CATEGORIES = {
        "Frontend": ["react", "vue", "tailwind", "typescript", "three.js", "css", "html", "next.js", "flutter", "react native"],
        "Backend": ["node", "python", "go", "rust", "fastapi", "postgresql", "mongodb", "redis", "docker", "kubernetes", "django", "spring"],
        "AI/ML": ["tensorflow", "pytorch", "langchain", "opencv", "nlp", "transformers", "llm", "vector", "ai", "ml"],
        "Design": ["figma", "ui", "ux", "design", "prototyping", "figma"],
        "Product": ["product", "agile", "strategy", "roadmap", "pm", "product manager"]
    }

    @classmethod
    def calculate_skill_coverage(cls, team: Team) -> dict[str, int]:
        """Calculate coverage score (0-100) across frontend, backend, AI, design, and product."""
        scores = {cat: 10 for cat in cls.CATEGORIES}  # Default base score

        # Gather all skills possessed by team members
        team_skills = set()
        member_roles = []
        for member in team.members:
            member_roles.append(member.role.lower())
            for user_skill in member.user.user_skills:
                team_skills.add(user_skill.skill.name.lower())

        for cat, keywords in cls.CATEGORIES.items():
            # 1. Match skills
            skill_hits = sum(1 for skill in team_skills if any(kw in skill for kw in keywords))
            
            # 2. Match roles
            role_hits = sum(1 for role in member_roles if any(kw in role for kw in keywords))

            # Compute score: base + skill score + role presence boost
            score = 10 + (skill_hits * 25) + (role_hits * 35)
            scores[cat] = min(100, score)

        return scores

    @classmethod
    def calculate_missing_roles(cls, team: Team) -> list[str]:
        """Compute which critical roles are missing based on health scores."""
        coverage = cls.calculate_skill_coverage(team)
        missing = []

        if coverage["Frontend"] < 50:
            missing.append("Frontend React Developer")
        if coverage["Backend"] < 50:
            missing.append("Backend Developer")
        if coverage["AI/ML"] < 50:
            missing.append("AI / ML Engineer")
        if coverage["Design"] < 50:
            missing.append("UI/UX Designer")
        if coverage["Product"] < 50:
            missing.append("Product Manager")

        return missing

    @classmethod
    def calculate_readiness_score(cls, team: Team) -> int:
        """Calculate overall team readiness score as the average of all category scores."""
        coverage = cls.calculate_skill_coverage(team)
        if not coverage:
            return 0
        return int(sum(coverage.values()) / len(coverage))
