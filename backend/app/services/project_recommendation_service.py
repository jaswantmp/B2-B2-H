# app/services/project_recommendation_service.py
import math
import re
import logging
from typing import Dict, List, Any
from sqlalchemy.orm import Session, joinedload, selectinload
from app.models.project import Project, ProjectMember, ProjectApplication
from app.models.user import User, UserSkill
from ml.inference import get_inference_engine, CLUSTER_SEGMENTS

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

def compute_cosine_similarity(vec1: Dict[str, float], vec2: Dict[str, float]) -> float:
    if not vec1 or not vec2:
        return 0.0
    common = set(vec1.keys()).intersection(set(vec2.keys()))
    if not common:
        return 0.0
    dot_product = sum(vec1[w] * vec2[w] for w in common)
    norm1 = math.sqrt(sum(v * v for v in vec1.values()))
    norm2 = math.sqrt(sum(v * v for v in vec2.values()))
    if norm1 == 0 or norm2 == 0:
        return 0.0
    return dot_product / (norm1 * norm2)


class ProjectRecommendationService:
    @classmethod
    def get_recommendations(cls, db: Session, user: User, limit: int = 10) -> Dict[str, Any]:
        """
        Generate ML-based project recommendations for the authenticated user.
        Uses MLInferenceEngine singleton (Gradient Boosting + TF-IDF cosine similarity).
        """
        # 1. Eager load user profile data including skills, github, created projects and memberships
        user_db = (
            db.query(User)
            .options(
                joinedload(User.user_skills).joinedload(UserSkill.skill),
                joinedload(User.github_profile),
                selectinload(User.created_projects),
                selectinload(User.project_memberships)
            )
            .filter(User.id == user.id)
            .first()
        )
        if not user_db:
            user_db = user

        # 2. Extract user skill sets & interests
        user_skills_raw = [us.skill.name for us in getattr(user_db, 'user_skills', []) if us.skill]
        user_skills_set = {s.lower().strip() for s in user_skills_raw}
        verified_skills_set = {
            us.skill.name.lower().strip()
            for us in getattr(user_db, 'user_skills', [])
            if us.skill and us.is_verified
        }

        user_domains = [d.lower().strip() for d in (user_db.domains or [])]
        user_branch = (user_db.branch or "").lower().strip()
        user_year = (user_db.year or "").lower().strip()

        # 3. Identify user's existing project IDs (created, member, or applied)
        created_ids = {p.id for p in getattr(user_db, 'created_projects', [])}
        member_ids = {pm.project_id for pm in getattr(user_db, 'project_memberships', [])}
        
        applied_applications = db.query(ProjectApplication.project_id).filter(
            ProjectApplication.user_id == user.id
        ).all()
        applied_ids = {a.project_id for a in applied_applications}

        excluded_ids = created_ids.union(member_ids).union(applied_ids)

        # 4. Fetch candidate projects with relationships eagerly loaded (top 30 recent)
        all_projects = (
            db.query(Project)
            .options(
                joinedload(Project.creator),
                selectinload(Project.members).joinedload(ProjectMember.user)
            )
            .filter(Project.id.notin_(excluded_ids) if excluded_ids else True)
            .order_by(Project.created_at.desc())
            .limit(30)
            .all()
        )

        if not all_projects:
            return {
                "total_projects": 0,
                "recommended_count": 0,
                "recommendations": []
            }

        # 5. Build TF-IDF document vectors
        user_bio = user_db.bio or ""
        user_text = f"{user_bio} {user_branch} {user_year} {' '.join(user_skills_raw)} {' '.join(user_domains)}"
        user_doc = tokenize(user_text)

        project_docs = []
        for p in all_projects:
            p_text = f"{p.title} {p.description} {' '.join(p.tech or [])} {' '.join(p.open_roles or [])} {p.category}"
            project_docs.append(tokenize(p_text))

        all_docs = [user_doc] + project_docs
        N = len(all_docs)

        df_map = {}
        for doc in all_docs:
            for w in set(doc):
                df_map[w] = df_map.get(w, 0) + 1

        idf_map = {w: math.log((1 + N) / (1 + cnt)) + 1 for w, cnt in df_map.items()}

        def build_tfidf_vec(doc):
            if not doc:
                return {}
            tf = {}
            for w in doc:
                tf[w] = tf.get(w, 0) + 1
            vec = {}
            sq_sum = 0.0
            for w, cnt in tf.items():
                val = (cnt / max(1, len(doc))) * idf_map[w]
                vec[w] = val
                sq_sum += val * val
            norm = math.sqrt(sq_sum) if sq_sum > 0 else 1.0
            return {w: val / norm for w, val in vec.items()}

        user_vec = build_tfidf_vec(user_doc)
        project_vecs = [build_tfidf_vec(doc) for doc in project_docs]

        # 6. Initialize ML Inference Engine
        ml_engine = get_inference_engine()

        # Gather GitHub stats if available
        gh = getattr(user_db, 'github_profile', None)
        github_repos = getattr(gh, 'repos', 0) if gh else 0
        github_commits = getattr(gh, 'commits', 0) if gh else 0
        github_stars = getattr(gh, 'stars', 0) if gh else 0

        # Profile completion estimate
        completed_fields = sum([
            bool(user_db.name), bool(user_db.bio), bool(user_db.university),
            bool(user_skills_raw), bool(user_domains), bool(user_db.github)
        ])
        profile_completion = round(completed_fields / 6.0, 2)

        recommendations = []
        feature_dicts = []
        parsed_candidates = []

        # 7. Evaluate each candidate project features
        for idx, p in enumerate(all_projects):
            p_tech_list = p.tech or []
            p_roles_list = p.open_roles or []
            p_skills_required = set([t.lower().strip() for t in p_tech_list + p_roles_list])

            matched_skills_list = []
            for sk_raw in user_skills_raw:
                sk_clean = sk_raw.lower().strip()
                if sk_clean in p_skills_required or any(sk_clean in req or req in sk_clean for req in p_skills_required):
                    if sk_raw not in matched_skills_list:
                        matched_skills_list.append(sk_raw)

            req_count = max(1, len(p_skills_required))
            matched_count = len(matched_skills_list)
            skill_ratio = min(1.0, round(matched_count / req_count, 4))

            # Domain & Interest alignment
            p_category = (p.category or "").lower().strip()
            domain_match = 1.0 if p_category in user_domains or any(ud in p_category for ud in user_domains) else 0.0

            interest_overlap_cnt = sum(1 for ud in user_domains if ud in p_category or any(t.lower() in ud for t in p_tech_list))
            interest_overlap_ratio = min(1.0, interest_overlap_cnt / max(1, len(user_domains))) if user_domains else 0.0

            # TF-IDF similarity
            tfidf_sim = round(compute_cosine_similarity(user_vec, project_vecs[idx]), 4)

            # Construct exact 23-feature dict expected by MLInferenceEngine
            feature_dict = {
                "tfidf_similarity": tfidf_sim,
                "student_project_text_similarity": tfidf_sim,
                "skill_overlap_count": matched_count,
                "skill_overlap_ratio": skill_ratio,
                "required_skill_count": req_count,
                "matched_skill_count": matched_count,
                "interest_overlap_count": interest_overlap_cnt,
                "interest_overlap_ratio": interest_overlap_ratio,
                "domain_match": domain_match,
                "domain_overlap_count": int(domain_match),
                "student_project_count": len(getattr(user_db, 'created_projects', [])) + len(getattr(user_db, 'project_memberships', [])),
                "hackathons_participated": getattr(user_db, 'hackathons_won', 0) + 1,
                "hackathons_won": getattr(user_db, 'hackathons_won', 0),
                "github_repos": github_repos,
                "github_commits": github_commits,
                "github_stars": github_stars,
                "profile_completion": profile_completion,
                "student_branch": user_branch,
                "student_year": user_year,
                "project_technology_count": len(p_tech_list),
                "project_domain": p_category,
                "project_role": p_roles_list[0] if p_roles_list else "Developer",
                "project_description_length": len(p.description or "")
            }
            feature_dicts.append(feature_dict)

            # Deterministic, non-fake match explanations
            reasons = []
            if matched_skills_list:
                reasons.append(f"Matches {len(matched_skills_list)} skill(s): {', '.join(matched_skills_list[:3])}")
            else:
                reasons.append("Good opportunity to gain experience in new tech stack")

            if domain_match > 0 or interest_overlap_cnt > 0:
                reasons.append(f"Aligned with your {p.category.capitalize()} domain interests")

            if tfidf_sim >= 0.15:
                reasons.append(f"High text similarity ({tfidf_sim:.2f}) with your profile bio & skills")

            if verified_skills_set.intersection({s.lower().strip() for s in matched_skills_list}):
                reasons.append("Matches your verified profile skills")

            if p.open_roles:
                reasons.append(f"Open role available: {p.open_roles[0]}")

            # Format project output object
            proj_dict = {
                "id": p.id,
                "title": p.title,
                "description": p.description,
                "category": p.category,
                "university": p.university or "SKCET",
                "status": p.status,
                "deadline": p.deadline.isoformat() if p.deadline else None,
                "tech": p.tech or [],
                "open_roles": p.open_roles or [],
                "openRoles": p.open_roles or [],
                "creator": {
                    "id": p.creator.id if p.creator else "",
                    "name": p.creator.name if p.creator else "Project Lead",
                    "username": p.creator.username if p.creator else "creator",
                    "avatar": p.creator.avatar if p.creator else None
                } if p.creator else None,
                "team": [
                    {
                        "id": m.user.id if m and getattr(m, 'user', None) else "",
                        "name": m.user.name if m and getattr(m, 'user', None) else "Member",
                        "role": m.role or "Member" if m else "Member",
                        "avatar": m.user.avatar if m and getattr(m, 'user', None) else None,
                        "skills": []
                    }
                    for m in (p.members or []) if m and getattr(m, 'user', None)
                ]
            }

            parsed_candidates.append({
                "project": proj_dict,
                "matched_skills": matched_skills_list,
                "reasons": reasons,
                "tfidf_sim": tfidf_sim,
                "skill_ratio": skill_ratio
            })

        # 8. Run Vectorized Batch ML Inference
        if ml_engine and ml_engine.is_available() and feature_dicts:
            ml_results = ml_engine.predict_batch(feature_dicts)
        else:
            ml_results = []

        for idx, item in enumerate(parsed_candidates):
            if idx < len(ml_results):
                ml_res = ml_results[idx]
                prob_good_fit = ml_res["prob_good_fit"]
                pred_compat_score = ml_res["pred_compat_score"]
                ml_final_score = ml_res["ml_final_score"]
            else:
                skill_r = item["skill_ratio"]
                tfidf_s = item["tfidf_sim"]
                prob_good_fit = round(0.5 + (0.3 * skill_r) + (0.2 * tfidf_s), 2)
                pred_compat_score = round(50.0 + (30.0 * skill_r) + (20.0 * tfidf_s), 2)
                ml_final_score = round(0.5 * pred_compat_score + 50.0 * prob_good_fit, 2)

            overall_score = min(99, max(45, int(round(ml_final_score))))

            recommendations.append({
                "project": item["project"],
                "match_score": overall_score,
                "ml_score": ml_final_score,
                "probability_good_fit": prob_good_fit,
                "predicted_compatibility": pred_compat_score,
                "matched_skills": item["matched_skills"],
                "match_reasons": item["reasons"]
            })

        # 9. Sort recommendations by match_score descending
        recommendations.sort(key=lambda r: r["match_score"], reverse=True)
        top_recommendations = recommendations[:limit]

        return {
            "total_projects": len(all_projects),
            "recommended_count": len(top_recommendations),
            "recommendations": top_recommendations
        }
