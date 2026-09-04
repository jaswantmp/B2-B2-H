# app/services/hackathon_recommendation_service.py
import os
import sys
import re
import math
import logging
from datetime import datetime
from typing import Dict, List, Any

# Ensure project root is in sys.path so root-level packages ('ml') are importable
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from sqlalchemy.orm import Session, selectinload
from app.models.hackathon import Hackathon
from app.models.user import User, UserSkill
from app.models.project import Project, ProjectMember

from app.constants.recommendation_constants import (
    KNOWN_TECHNICAL_SKILLS,
    KNOWN_DOMAINS,
    BRANCH_DOMAIN_MAPPING,
    SKILL_SYNONYMS,
    DOMAIN_SYNONYMS,
    YEAR_SUITABILITY,
)

logger = logging.getLogger(__name__)

STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
}


def tokenize(text: str) -> List[str]:
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z0-9_\+#\.-]+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 1]


def compute_tfidf_similarity(text1: str, text2: str) -> float:
    t1 = tokenize(text1)
    t2 = tokenize(text2)
    if not t1 or not t2:
        return 0.0
    from collections import Counter
    v1 = Counter(t1)
    v2 = Counter(t2)
    common = set(v1.keys()).intersection(set(v2.keys()))
    if not common:
        return 0.0
    dot = sum(v1[w] * v2[w] for w in common)
    n1 = math.sqrt(sum(c * c for c in v1.values()))
    n2 = math.sqrt(sum(c * c for c in v2.values()))
    if n1 == 0 or n2 == 0:
        return 0.0
    return float(round(dot / (n1 * n2), 4))


def parse_team_size_max(team_size_str: str) -> int:
    if not team_size_str:
        return 4
    digits = re.findall(r'\d+', str(team_size_str))
    if digits:
        return max(int(d) for d in digits)
    return 4


