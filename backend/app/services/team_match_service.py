# app/services/team_match_service.py
import logging
from sqlalchemy.orm import Session, joinedload
from app.models.user import User, UserSkill, AvailabilityStatus
from app.schemas.team_match import TeamMatchCandidate

logger = logging.getLogger(__name__)

# Map skill names (lowercase) to five core roles
SKILL_TO_ROLE = {
    # Frontend
    "react": "Frontend", "angular": "Frontend", "vue.js": "Frontend", "vue": "Frontend",
    "flutter": "Frontend", "android": "Frontend", "ios": "Frontend", "javascript": "Frontend",
    "typescript": "Frontend", "tailwind css": "Frontend", "tailwind": "Frontend",
    "next.js": "Frontend", "svelte": "Frontend", "html5": "Frontend", "css3": "Frontend",
    # Backend
    "node.js": "Backend", "node": "Backend", "express.js": "Backend", "express": "Backend",
    "fastapi": "Backend", "django": "Backend", "spring boot": "Backend", "spring": "Backend",
    "java": "Backend", "c++": "Backend", "c": "Backend", "python": "Backend", "go": "Backend", "rust": "Backend",
    "postgresql": "Backend", "mysql": "Backend", "mongodb": "Backend", "firebase": "Backend",
    "aws": "Backend", "azure": "Backend", "docker": "Backend", "kubernetes": "Backend", "devops": "Backend",
    # AI/ML & Agentic
    "machine learning": "AI/ML", "deep learning": "AI/ML", "artificial intelligence": "AI/ML",
    "generative ai": "AI/ML", "ai": "AI/ML", "data science": "AI/ML", "prompt engineering": "AI/ML",
    "agentic ai": "AI/ML", "langchain": "AI/ML", "huggingface": "AI/ML", "rag": "AI/ML", "langgraph": "AI/ML", "crewai": "AI/ML",
    # Mechanical & CAD
    "solidworks": "Mechanical", "fusion 360": "Mechanical", "catia": "Mechanical", "creo": "Mechanical",
    "nx cad": "Mechanical", "ansys": "Mechanical", "abaqus": "Mechanical", "autocad": "Mechanical",
    "cnc programming": "Mechanical", "3d printing": "Mechanical", "fea": "Mechanical", "cfd": "Mechanical",
    # Civil & Structural
    "staad pro": "Civil", "etabs": "Civil", "sap2000": "Civil", "revit": "Civil", "autocad civil 3d": "Civil",
    "surveying": "Civil", "structural analysis": "Civil", "bim": "Civil",
    # Electrical & Embedded
    "matlab": "Electrical", "simulink": "Electrical", "plc": "Electrical", "scada": "Electrical",
    "siemens tia portal": "Electrical", "labview": "Electrical", "embedded c": "Electrical",
    "pcb design": "Electrical", "stm32": "Electrical", "esp32": "Electrical", "arduino": "Electrical",
    "raspberry pi": "Electrical", "fpga": "Electrical", "verilog": "Electrical", "vhdl": "Electrical",
    # Robotics
    "ros": "Robotics", "ros2": "Robotics", "gazebo": "Robotics", "robotics kinematics": "Robotics",
    # Design
    "ui design": "Design", "ux design": "Design", "ui/ux": "Design", "figma": "Design",
    "canva": "Design", "graphic design": "Design", "wireframing": "Design", "prototyping": "Design",
    "unreal engine": "Design", "unity": "Design", "blender": "Design",
    # Product / Business
    "product management": "Product/Pitch", "business analysis": "Product/Pitch", "market research": "Product/Pitch",
    "startup strategy": "Product/Pitch", "salesforce": "Product/Pitch", "sap": "Product/Pitch", "oracle": "Product/Pitch",
    "power bi": "Product/Pitch", "tableau": "Product/Pitch", "public speaking": "Product/Pitch",
    "presentation": "Product/Pitch", "pitching": "Product/Pitch", "technical writing": "Product/Pitch",
    "documentation": "Product/Pitch", "team leadership": "Product/Pitch", "project management": "Product/Pitch",
    "problem solving": "Product/Pitch", "innovation": "Product/Pitch", "ideation": "Product/Pitch",
    "pitch deck creation": "Product/Pitch", "demo building": "Product/Pitch", "research": "Product/Pitch",
    "rapid prototyping": "Product/Pitch"
}

ROLE_LABELS = {
    "Frontend": "Frontend Developer",
    "Backend": "Backend Developer",
    "AI/ML": "AI Engineer",
    "Mechanical": "CAD Engineer",
    "Civil": "Structural Engineer",
    "Electrical": "Embedded Engineer",
    "Robotics": "Robotics Engineer",
    "Design": "UI/UX Designer",
    "Product/Pitch": "Product Lead"
}

ALL_ROLES = {"Frontend", "Backend", "AI/ML", "Mechanical", "Civil", "Electrical", "Robotics", "Design", "Product/Pitch"}


