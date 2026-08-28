"""
backend/app/services/ml_inference_service.py

Service bridging SQLAlchemy User backend models to the ML inference engine (ml/inference.py).

ACADEMIC DISCLAIMER:
The compatibility targets used to train/evaluate these models are synthetic experimental targets
and do not represent real historical team outcomes.
"""

import logging
import math
import os
import sys
import re
from typing import Dict, Any, List, Optional

# Ensure project root is in sys.path so root-level packages ('ml') are importable
# regardless of whether the backend is executed from project root or backend/
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.models.user import User

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "off", "over", "under", "again", "further", "then", "once",
    "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
}


def _tokenize(text: str) -> List[str]:
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z0-9_\+#\.-]+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 1]


def _extract_user_skills(user: User) -> set:
    skills = set()
    if hasattr(user, "user_skills") and user.user_skills:
        for us in user.user_skills:
            if hasattr(us, "skill") and us.skill and us.skill.name:
                skills.add(us.skill.name.strip().lower())
    if hasattr(user, "skills") and isinstance(user.skills, list):
        for s in user.skills:
            if isinstance(s, str) and s.strip():
                skills.add(s.strip().lower())
    return skills


def _extract_user_domains(user: User) -> set:
    domains = set()
    if hasattr(user, "domains") and isinstance(user.domains, list):
        for d in user.domains:
            if isinstance(d, str) and d.strip():
                domains.add(d.strip().lower())
    return domains


def _extract_user_interests(user: User) -> set:
    interests = set()
    if hasattr(user, "interests") and isinstance(user.interests, list):
        for i_item in user.interests:
            if isinstance(i_item, str) and i_item.strip():
                interests.add(i_item.strip().lower())
    return interests


def _calculate_profile_completion(user: User) -> int:
    """Calculate legitimate non-PII profile completion percentage (0 to 100)."""
    if not user:
        return 0
    skills = _extract_user_skills(user)
    domains = _extract_user_domains(user)
    completed_fields = sum([
        bool(getattr(user, "bio", None)),
        bool(getattr(user, "university", None) or getattr(user, "college", None)),
        bool(getattr(user, "branch", None)),
        bool(getattr(user, "year", None)),
        bool(skills),
        bool(domains),
        bool(getattr(user, "github", None) or getattr(user, "github_profile", None)),
        bool(getattr(user, "avatar", None))
    ])
    return int(round((completed_fields / 8.0) * 100))


def _sanitize_text_for_ml(text: str, user: Optional[User] = None) -> str:
    """Ensure no PII (name, username, email, ID) enters ML text features."""
    if not text:
        return ""
    sanitized = text
    if user:
        pii_targets = [
            getattr(user, "name", None),
            getattr(user, "username", None),
            getattr(user, "email", None),
            getattr(user, "id", None)
        ]
        for pii in pii_targets:
            if pii and isinstance(pii, str) and len(pii.strip()) > 1:
                sanitized = re.sub(re.escape(pii.strip()), "", sanitized, flags=re.IGNORECASE)
    return sanitized


