# app/services/team_health_service.py
import math
import logging
from itertools import combinations
from typing import Dict, Any, List, Optional
import numpy as np
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

BRANCH_GROUPS = {
    "cs": {"computer science", "information technology", "software engineering", "computer engineering", "cse", "it"},
    "ece_ee": {"electronics", "electrical", "ece", "eee", "embedded"},
    "mech_civil": {"mechanical", "civil", "aerospace", "mechatronics"}
}


class TeamHealthService:
    CATEGORIES = CATEGORY_KEYWORDS

    @classmethod
    def _extract_member_features(cls, member, db: Optional[Session] = None) -> dict:
        """
        Extract non-PII features from a TeamMember model.
        STRICTLY EXCLUDES: student_id, name, username, email, auth tokens.
        """
        user = getattr(member, 'user', None)
        if not user:
            return {
                "member_key": getattr(member, 'id', 'anon'),
                "role": getattr(member, 'role', 'Member'),
                "skills": [],
                "domains": [],
                "interests": [],
                "commits": 0,
                "repos": 0,
                "stars": 0,
                "projects": 0,
                "hackathons_won": 0,
                "branch": "",
                "year": "",
                "year_num": 3,
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
        interests = [i.lower().strip() for i in (getattr(user, 'interests', []) or []) if isinstance(i, str)]

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

        # 4. Projects count
        projects_count = 0
        if hasattr(user, 'student_projects') and user.student_projects:
            projects_count = len(user.student_projects)
        elif hasattr(user, 'projects') and user.projects:
            projects_count = len(user.projects)
        elif db and user:
            try:
                from app.models.project import ProjectMember
                projects_count = db.query(ProjectMember).filter(ProjectMember.user_id == user.id).count()
            except Exception:
                projects_count = 0

        # 5. Year as numeric integer
        year_str = getattr(user, 'year', '') or ''
        year_num = 3
        for c in str(year_str):
            if c.isdigit():
                year_num = int(c)
                break

        # 6. K-Means Student Cluster
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
            "member_key": str(getattr(member, 'id', 'anon')),
            "role": (getattr(member, 'role', '') or 'Member').strip(),
            "skills": skills,
            "domains": domains,
            "interests": interests,
            "commits": commits,
            "repos": repos,
            "stars": stars,
            "projects": projects_count,
            "hackathons_won": getattr(user, 'hackathons_won', 0) or 0,
            "branch": getattr(user, 'branch', '') or '',
            "year": getattr(user, 'year', '') or '',
            "year_num": year_num,
            "cluster_id": cluster_id,
            "cluster_confidence": cluster_confidence
        }

    @classmethod
    def _compute_pair_features(cls, a: dict, b: dict) -> dict:
        """Compute Level 1 pair features between two team members (Non-PII)."""
        skills_a = {s["name_lower"] for s in a.get("skills", [])}
        skills_b = {s["name_lower"] for s in b.get("skills", [])}
        shared_skills = skills_a & skills_b
        union_skills = skills_a | skills_b
        overlap_count = len(shared_skills)
        overlap_ratio = round(overlap_count / max(1, len(union_skills)), 4)
        complementary_count = len(union_skills - shared_skills)

        domains_a = set(a.get("domains", []))
        domains_b = set(b.get("domains", []))
        shared_domains = domains_a & domains_b
        domain_match = 1 if len(shared_domains) > 0 else 0
        domain_overlap_count = len(shared_domains)

        interests_a = set(a.get("interests", []))
        interests_b = set(b.get("interests", []))
        interest_overlap_count = len(interests_a & interests_b)

        text_a = skills_a | domains_a
        text_b = skills_b | domains_b
        sim = len(text_a & text_b) / max(1, len(text_a | text_b))

        branch_compat = 0.5
        b_a = (a.get("branch") or "").lower()
        b_b = (b.get("branch") or "").lower()
        for group in BRANCH_GROUPS.values():
            if any(term in b_a for term in group) and any(term in b_b for term in group):
                branch_compat = 1.0
                break

        y_a = a.get("year_num", 3)
        y_b = b.get("year_num", 3)
        year_diff = abs(y_a - y_b)
        cluster_syn = 1.0 if a.get("cluster_id") != b.get("cluster_id") else 0.6
        gh_commits = a.get("commits", 0) + b.get("commits", 0)
        gh_repos = a.get("repos", 0) + b.get("repos", 0)
        proj_total = a.get("projects", 0) + b.get("projects", 0)
        exp_balance = abs(a.get("projects", 0) - b.get("projects", 0))

        return {
            "skill_overlap_count": overlap_count,
            "skill_overlap_ratio": overlap_ratio,
            "complementary_skill_count": complementary_count,
            "domain_match": domain_match,
            "domain_overlap_count": domain_overlap_count,
            "interest_overlap_count": interest_overlap_count,
            "tfidf_similarity": round(sim, 4),
            "branch_compatibility": branch_compat,
            "year_difference": year_diff,
            "cluster_synergy": cluster_syn,
            "github_commits_total": gh_commits,
            "github_repos_total": gh_repos,
            "project_count_total": proj_total,
            "experience_balance": exp_balance,
            "profile_completion_avg": 0.80
        }

    @classmethod
    def _compute_team_health_features(cls, members_features: list[dict], health_scores: dict[str, int], engine=None) -> dict:
        """Compute the dedicated 18-feature contract for team_health_v1 ML inference."""
        k = len(members_features)
        pair_scores = []
        pair_jaccards = []

        if k >= 2:
            pair_dicts = []
            for a, b in combinations(members_features, 2):
                pf = cls._compute_pair_features(a, b)
                pair_dicts.append(pf)
                di_a = set(a.get("domains", [])) | set(a.get("interests", []))
                di_b = set(b.get("domains", [])) | set(b.get("interests", []))
                jacc = len(di_a & di_b) / max(1, len(di_a | di_b))
                pair_jaccards.append(jacc)

            try:
                if engine is not None and engine.is_team_generator_model_available():
                    pair_scores = engine.predict_team_pair_scores(pair_dicts)
            except Exception as e:
                logger.debug(f"Pair scoring in team health failed: {e}")

            if not pair_scores:
                pair_scores = [
                    70.0 + pf["skill_overlap_ratio"] * 15.0 + pf["domain_match"] * 10.0
                    for pf in pair_dicts
                ]
        else:
            pair_scores = [75.0]
            pair_jaccards = [0.5]

        mean_pair_compat = round(float(np.mean(pair_scores)), 2) if pair_scores else 75.0
        min_pair_compat = round(float(np.min(pair_scores)), 2) if pair_scores else 70.0
        std_pair_compat = round(float(np.std(pair_scores)), 2) if pair_scores else 0.0
        domain_jaccard_mean = round(float(np.mean(pair_jaccards)), 4) if pair_jaccards else 0.25

        # Functional category entropy
        cat_scores_vals = list(health_scores.values())
        tot_cats = sum(cat_scores_vals)
        if tot_cats > 0:
            entropy = 0.0
            for val in cat_scores_vals:
                if val > 0:
                    p = val / tot_cats
                    entropy -= p * math.log2(p)
            norm_entropy = round(min(1.0, max(0.0, entropy / math.log2(5))), 4)
        else:
            norm_entropy = 0.0

        all_skills = []
        for m in members_features:
            all_skills.extend([s["name_lower"] for s in m.get("skills", [])])
        unique_skills = set(all_skills)
        unique_skill_count = len(unique_skills)
        core_skill_redundancy = round(len(all_skills) / max(1, unique_skill_count), 2)
        missing_category_count = sum(1 for sc in cat_scores_vals if sc < 40)

        # Multi-contributor categories count
        multi_contributors = 0
        for cat, keywords in CATEGORY_KEYWORDS.items():
            contribs = 0
            for m in members_features:
                if any(any(kw in s["name_lower"] for kw in keywords) for s in m.get("skills", [])):
                    contribs += 1
            if contribs >= 2:
                multi_contributors += 1

        roles_assigned = sum(1 for m in members_features if m.get("role") and m.get("role").lower() not in ["", "member"])
        role_ratio = round(roles_assigned / max(1, k), 2)

        all_weights = [s["final_weight"] for m in members_features for s in m.get("skills", [])]
        avg_skill_level = round(float(np.mean(all_weights)), 2) if all_weights else 1.25

        cluster_div = len(set(m.get("cluster_id", 3) for m in members_features))
        branch_div = len(set(m.get("branch", "") for m in members_features if m.get("branch"))) or 1
        years = [m.get("year_num", 3) for m in members_features]
        exp_range = max(years) - min(years) if years else 0

        tot_commits = sum(m.get("commits", 0) for m in members_features)
        log_commits = round(float(math.log2(1 + tot_commits)), 2)
        mean_projects = round(float(np.mean([m.get("projects", 0) for m in members_features])), 2)
        active_gh = round(sum(1 for m in members_features if m.get("commits", 0) > 0) / max(1, k), 2)

        return {
            "team_size": k,
            "role_assigned_ratio": role_ratio,
            "multi_contributor_categories": multi_contributors,
            "unique_skill_count": unique_skill_count,
            "functional_category_entropy": norm_entropy,
            "missing_category_count": missing_category_count,
            "core_skill_redundancy": core_skill_redundancy,
            "avg_skill_level": avg_skill_level,
            "mean_pairwise_compatibility": mean_pair_compat,
            "min_pairwise_compatibility": min_pair_compat,
            "compatibility_std_dev": std_pair_compat,
            "cluster_diversity_count": cluster_div,
            "branch_diversity_count": branch_div,
            "experience_range_years": exp_range,
            "domain_interest_jaccard_mean": domain_jaccard_mean,
            "log_team_total_commits": log_commits,
            "mean_member_projects": mean_projects,
            "github_profile_active_ratio": active_gh
        }

    @classmethod
    def _generate_health_explainability(cls, feats: dict, health_scores: dict[str, int]) -> dict:
        """Derive explainable strengths and risk factors from factual features without fabricating."""
        strengths = []
        risk_factors = []

        # Strengths
        if feats.get("mean_pairwise_compatibility", 0) >= 75.0:
            strengths.append(f"High pairwise compatibility ({feats['mean_pairwise_compatibility']:.1f}%) across team members")
        if feats.get("missing_category_count", 5) == 0:
            strengths.append("Complete functional coverage across all 5 core technical domains")
        elif feats.get("missing_category_count", 5) <= 1:
            strengths.append("Strong cross-functional coverage with 4+ domains covered")

        if feats.get("multi_contributor_categories", 0) >= 2:
            strengths.append(f"Resilient multi-contributor depth across {feats['multi_contributor_categories']} functional categories")

        if feats.get("log_team_total_commits", 0) >= 6.0:
            commits_est = int(round(2**feats['log_team_total_commits'] - 1))
            strengths.append(f"Active collaborative coding velocity ({commits_est} total commits)")

        if feats.get("cluster_diversity_count", 0) >= 3:
            strengths.append(f"Diverse builder archetypes represented ({feats['cluster_diversity_count']} distinct KMeans student clusters)")

        if not strengths:
            strengths.append("Foundational skills present for core hackathon execution")

        # Risk factors
        missing_cats = [cat for cat, sc in health_scores.items() if sc < 40]
        if missing_cats:
            risk_factors.append(f"Critical coverage gap in: {', '.join(missing_cats)}")

        if feats.get("min_pairwise_compatibility", 100) < 65.0:
            risk_factors.append(f"Pairwise compatibility bottleneck detected (lowest pair score: {feats['min_pairwise_compatibility']:.1f}%)")

        if feats.get("core_skill_redundancy", 1.0) > 2.2:
            risk_factors.append(f"High skill overlap ({feats['core_skill_redundancy']:.1f}x redundancy) with potential domain gaps")

        if feats.get("github_profile_active_ratio", 1.0) < 0.40:
            risk_factors.append("Low GitHub code activity linked across team members")

        if feats.get("role_assigned_ratio", 1.0) < 0.50:
            risk_factors.append("Unassigned or generic roles for majority of team members")

        return {
            "strengths": strengths[:4],
            "risk_factors": risk_factors[:4]
        }

    @classmethod
    def get_full_team_health(cls, team: Team, db: Optional[Session] = None) -> dict:
        """
        Calculate dynamic ML-based Team Health metrics, missing roles, and detailed explainability.
        Maintains factual radar category coverage while predicting overall team health via team_health_v1.
        """
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

        if not team or not getattr(team, 'members', None):
            return {
                "health_scores": empty_scores,
                "missing_roles": empty_missing,
                "health_details": empty_details,
                "health_score": 0,
                "ml_health_score": 0.0,
                "health_status": "At Risk",
                "is_ml_powered": False,
                "model_version": "team_health_v1",
                "explainability": {
                    "strengths": [],
                    "risk_factors": ["No members in team"]
                }
            }

        # 1. Extract non-PII features for all team members
        members_features = [cls._extract_member_features(m, db) for m in team.members]

        # 2. Compute factual deterministic category scores for Radar
        health_scores = {}
        health_details = {}

        for cat, keywords in CATEGORY_KEYWORDS.items():
            cat_score, details = cls._calculate_category_health(cat, keywords, members_features)
            health_scores[cat] = cat_score
            health_details[cat] = details

        # 3. Determine missing roles for categories under 40%
        missing_roles = cls._calculate_missing_roles_from_scores(health_scores)

        # 4. Deterministic baseline fallback score
        det_score = int(round(sum(health_scores.values()) / max(1, len(health_scores))))

        # 5. ML Team Health Prediction via team_health_v1
        is_ml_powered = False
        ml_health_score = None
        model_version = "deterministic_fallback"
        final_health_score = det_score
        ml_feats = {}

        try:
            from ml.inference import get_inference_engine
            engine = get_inference_engine()
            if engine.is_team_health_model_available():
                ml_feats = cls._compute_team_health_features(members_features, health_scores, engine)
                pred = engine.predict_team_health_score(ml_feats)
                ml_health_score = pred
                final_health_score = int(round(pred))
                is_ml_powered = True
                model_version = engine.team_health_model_version
            else:
                ml_feats = cls._compute_team_health_features(members_features, health_scores, None)
        except Exception as exc:
            logger.warning(f"Team Health ML inference failed, falling back to deterministic baseline: {exc}")
            ml_feats = cls._compute_team_health_features(members_features, health_scores, None)

        # 6. Interpret UI Health Status
        if final_health_score >= 75:
            health_status = "Healthy"
        elif final_health_score >= 50:
            health_status = "Moderate"
        else:
            health_status = "At Risk"

        # 7. Explainability factors
        explainability = cls._generate_health_explainability(ml_feats, health_scores)

        return {
            "health_scores": health_scores,
            "missing_roles": missing_roles,
            "health_details": health_details,
            "health_score": final_health_score,
            "ml_health_score": ml_health_score,
            "health_status": health_status,
            "is_ml_powered": is_ml_powered,
            "model_version": model_version,
            "explainability": explainability
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