class TeamMatchService:

    @classmethod
    def calculate_match(cls, user: User, candidate: User) -> tuple[int, list[str], str, dict]:
        """
        Calculate compatibility score and compile match reasons for a candidate.
        Returns:
            - score: integer from 0 to 100
            - reasons: list of strings detailing match reasons
            - recommended_role: string representing the candidate's top role
            - compatibility_details: dict containing common_skills, complementary_skills, common_domains, compatibility_level, match_reasons, explanation
        """
        reasons = []

        # 1. Extract skills
        user_skills_map = {us.skill.name.lower(): us.skill.name for us in (getattr(user, 'user_skills', []) or []) if getattr(us, 'skill', None)}
        user_skills = set(user_skills_map.keys())

        candidate_skills_map = {us.skill.name.lower(): us.skill.name for us in (getattr(candidate, 'user_skills', []) or []) if getattr(us, 'skill', None)}
        candidate_skills = set(candidate_skills_map.keys())

        # Determine candidate's recommended role dynamically
        role_counts = {r: 0 for r in ALL_ROLES}
        for s in candidate_skills:
            r = SKILL_TO_ROLE.get(s)
            if r:
                role_counts[r] += 1

        max_role = max(role_counts, key=role_counts.get)
        recommended_role = ROLE_LABELS[max_role] if role_counts[max_role] > 0 else "Full Stack Developer"

        # A. Shared and Complementary Skills
        common_skills = [user_skills_map[s] for s in user_skills.intersection(candidate_skills)]
        complementary_skills = [candidate_skills_map[s] for s in candidate_skills - user_skills]

        # B. Shared Domains
        user_domains_raw = getattr(user, 'domains', []) or []
        cand_domains_raw = getattr(candidate, 'domains', []) or []
        user_domains_map = {d.lower().strip(): d for d in user_domains_raw if d}
        cand_domains_map = {d.lower().strip(): d for d in cand_domains_raw if d}
        common_domain_keys = set(user_domains_map.keys()).intersection(set(cand_domains_map.keys()))
        common_domains = [cand_domains_map[k] for k in common_domain_keys]

        # C. Skills Similarity Score
        if user_skills:
            similarity_score = (len(common_skills) / len(user_skills)) * 100.0
        else:
            similarity_score = 0.0

        # D. Skills Complementarity Score
        user_roles = {SKILL_TO_ROLE[s] for s in user_skills if s in SKILL_TO_ROLE}
        candidate_roles = {SKILL_TO_ROLE[s] for s in candidate_skills if s in SKILL_TO_ROLE}

        user_lacking_roles = ALL_ROLES - user_roles
        if user_lacking_roles and candidate_roles:
            covered_lacking = user_lacking_roles.intersection(candidate_roles)
            complementarity_score = (len(covered_lacking) / len(user_lacking_roles)) * 100.0
        else:
            complementarity_score = 0.0

        skills_score = max(similarity_score, complementarity_score)

        # E. Branch Match (25%)
        branch_score = 0.0
        if getattr(user, 'branch', None) and getattr(candidate, 'branch', None):
            if user.branch.strip().lower() == candidate.branch.strip().lower():
                branch_score = 100.0

        # F. Year Match (15%)
        year_score = 0.0
        if getattr(user, 'year', None) and getattr(candidate, 'year', None):
            if user.year.strip().lower() == candidate.year.strip().lower():
                year_score = 100.0

        # G. University Match (10%)
        uni_score = 0.0
        if getattr(user, 'university', None) and getattr(candidate, 'university', None):
            if user.university.strip().lower() == candidate.university.strip().lower():
                uni_score = 100.0

        # H. Status Match (10%)
        status_score = 0.0
        if getattr(user, 'status', None) and getattr(candidate, 'status', None):
            if user.status == candidate.status:
                status_score = 100.0

        # TF-IDF text similarity
        user_text = f"{getattr(user, 'bio', '') or ''} {' '.join(user_skills_map.values())} {' '.join(user_domains_raw)}".strip()
        cand_text = f"{getattr(candidate, 'bio', '') or ''} {' '.join(candidate_skills_map.values())} {' '.join(cand_domains_raw)}".strip()
        tfidf_sim = 0.0
        if user_text and cand_text:
            try:
                from sklearn.feature_extraction.text import TfidfVectorizer
                from sklearn.metrics.pairwise import cosine_similarity
                vec = TfidfVectorizer(stop_words='english')
                tfidf_matrix = vec.fit_transform([user_text, cand_text])
                tfidf_sim = float(round(cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:2])[0][0], 4))
            except Exception:
                tfidf_sim = 0.0

        total_score = round(
            skills_score * 0.40 +
            branch_score * 0.25 +
            year_score * 0.15 +
            uni_score * 0.10 +
            status_score * 0.10
        )

        if total_score >= 90:
            compatibility_level = "Excellent Match"
        elif total_score >= 75:
            compatibility_level = "Strong Match"
        elif total_score >= 60:
            compatibility_level = "Good Match"
        elif total_score >= 40:
            compatibility_level = "Average Match"
        else:
            compatibility_level = "Low Match"

        # Build match reasons strictly from calculated signals
        if common_skills:
            reasons.append(f"Common skills: {', '.join(common_skills[:3])}")
        if complementary_skills:
            reasons.append(f"Complementary skills: {', '.join(complementary_skills[:3])}")
        if common_domains:
            reasons.append(f"Shared domain interests: {', '.join(common_domains[:2])}")
        if branch_score > 0:
            reasons.append(f"Same academic branch: {candidate.branch}")
        if year_score > 0:
            reasons.append(f"Same academic year: {candidate.year}")
        if tfidf_sim >= 0.15:
            reasons.append(f"High profile text similarity ({tfidf_sim:.2f})")

        if not reasons:
            reasons.append("Foundational project alignment")

        details = {
            "common_skills": common_skills,
            "complementary_skills": complementary_skills,
            "common_domains": common_domains,
            "compatibility_level": compatibility_level,
            "match_reasons": reasons,
            "explanation": reasons
        }

        return total_score, reasons, recommended_role, details

    @classmethod
    async def get_team_matches(cls, db: Session, user_id: str) -> list[TeamMatchCandidate]:
        """
        Retrieve and calculate top 10 matches for a given user efficiently.
        """
        user = db.query(User).options(
            joinedload(User.user_skills).joinedload(UserSkill.skill)
        ).filter(User.id == user_id).first()

        if not user:
            return []

        candidates = db.query(User).options(
            joinedload(User.user_skills).joinedload(UserSkill.skill)
        ).filter(
            User.id != user_id,
            User.is_active == True
        ).all()

        rule_evaluations = []
        for c in candidates:
            rule_score, reasons, recommended_role, details = cls.calculate_match(user, c)
            rule_evaluations.append((c, rule_score, reasons, recommended_role, details))

        rule_evaluations.sort(key=lambda x: x[1], reverse=True)

        top_candidates = rule_evaluations[:10]
        remaining_candidates = rule_evaluations[10:]

        matches = []
        for c, rule_score, reasons, recommended_role, details in top_candidates:
            ml_res = {}
            try:
                from app.services.ml_inference_service import MLInferenceService
                ml_res = MLInferenceService.predict_candidate_match(user, c, recommended_role)
            except Exception as err:
                logger.warning(f"ML inference fallback triggered for candidate {c.id}: {err}")
                ml_res = {"ml_available": False}

            if ml_res.get("ml_available"):
                ml_score = ml_res["ml_score"]
                final_score = int(round(0.70 * ml_score + 0.30 * rule_score))
                
                reasons_with_ml = list(reasons)
                if ml_res.get("cluster_segment"):
                    reasons_with_ml.append(f"Segment: {ml_res['cluster_segment']}")

                matches.append(TeamMatchCandidate(
                    user_id=c.id,
                    id=c.id,
                    name=c.name,
                    compatibility_score=final_score,
                    reasons=reasons_with_ml,
                    recommended_role=recommended_role,
                    avatar=c.avatar,
                    branch=c.branch,
                    year=c.year,
                    university=c.university,
                    ml_score=ml_score,
                    probability_good_fit=ml_res.get("probability_good_fit"),
                    predicted_compatibility=ml_res.get("predicted_compatibility"),
                    cluster_segment=ml_res.get("cluster_segment"),
                    model_version=ml_res.get("model_version", "GradientBoosting-v1.0"),
                    compatibility_level=details["compatibility_level"],
                    common_skills=details["common_skills"],
                    complementary_skills=details["complementary_skills"],
                    common_domains=details["common_domains"],
                    match_reasons=reasons_with_ml,
                    explanation=reasons_with_ml
                ))
            else:
                matches.append(TeamMatchCandidate(
                    user_id=c.id,
                    id=c.id,
                    name=c.name,
                    compatibility_score=rule_score,
                    reasons=reasons,
                    recommended_role=recommended_role,
                    avatar=c.avatar,
                    branch=c.branch,
                    year=c.year,
                    university=c.university,
                    compatibility_level=details["compatibility_level"],
                    common_skills=details["common_skills"],
                    complementary_skills=details["complementary_skills"],
                    common_domains=details["common_domains"],
                    match_reasons=reasons,
                    explanation=reasons
                ))

        for c, rule_score, reasons, recommended_role, details in remaining_candidates:
            matches.append(TeamMatchCandidate(
                user_id=c.id,
                id=c.id,
                name=c.name,
                compatibility_score=rule_score,
                reasons=reasons,
                recommended_role=recommended_role,
                avatar=c.avatar,
                branch=c.branch,
                year=c.year,
                university=c.university,
                compatibility_level=details["compatibility_level"],
                common_skills=details["common_skills"],
                complementary_skills=details["complementary_skills"],
                common_domains=details["common_domains"],
                match_reasons=reasons,
                explanation=reasons
            ))

        # Sort descending by compatibility score
        matches.sort(key=lambda x: x.compatibility_score, reverse=True)

        # Return top 10
        return matches[:10]