class HackathonRecommendationService:
    @staticmethod
    def normalize_string(val: str, synonyms: dict) -> str:
        if not val:
            return ""
        v = val.lower().strip()
        v = re.sub(r'[-_]', ' ', v)
        v = re.sub(r'\s+', ' ', v)
        return synonyms.get(v, v)

    @classmethod
    def get_recommendations(cls, db: Session, user: User) -> dict:
        """
        Generate ML-based hackathon recommendations using the trained HistGradientBoostingRegressor
        pipeline loaded by MLInferenceEngine.
        """
        # 1. Fetch and filter eligible hackathons (end_date >= current time)
        current_time = datetime.utcnow()
        all_hackathons = (
            db.query(Hackathon)
            .options(selectinload(Hackathon.registrations))
            .filter(Hackathon.end_date >= current_time)
            .all()
        )
        if not all_hackathons:
            all_hackathons = (
                db.query(Hackathon)
                .options(selectinload(Hackathon.registrations))
                .all()
            )
        total_hackathons_count = len(all_hackathons)

        if total_hackathons_count == 0:
            return {
                "total_hackathons": 0,
                "recommended_count": 0,
                "recommendations": []
            }

        # 2. Extract and Normalize User Features
        user_skills_set = set()
        user_verified_skills = set()
        for us in getattr(user, 'user_skills', []) or []:
            if us.skill:
                norm_s = cls.normalize_string(us.skill.name, SKILL_SYNONYMS)
                user_skills_set.add(norm_s)
                if getattr(us, 'is_verified', False):
                    user_verified_skills.add(norm_s)

        user_domains_set = set()
        for d in (user.domains or []):
            if d:
                user_domains_set.add(cls.normalize_string(d, DOMAIN_SYNONYMS))

        user_interests_set = set()
        for i_item in (getattr(user, 'interests', []) or []):
            if i_item:
                user_interests_set.add(cls.normalize_string(i_item, DOMAIN_SYNONYMS))

        user_branch_norm = cls.normalize_string(user.branch or "", {})
        branch_domains = set()
        for key, doms in BRANCH_DOMAIN_MAPPING.items():
            if key in user_branch_norm or user_branch_norm in key:
                branch_domains.update(doms)
                break

        user_year_val = YEAR_SUITABILITY.get(user.year, 10) / 10.0

        # GitHub and Activity metrics
        gh = getattr(user, "github_profile", None)
        repos = getattr(gh, "repos", 0) if gh else 0
        commits = getattr(gh, "commits", 0) if gh else 0
        stars = getattr(gh, "stars", 0) if gh else 0

        proj_created = db.query(Project.id).filter(Project.creator_id == user.id).count()
        proj_member = db.query(ProjectMember.id).filter(ProjectMember.user_id == user.id).count()
        total_projects = proj_created + proj_member

        h_won = getattr(user, "hackathons_won", 0) or 0
        h_part = h_won + (1 if total_projects > 0 else 0)

        # Profile completion
        comp_fields = [
            bool(user.name), bool(user.bio), bool(user.university), bool(user_skills_set),
            bool(user_domains_set), bool(getattr(user, "github", None))
        ]
        profile_comp = round(sum(comp_fields) / len(comp_fields), 2)

        user_text = f"{user.bio or ''} {' '.join(user_skills_set)} {' '.join(user_domains_set)}".strip()

        # 3. Construct Feature Dictionaries for all candidate hackathons
        combined_synonyms = {**SKILL_SYNONYMS, **DOMAIN_SYNONYMS}
        feature_dicts = []
        candidate_metadata = []

        for hk in all_hackathons:
            tracks_norm = [cls.normalize_string(t, SKILL_SYNONYMS) for t in (hk.tracks or []) if t]
            tags_norm = [cls.normalize_string(t, DOMAIN_SYNONYMS) for t in (hk.tags or []) if t]

            hk_skills = set()
            hk_domains = set()
            for item in (tracks_norm + tags_norm):
                norm_item = cls.normalize_string(item, combined_synonyms)
                for sk in KNOWN_TECHNICAL_SKILLS:
                    if sk == norm_item or sk in norm_item or norm_item in sk:
                        hk_skills.add(sk)
                for dom in KNOWN_DOMAINS:
                    if dom == norm_item or dom in norm_item or norm_item in dom:
                        hk_domains.add(dom)

            matched_skills_set = user_skills_set.intersection(hk_skills)
            matched_domains_set = user_domains_set.intersection(hk_domains)
            matched_interests_set = user_interests_set.intersection(set(tags_norm))

            req_skills_cnt = max(1, len(hk_skills))
            skill_overlap_cnt = len(matched_skills_set)
            skill_overlap_ratio = round(skill_overlap_cnt / req_skills_cnt, 4)

            domain_match = 1.0 if matched_domains_set else 0.0
            domain_overlap_cnt = len(matched_domains_set)

            branch_align = 1.0 if branch_domains.intersection(hk_domains) else 0.0

            hk_text = f"{hk.title} {hk.description} {' '.join(hk.tracks or [])} {' '.join(hk.tags or [])}".strip()
            tfidf_sim = compute_tfidf_similarity(user_text, hk_text)

            team_size_max = parse_team_size_max(hk.team_size)

            feat = {
                "tfidf_similarity": tfidf_sim,
                "skill_overlap_count": skill_overlap_cnt,
                "skill_overlap_ratio": skill_overlap_ratio,
                "skill_count": len(user_skills_set),
                "verified_skill_count": len(user_verified_skills),
                "domain_match": domain_match,
                "domain_overlap_count": domain_overlap_cnt,
                "interest_overlap_count": len(matched_interests_set),
                "branch_alignment": branch_align,
                "year_suitability": user_year_val,
                "student_branch": user.branch.strip() if user.branch else "Computer Science",
                "student_year": user.year.strip() if user.year else "3rd Year",
                "student_project_count": total_projects,
                "hackathons_participated": h_part,
                "hackathons_won": h_won,
                "github_repos": repos,
                "github_commits": commits,
                "github_stars": stars,
                "profile_completion": profile_comp,
                "hackathon_track_count": len(hk.tracks or []),
                "hackathon_tag_count": len(hk.tags or []),
                "hackathon_description_length": len(hk.description or ""),
                "hackathon_team_size_max": team_size_max
            }
            feature_dicts.append(feat)

            # Display skills & domains
            display_matched_skills = []
            for us in getattr(user, 'user_skills', []) or []:
                if us.skill:
                    norm = cls.normalize_string(us.skill.name, SKILL_SYNONYMS)
                    if norm in matched_skills_set and us.skill.name not in display_matched_skills:
                        display_matched_skills.append(us.skill.name)

            display_matched_domains = []
            for d in (user.domains or []):
                if d:
                    norm = cls.normalize_string(d, DOMAIN_SYNONYMS)
                    if norm in matched_domains_set and d not in display_matched_domains:
                        display_matched_domains.append(d)

            # Rule baseline components (for benchmark, fallback, and breakdown compatibility)
            rule_skills = round((len(matched_skills_set) / max(1, len(user_skills_set))) * 40) if user_skills_set else 0
            rule_domains = round((len(matched_domains_set) / max(1, len(user_domains_set))) * 35) if user_domains_set else 0
            rule_branch = 15 if branch_align > 0 else 0
            rule_year = int(YEAR_SUITABILITY.get(user.year, 10))
            rule_score = rule_skills + rule_domains + rule_branch + rule_year

            candidate_metadata.append({
                "hackathon": hk,
                "display_matched_skills": display_matched_skills,
                "display_matched_domains": display_matched_domains,
                "branch_align": branch_align,
                "tfidf_sim": tfidf_sim,
                "rule_skills": rule_skills,
                "rule_domains": rule_domains,
                "rule_branch": rule_branch,
                "rule_year": rule_year,
                "rule_score": rule_score
            })


        # 4. Invoke ML Inference Engine
        ml_results = []
        try:
            from ml.inference import get_inference_engine
            ml_engine = get_inference_engine()
            if ml_engine.is_available():
                ml_results = ml_engine.predict_hackathon_scores(feature_dicts)
        except Exception as e:
            logger.warning(f"[HackathonRecommendationService] ML inference failed, falling back to rule score: {e}")
            ml_results = []

        recommendations = []
        for idx, meta in enumerate(candidate_metadata):
            hk = meta["hackathon"]
            matched_skills = meta["display_matched_skills"]
            matched_domains = meta["display_matched_domains"]
            branch_align = meta["branch_align"]
            tfidf_sim = meta["tfidf_sim"]
            rule_score = meta["rule_score"]

            if idx < len(ml_results):
                ml_info = ml_results[idx]
                score = ml_info["score"]
                ml_score = ml_info["ml_score"]
                model_version = ml_info.get("model_version", "hackathon_recommender_v1")
                is_ml = True
            else:
                score = min(99, max(40, rule_score))
                ml_score = float(score)
                model_version = "legacy_rule_baseline"
                is_ml = False

            # Compile concise explainability reasons
            explanation = []
            if matched_skills:
                explanation.append(f"Matched Skills: {', '.join(matched_skills[:3])}")
            else:
                explanation.append("Matched Skills: General technical alignment")

            if matched_domains:
                explanation.append(f"Matched Domains: {', '.join(matched_domains[:2])}")

            if branch_align > 0:
                explanation.append(f"Branch Alignment: {user.branch or 'Aligned'}")

            if tfidf_sim >= 0.15:
                explanation.append(f"High track text similarity ({tfidf_sim:.2f})")

            explanation.append(f"Suitable for {user.year or 'General'}")

            # Match label categorization
            if score >= 90:
                label = "Excellent Match"
            elif score >= 75:
                label = "Strong Match"
            elif score >= 60:
                label = "Good Match"
            elif score >= 40:
                label = "Average Match"
            else:
                label = "Average Match"

            recommendations.append({
                "hackathon": hk,
                "score": score,
                "recommendation_score": score,
                "ml_score": ml_score,
                "model_version": model_version,
                "is_ml_powered": is_ml,
                "label": label,
                "breakdown": {
                    "skills": meta["rule_skills"],
                    "domains": meta["rule_domains"],
                    "branch": meta["rule_branch"],
                    "year": meta["rule_year"],
                    "ml_score": ml_score,
                    "rule_baseline_score": rule_score,
                    "tfidf_similarity": tfidf_sim,
                    "matched_skills_count": len(matched_skills),
                    "matched_domains_count": len(matched_domains)
                },
                "matched_skills": matched_skills,
                "matched_domains": matched_domains,
                "missing_skills": [],
                "explanation": explanation,
                "match_reasons": explanation
            })

        # 5. Multi-tiered Tie-breaker Sorting
        #   - ML score (descending)
        #   - end_date (ascending, sooner first)
        #   - date (ascending)
        #   - title (alphabetically)
        recommendations.sort(key=lambda x: (
            -x["score"],
            x["hackathon"].end_date,
            x["hackathon"].date,
            x["hackathon"].title
        ))

        # Slice top 10
        top_recommendations = recommendations[:10]

        return {
            "total_hackathons": total_hackathons_count,
            "recommended_count": len(top_recommendations),
            "recommendations": top_recommendations
        }
