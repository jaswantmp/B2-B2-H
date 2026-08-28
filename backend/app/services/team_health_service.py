# app/services/team_health_service.py
import math
import logging
from typing import Dict, Any, List, Optional
from sqlalchemy.orm import Session
from app.models.team import Team

logger = logging.getLogger(__name__)

PROFICIENCY_WEIGHTS = {
    "beginner": 1.0,
    "intermediate": 1.5,
    "advanced": 2.0
}
DEFAULT_PROFICIENCY_WEIGHT = 1.25
VERIFIED_MULTIPLIER = 1.25

CATEGORY_KEYWORDS = {
    "Frontend": ["react", "angular", "vue.js", "vue", "flutter", "android", "ios", "javascript", "typescript", "tailwind css", "tailwind", "next.js", "svelte", "html5", "css3", "css", "html"],
    "Backend": ["node.js", "node", "express.js", "express", "fastapi", "django", "spring boot", "spring", "java", "c++", "c", "python", "go", "rust", "postgresql", "mysql", "mongodb", "firebase", "aws", "azure", "docker", "kubernetes", "devops", "redis"],
    "AI/ML": ["machine learning", "deep learning", "artificial intelligence", "generative ai", "ai", "ml", "data science", "prompt engineering", "agentic ai", "langchain", "huggingface", "rag", "langgraph", "crewai", "tensorflow", "pytorch", "opencv", "nlp", "transformers", "vector"],
    "Design": ["ui design", "ux design", "ui/ux", "ui", "ux", "figma", "canva", "graphic design", "wireframing", "prototyping", "design", "unreal engine", "unity", "blender"],
    "Product": ["product management", "business analysis", "market research", "startup strategy", "public speaking", "presentation", "pitching", "technical writing", "documentation", "team leadership", "project management", "problem solving", "innovation", "ideation", "pitch deck creation", "demo building", "research", "rapid prototyping", "product", "agile", "strategy", "roadmap", "pm", "product manager"]
}

ROLE_CATEGORY_MAP = {
    "frontend": "Frontend",
    "react": "Frontend",
    "backend": "Backend",
    "api": "Backend",
    "ai": "AI/ML",
    "ml": "AI/ML",
    "machine learning": "AI/ML",
    "design": "Design",
    "designer": "Design",
    "ui/ux": "Design",
    "product": "Product",
    "manager": "Product",
    "lead": "Product"
}