class MLInferenceService:

    @classmethod
    def is_ml_available(cls) -> bool:
        """Check whether ML inference engine is initialized and models are ready."""
        try:
            from ml.inference import get_inference_engine
            engine = get_inference_engine()
            return engine.is_available()
        except Exception as e:
            logger.warning(f"[MLInferenceService] ML availability check failed: {e}")
            return False

    @classmethod
    def build_feature_dict(cls, user: User, candidate: User, recommended_role: str = "Developer") -> Dict[str, Any]:
        """
        Convert SQLAlchemy User profiles (user & candidate) into the exact 23 feature columns
        expected by trained ML models. STRICTLY EXCLUDES ALL PII.
        """
        user_skills = _extract_user_skills(user)
        candidate_skills = _extract_user_skills(candidate)

        user_domains = _extract_user_domains(user)
        candidate_domains = _extract_user_domains(candidate)

        user_interests = _extract_user_interests(user)
        candidate_interests = _extract_user_interests(candidate)

        # 1. Skill Overlap Features
        matched_skills = user_skills.intersection(candidate_skills)
        matched_skill_count = len(matched_skills)
        required_skill_count = max(1, len(candidate_skills))
        skill_overlap_ratio = round(matched_skill_count / required_skill_count, 4)

        # 2. Interest Overlap Features
        interest_overlap = len(user_interests.intersection(candidate_interests))
        interest_ratio = round(interest_overlap / max(1, len(user_interests)), 4) if user_interests else 0.0

        # 3. Domain Match Features
        domain_overlap = len(user_domains.intersection(candidate_domains))
        domain_match = 1 if domain_overlap > 0 else 0

        # 4. Text Similarity (NON-PII ONLY: bio, branch, year, skills, domains)
        raw_user_bio = _sanitize_text_for_ml(user.bio, user)
        raw_cand_bio = _sanitize_text_for_ml(candidate.bio, candidate)

        user_text = f"{raw_user_bio} {user.branch or ''} {user.year or ''} {' '.join(user_skills)} {' '.join(user_domains)}"
        candidate_text = f"{raw_cand_bio} {candidate.branch or ''} {candidate.year or ''} {' '.join(candidate_skills)} {' '.join(candidate_domains)}"

        user_tokens = set(_tokenize(user_text))
        candidate_tokens = set(_tokenize(candidate_text))

        token_intersect = len(user_tokens.intersection(candidate_tokens))
        token_union = len(user_tokens.union(candidate_tokens))
        text_sim = round(token_intersect / max(1, token_union), 4)

        # TF-IDF similarity approximation
        tfidf_sim = round(min(1.0, text_sim * 1.8), 4)

        # 5. User Academic & Activity Features
        user_branch = user.branch.strip() if user.branch else "Computer Science"
        user_year = user.year.strip() if user.year else "3rd Year"

        user_created_proj = len(getattr(user, "created_projects", []) or [])
        user_member_proj = len(getattr(user, "project_memberships", []) or [])
        user_proj_count = user_created_proj + user_member_proj

        hackathons_won = getattr(user, "hackathons_won", 0) or 0
        hackathons_part = getattr(user, "hackathons_participated", 0) or (hackathons_won + (1 if user_proj_count > 0 else 0))

        gh_profile = getattr(user, "github_profile", None)
        gh_stats = getattr(user, "github_stats", {}) or {}

        gh_repos = 0
        gh_commits = 0
        gh_stars = 0

        if gh_profile:
            gh_repos = int(getattr(gh_profile, "repos", 0) or 0)
            gh_commits = int(getattr(gh_profile, "commits", 0) or 0)
            gh_stars = int(getattr(gh_profile, "stars", 0) or 0)
        elif isinstance(gh_stats, dict) and gh_stats:
            gh_repos = int(gh_stats.get("repos", 0) or 0)
            gh_commits = int(gh_stats.get("commits", 0) or 0)
            gh_stars = int(gh_stats.get("stars", 0) or 0)

        profile_comp = getattr(user, "profile_completion", None)
        if profile_comp is None:
            profile_comp = _calculate_profile_completion(user)

        # 6. Candidate / Project Features
        proj_tech_count = max(1, len(candidate_skills))
        proj_domain = list(candidate_domains)[0].title() if candidate_domains else "Full Stack Web"
        proj_desc_len = len(raw_cand_bio) if raw_cand_bio else 100

        return {
            "tfidf_similarity": tfidf_sim,
            "student_project_text_similarity": text_sim,
            "skill_overlap_count": matched_skill_count,
            "skill_overlap_ratio": skill_overlap_ratio,
            "required_skill_count": required_skill_count,
            "matched_skill_count": matched_skill_count,
            "interest_overlap_count": interest_overlap,
            "interest_overlap_ratio": interest_ratio,
            "domain_match": domain_match,
            "domain_overlap_count": domain_overlap,
            "student_project_count": user_proj_count,
            "hackathons_participated": hackathons_part,
            "hackathons_won": hackathons_won,
            "github_repos": gh_repos,
            "github_commits": gh_commits,
            "github_stars": gh_stars,
            "profile_completion": profile_comp,
            "student_branch": user_branch,
            "student_year": user_year,
            "project_technology_count": proj_tech_count,
            "project_domain": proj_domain,
            "project_role": recommended_role,
            "project_description_length": proj_desc_len
        }

    @classmethod
    def predict_candidate_match(cls, user: User, candidate: User, recommended_role: str = "Developer") -> Dict[str, Any]:
        """
        Predict ML recommendation scores and segment for a candidate user.
        Safely falls back to default empty payload if ML prediction fails.
        """
        try:
            from ml.inference import get_inference_engine
            engine = get_inference_engine()

            if not engine.is_available():
                return {"ml_available": False}

            # Build 23-column feature dictionary (strictly Non-PII)
            feat_dict = cls.build_feature_dict(user, candidate, recommended_role)

            # Predict Pair Match
            prediction = engine.predict_pair(feat_dict)

            # Extract real candidate GitHub stats from database
            cand_gh_profile = getattr(candidate, "github_profile", None)
            cand_gh_stats = getattr(candidate, "github_stats", {}) or {}

            cand_repos = 0
            cand_commits = 0
            cand_stars = 0
            cand_followers = 0

            if cand_gh_profile:
                cand_repos = int(getattr(cand_gh_profile, "repos", 0) or 0)
                cand_commits = int(getattr(cand_gh_profile, "commits", 0) or 0)
                cand_stars = int(getattr(cand_gh_profile, "stars", 0) or 0)
                cand_followers = int(getattr(cand_gh_profile, "followers", 0) or 0)
            elif isinstance(cand_gh_stats, dict) and cand_gh_stats:
                cand_repos = int(cand_gh_stats.get("repos", 0) or 0)
                cand_commits = int(cand_gh_stats.get("commits", 0) or 0)
                cand_stars = int(cand_gh_stats.get("stars", 0) or 0)
                cand_followers = int(cand_gh_stats.get("followers", 0) or 0)

            # Extract real candidate project & hackathon stats from database
            cand_created_proj = len(getattr(candidate, "created_projects", []) or [])
            cand_member_proj = len(getattr(candidate, "project_memberships", []) or [])
            cand_proj_count = cand_created_proj + cand_member_proj

            cand_h_won = int(getattr(candidate, "hackathons_won", 0) or 0)
            cand_h_part = int(getattr(candidate, "hackathons_participated", 0) or (cand_h_won + (1 if cand_proj_count > 0 else 0)))

            cand_completion = getattr(candidate, "profile_completion", None)
            if cand_completion is None:
                cand_completion = _calculate_profile_completion(candidate)

            # Predict Candidate Cluster Segment (Real non-PII candidate features)
            cand_profile = {
                "skill_count": len(_extract_user_skills(candidate)),
                "interest_count": len(_extract_user_interests(candidate)),
                "domain_count": len(_extract_user_domains(candidate)),
                "project_count": cand_proj_count,
                "project_technology_count": len(_extract_user_skills(candidate)),
                "hackathons_participated": cand_h_part,
                "hackathons_won": cand_h_won,
                "github_repos": cand_repos,
                "github_commits": cand_commits,
                "github_stars": cand_stars,
                "github_followers": cand_followers,
                "profile_completion": cand_completion,
                "skills": list(_extract_user_skills(candidate)),
                "interests": list(_extract_user_interests(candidate)),
                "domains": list(_extract_user_domains(candidate))
            }
            cluster_res = engine.predict_cluster(cand_profile)

            return {
                "ml_available": True,
                "ml_score": prediction["ml_final_score"],
                "probability_good_fit": prediction["prob_good_fit"],
                "predicted_compatibility": prediction["pred_compat_score"],
                "cluster_id": cluster_res["cluster_id"],
                "cluster_segment": cluster_res["cluster_segment"],
                "model_version": prediction["model_version"],
                "explanation": ". ".join(prediction["signals"]) if prediction["signals"] else "High feature alignment."
            }

        except Exception as e:
            logger.warning(f"[MLInferenceService] Candidate prediction failed gracefully: {e}")
            return {"ml_available": False}