class TeamHealthService:
    CATEGORIES = CATEGORY_KEYWORDS

    @classmethod
    def _extract_member_features(cls, member, db: Optional[Session] = None) -> dict:
        """
        Extract non-PII features from a TeamMember model.
        STRICTLY EXCLUDES: student_id, name, username, email.
        """
        user = getattr(member, 'user', None)
        if not user:
            return {
                "role": getattr(member, 'role', 'Member'),
                "skills": [],
                "domains": [],
                "commits": 0,
                "repos": 0,
                "stars": 0,
                "hackathons_won": 0,
                "branch": "",
                "year": "",
                "cluster_id": 3,
                "cluster_confidence": 0.5
            }

        # 1. Skills & proficiencies (Non-PII)
        skills = []
        if hasattr(user, 'user_skills') and user.user_skills:
            for us in user.user_skills:
                if hasattr(us, 'skill') and us.skill and us.skill.name:
                    prof_key = (getattr(us, 'proficiency', '') or '').lower()
                    prof_weight = PROFICIENCY_WEIGHTS.get(prof_key, DEFAULT_PROFICIENCY_WEIGHT)
                    is_ver = bool(getattr(us, 'is_verified', False))
                    final_weight = prof_weight * (VERIFIED_MULTIPLIER if is_ver else 1.0)
                    skills.append({
                        "name": us.skill.name.strip(),
                        "name_lower": us.skill.name.strip().lower(),
                        "category": (getattr(us.skill, 'category', '') or '').lower(),
                        "proficiency": prof_key or "intermediate",
                        "proficiency_weight": prof_weight,
                        "is_verified": is_ver,
                        "final_weight": final_weight
                    })

        # 2. Domains / Interests
        domains = [d.lower().strip() for d in (getattr(user, 'domains', []) or []) if isinstance(d, str)]

        # 3. GitHub Activity (Non-PII stats)
        gh_profile = getattr(user, 'github_profile', None)
        gh_stats = getattr(user, 'github_stats', {}) or {}
        commits = 0
        repos = 0
        stars = 0
        if gh_profile:
            commits = getattr(gh_profile, 'commits', 0) or 0
            repos = getattr(gh_profile, 'repos', 0) or 0
            stars = getattr(gh_profile, 'stars', 0) or 0
        elif isinstance(gh_stats, dict):
            commits = int(gh_stats.get('commits', 0) or 0)
            repos = int(gh_stats.get('repos', 0) or 0)
            stars = int(gh_stats.get('stars', 0) or 0)

        # 4. K-Means Student Cluster
        cluster_id = 3
        cluster_confidence = 0.5
        if db and user:
            try:
                from app.services.student_clustering_service import StudentClusteringService
                cluster_res = StudentClusteringService.get_user_cluster(db, user)
                if isinstance(cluster_res, dict):
                    cluster_id = int(cluster_res.get('cluster_id', 3))
                    cluster_confidence = float(cluster_res.get('confidence', 0.5))
            except Exception as err:
                logger.debug(f"Non-fatal error fetching student cluster for member: {err}")

        return {
            "role": (getattr(member, 'role', '') or 'Member').strip(),
            "skills": skills,
            "domains": domains,
            "commits": commits,
            "repos": repos,
            "stars": stars,
            "hackathons_won": getattr(user, 'hackathons_won', 0) or 0,
            "branch": getattr(user, 'branch', '') or '',
            "year": getattr(user, 'year', '') or '',
            "cluster_id": cluster_id,
            "cluster_confidence": cluster_confidence
        }

    @classmethod
    def get_full_team_health(cls, team: Team, db: Optional[Session] = None) -> dict:
        """
        Calculate dynamic ML-based Team Health metrics, missing roles, and detailed explainability.
        Returns:
            {
                "health_scores": {"Frontend": 82, ...},
                "missing_roles": ["Design"],
                "health_details": {"Frontend": {...}, ...}
            }
        """
        if not team or not getattr(team, 'members', None):
            empty_scores = {cat: 0 for cat in CATEGORY_KEYWORDS}
            empty_missing = ["Frontend React Developer", "Backend Developer", "AI / ML Engineer", "UI/UX Designer", "Product Manager"]
            empty_details = {
                cat: {
                    "score": 0,
                    "contributors_count": 0,
                    "relevant_skills": [],
                    "strongest_skills": [],
                    "avg_proficiency": "none",
                    "verified_skill_count": 0,
                    "has_assigned_role": False,
                    "assigned_roles": [],
                    "github_contribution": "N/A",
                    "cluster_contribution": "N/A",
                    "explanation": f"{cat} has 0 coverage because there are no members in the team."
                }
                for cat in CATEGORY_KEYWORDS
            }
            return {
                "health_scores": empty_scores,
                "missing_roles": empty_missing,
                "health_details": empty_details
            }

        # Extract features for all team members
        members_features = [cls._extract_member_features(m, db) for m in team.members]

        health_scores = {}
        health_details = {}

        for cat, keywords in CATEGORY_KEYWORDS.items():
            cat_score, details = cls._calculate_category_health(cat, keywords, members_features)
            health_scores[cat] = cat_score
            health_details[cat] = details

        # Determine missing roles for categories under 40%
        missing_roles = cls._calculate_missing_roles_from_scores(health_scores)

        return {
            "health_scores": health_scores,
            "missing_roles": missing_roles,
            "health_details": health_details
        }

    @classmethod
    def _calculate_category_health(cls, category: str, keywords: List[str], members_features: List[dict]) -> tuple[int, dict]:
        """
        Calculate health score (0-100) and explainability details for a single category.
        """
        matching_members_count = 0
        total_skill_weight = 0.0
        relevant_skills = set()
        strongest_skills = []
        verified_count = 0
        proficiencies = []
        assigned_roles = []
        total_commits = 0

        cluster_boost_sum = 0.0

        for m_feat in members_features:
            role_lower = m_feat["role"].lower()
            role_matches = any(kw in role_lower for kw in keywords) or any(k in role_lower for k, v in ROLE_CATEGORY_MAP.items() if v == category)
            if role_matches:
                assigned_roles.append(m_feat["role"])

            member_has_skill = False
            for s in m_feat["skills"]:
                if any(kw in s["name_lower"] for kw in keywords):
                    member_has_skill = True
                    relevant_skills.add(s["name"])
                    total_skill_weight += s["final_weight"]
                    proficiencies.append(s["proficiency_weight"])
                    if s["is_verified"]:
                        verified_count += 1
                        strongest_skills.append(f"{s['name']} ({s['proficiency']}, verified)")
                    else:
                        strongest_skills.append(f"{s['name']} ({s['proficiency']})")

            if role_matches or member_has_skill:
                matching_members_count += 1
                total_commits += m_feat["commits"]

            # K-Means Archetype contribution
            cid = m_feat["cluster_id"]
            conf = m_feat["cluster_confidence"]
            if category in ["Backend", "AI/ML"] and cid == 0:
                cluster_boost_sum += 10.0 * conf
            elif category in ["Product", "Frontend"] and cid == 1:
                cluster_boost_sum += 10.0 * conf
            elif category in ["Backend"] and cid == 2:
                cluster_boost_sum += 12.0 * conf
            elif cid == 3:
                cluster_boost_sum += 4.0 * conf

        # Calculate Components:
        # 1. Base skill score (0 - 45 pts)
        skill_score = min(45.0, total_skill_weight * 12.0)

        # 2. Role score (0 - 30 pts)
        role_score = min(30.0, len(assigned_roles) * 25.0)

        # 3. GitHub Logarithmic Contribution (0 - 15 pts) for technical categories
        gh_score = 0.0
        if category in ["Frontend", "Backend", "AI/ML"] and total_commits > 0:
            gh_score = min(15.0, math.log2(1 + total_commits) * 1.8)

        # 4. K-Means Cluster archetype boost (0 - 15 pts)
        cluster_score = min(15.0, cluster_boost_sum)

        # 5. Multi-contributor resilience bonus (0 - 10 pts)
        diversity_bonus = 10.0 if matching_members_count >= 2 else (5.0 if matching_members_count == 1 else 0.0)

        # Calculate final combined score (0 - 100)
        if matching_members_count == 0 and len(assigned_roles) == 0 and total_skill_weight == 0:
            final_score = 0
        else:
            raw_total = skill_score + role_score + gh_score + cluster_score + diversity_bonus
            # Baseline minimum if any presence exists
            final_score = min(100, max(15, round(raw_total)))

        # Derive human-readable metrics for health_details
        avg_prof_str = "none"
        if proficiencies:
            avg_val = sum(proficiencies) / len(proficiencies)
            if avg_val >= 1.8:
                avg_prof_str = "advanced"
            elif avg_val >= 1.3:
                avg_prof_str = "intermediate"
            else:
                avg_prof_str = "beginner"

        gh_contrib_str = "N/A"
        if category in ["Frontend", "Backend", "AI/ML"] and total_commits > 0:
            gh_contrib_str = f"+{int(round(gh_score))} pts ({total_commits} commits)"

        cluster_contrib_str = "N/A"
        if cluster_score > 0:
            cluster_contrib_str = f"+{int(round(cluster_score))} pts (archetype alignment)"

        # Generate Explainable Rationale
        rel_skills_list = sorted(list(relevant_skills))
        if final_score >= 70:
            explanation = f"{category} is strongly covered by {matching_members_count} member(s) with {', '.join(rel_skills_list[:3]) if rel_skills_list else 'key skills'}"
            if verified_count > 0:
                explanation += f", including {verified_count} verified skill(s)."
            else:
                explanation += "."
        elif final_score >= 40:
            explanation = f"{category} has moderate coverage with {matching_members_count} contributor(s)"
            if rel_skills_list:
                explanation += f" covering {', '.join(rel_skills_list[:2])}."
            else:
                explanation += "."
        else:
            explanation = f"{category} is under-covered because no team member has strong {category} skills or an assigned {category} role."

        details = {
            "score": final_score,
            "contributors_count": matching_members_count,
            "relevant_skills": rel_skills_list,
            "strongest_skills": strongest_skills[:4],
            "avg_proficiency": avg_prof_str,
            "verified_skill_count": verified_count,
            "has_assigned_role": len(assigned_roles) > 0,
            "assigned_roles": list(set(assigned_roles)),
            "github_contribution": gh_contrib_str,
            "cluster_contribution": cluster_contrib_str,
            "explanation": explanation
        }

        return final_score, details

    @classmethod
    def _calculate_missing_roles_from_scores(cls, health_scores: dict[str, int]) -> list[str]:
        """Flag roles as missing if corresponding category score is under 40%."""
        missing = []
        role_map = {
            "Frontend": "Frontend React Developer",
            "Backend": "Backend Developer",
            "AI/ML": "AI / ML Engineer",
            "Design": "UI/UX Designer",
            "Product": "Product Manager"
        }
        for cat, role_label in role_map.items():
            if health_scores.get(cat, 0) < 40:
                missing.append(role_label)
        return missing

    @classmethod
    def calculate_skill_coverage(cls, team: Team, db: Optional[Session] = None) -> dict[str, int]:
        """Calculate dynamic coverage scores (0-100) across Frontend, Backend, AI/ML, Design, Product."""
        res = cls.get_full_team_health(team, db)
        return res["health_scores"]

    @classmethod
    def calculate_missing_roles(cls, team: Team, db: Optional[Session] = None) -> list[str]:
        """Compute which critical roles are missing based on dynamic health scores."""
        res = cls.get_full_team_health(team, db)
        return res["missing_roles"]

    @classmethod
    def calculate_readiness_score(cls, team: Team, db: Optional[Session] = None) -> int:
        """Calculate overall team readiness score as the average of all category scores."""
        scores = cls.calculate_skill_coverage(team, db)
        if not scores:
            return 0
        return int(sum(scores.values()) / len(scores))
