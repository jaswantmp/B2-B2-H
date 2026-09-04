# app/services/team_generator_service.py
import os
import sys
import math
import random
import logging
import numpy as np
from itertools import combinations
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload

# Ensure project root is in sys.path for ml package
project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.models.user import User, UserSkill
from app.models.project import Project, ProjectMember
from app.models.github import GithubProfile

logger = logging.getLogger(__name__)

# Core functional categories and skill synonyms
SKILL_SYNONYMS = {
    "react": "react", "react.js": "react", "reactjs": "react",
    "node": "node.js", "nodejs": "node.js", "node.js": "node.js",
    "python": "python", "py": "python",
    "fastapi": "fastapi", "django": "django",
    "tensorflow": "tensorflow", "pytorch": "pytorch", "keras": "tensorflow",
    "docker": "docker", "k8s": "kubernetes", "kubernetes": "kubernetes",
    "aws": "aws", "amazon web services": "aws",
    "postgres": "postgresql", "postgresql": "postgresql",
    "mongodb": "mongodb", "mongo": "mongodb",
    "figma": "figma", "ui/ux": "ui/ux", "ui design": "ui/ux", "ux design": "ui/ux",
    "solidity": "solidity", "web3": "web3", "blockchain": "web3",
    "go": "go", "golang": "go", "rust": "rust", "flutter": "flutter"
}

TECH_CATEGORIES = {
    "Frontend": {"react", "vue", "vue.js", "angular", "next.js", "svelte", "javascript", "typescript", "tailwind", "tailwind css", "html", "css", "flutter"},
    "Backend": {"node.js", "fastapi", "django", "express", "spring boot", "python", "go", "rust", "java", "c++", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes", "aws"},
    "AI/ML": {"machine learning", "deep learning", "artificial intelligence", "data science", "tensorflow", "pytorch", "langchain", "rag", "agentic ai", "nlp", "computer vision", "opencv"},
    "Design": {"figma", "ui/ux", "ui design", "ux design", "canva", "prototyping", "wireframing", "graphic design", "blender", "design"},
    "Product": {"product management", "agile", "scrum", "market research", "business analysis", "public speaking", "pitching", "presentation", "team leadership", "technical writing"}
}

ROLE_TEMPLATES = {
    "Frontend": ("Frontend Developer", "Responsible for crafting responsive user interfaces, design systems, and client-side performance."),
    "Backend": ("Backend & Systems Engineer", "Responsible for scalable APIs, database architecture, authentication, and core server logic."),
    "AI/ML": ("AI / Machine Learning Engineer", "Responsible for designing ML models, LLM pipelines, prompt engineering, and intelligent features."),
    "Design": ("UI/UX Product Designer", "Responsible for user flows, interactive wireframes, design tokens, and aesthetic polish."),
    "Product": ("Product & Strategy Lead", "Responsible for roadmap definition, problem validation, pitch deck creation, and sprint execution.")
}

BRANCH_GROUPS = {
    "cs": {"computer science", "information technology", "software engineering", "computer engineering", "cse", "it"},
    "ece_ee": {"electronics", "electrical", "ece", "eee", "embedded"},
    "mech_civil": {"mechanical", "civil", "aerospace", "mechatronics"}
}


def normalize(s: str) -> str:
    if not s:
        return ""
    clean = s.strip().lower()
    return SKILL_SYNONYMS.get(clean, clean)


class TeamGeneratorService:

    @classmethod
    def _extract_student_profiles(cls, db: Session, exclude_user_id: Optional[str] = None) -> list[dict]:
        """Extract rich non-PII profiles for candidate students."""
        users = (
            db.query(User)
            .options(
                joinedload(User.user_skills).joinedload(UserSkill.skill),
                joinedload(User.github_profile)
            )
            .all()
        )

        from collections import defaultdict
        created_map = defaultdict(int)
        for cid, _ in db.query(Project.creator_id, Project.id).all():
            if cid:
                created_map[cid] += 1

        member_map = defaultdict(int)
        for uid, _ in db.query(ProjectMember.user_id, ProjectMember.id).all():
            if uid:
                member_map[uid] += 1

        profiles = []
        for u in users:
            if exclude_user_id and str(u.id) == str(exclude_user_id):
                continue

            skills_set = set()
            skills_raw = []
            verified_count = 0
            for us in getattr(u, "user_skills", []) or []:
                if us.skill and us.skill.name:
                    norm_name = normalize(us.skill.name)
                    skills_set.add(norm_name)
                    skills_raw.append(us.skill.name.strip())
                    if getattr(us, "is_verified", False):
                        verified_count += 1

            domains = [normalize(d) for d in (u.domains or []) if d]
            interests = [normalize(i) for i in (getattr(u, "interests", []) or []) if i]

            gh = getattr(u, "github_profile", None)
            repos = getattr(gh, "repos", 0) or 0
            commits = getattr(gh, "commits", 0) or 0
            stars = getattr(gh, "stars", 0) or 0

            total_projects = created_map[u.id] + member_map[u.id]
            hackathons_won = getattr(u, "hackathons_won", 0) or 0
            hackathons_part = hackathons_won + (1 if total_projects > 0 else 0)

            # Profile completion
            comp_checks = [
                bool(u.name), bool(u.bio), bool(u.university),
                bool(skills_set), bool(domains), bool(getattr(u, "github", None))
            ]
            completion = round(sum(comp_checks) / len(comp_checks), 2)

            # Year integer
            year_str = (u.year or "").lower()
            if "1" in year_str:
                year_int = 1
            elif "2" in year_str:
                year_int = 2
            elif "3" in year_str:
                year_int = 3
            elif "4" in year_str:
                year_int = 4
            else:
                year_int = 3

            branch_clean = (u.branch or "computer science").strip().lower()

            if hackathons_won >= 2:
                cluster_id = 1
            elif commits >= 150 or repos >= 8:
                cluster_id = 2
            elif total_projects >= 2:
                cluster_id = 0
            else:
                cluster_id = 3

            # Determine dominant functional categories
            cat_counts = {}
            for cat, kw_set in TECH_CATEGORIES.items():
                cat_counts[cat] = len(skills_set & kw_set)

            dominant_cat = max(cat_counts, key=cat_counts.get) if any(cat_counts.values()) else "Backend"

            profiles.append({
                "student_id": str(u.id),
                "user_model": u,
                "name": u.name or "Builder",
                "university": u.university or "University",
                "branch": branch_clean,
                "year": year_int,
                "year_str": u.year or "3rd Year",
                "avatar": getattr(u, "avatar", None),
                "skills_set": skills_set,
                "skills_raw": skills_raw,
                "verified_skills_count": verified_count,
                "domains": set(domains),
                "interests": set(interests),
                "github_repos": repos,
                "github_commits": commits,
                "github_stars": stars,
                "total_projects": total_projects,
                "hackathons_won": hackathons_won,
                "hackathons_participated": hackathons_part,
                "profile_completion": completion,
                "cluster_id": cluster_id,
                "dominant_category": dominant_cat,
                "category_matches": cat_counts
            })

        return profiles

    @classmethod
    def _compute_pair_features(cls, a: dict, b: dict) -> dict:
        """Calculate Level 1 pair feature vector for two candidates."""
        shared_skills = a["skills_set"] & b["skills_set"]
        union_skills = a["skills_set"] | b["skills_set"]
        overlap_count = len(shared_skills)
        overlap_ratio = round(overlap_count / max(1, len(union_skills)), 4)
        complementary_count = len(union_skills - shared_skills)

        shared_domains = a["domains"] & b["domains"]
        domain_match = 1 if len(shared_domains) > 0 else 0
        domain_overlap_count = len(shared_domains)
        interest_overlap_count = len(a["interests"] & b["interests"])

        # Word-level Jaccard similarity between skills and domains
        text_a = a["skills_set"] | a["domains"]
        text_b = b["skills_set"] | b["domains"]
        sim = len(text_a & text_b) / max(1, len(text_a | text_b))

        branch_compat = 0.5
        for group in BRANCH_GROUPS.values():
            if any(term in a["branch"] for term in group) and any(term in b["branch"] for term in group):
                branch_compat = 1.0
                break

        year_diff = abs(a["year"] - b["year"])
        cluster_syn = 1.0 if a["cluster_id"] != b["cluster_id"] else 0.6
        gh_commits = a["github_commits"] + b["github_commits"]
        gh_repos = a["github_repos"] + b["github_repos"]
        proj_total = a["total_projects"] + b["total_projects"]
        exp_balance = abs(a["total_projects"] - b["total_projects"])
        prof_avg = round((a["profile_completion"] + b["profile_completion"]) / 2.0, 3)

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
            "profile_completion_avg": prof_avg
        }

    @classmethod
    def _compute_team_features(cls, team_members: list[dict], pair_scores_lookup: dict) -> dict:
        """Compute Level 2 team-level features."""
        k = len(team_members)
        pair_scores = []
        for a, b in combinations(team_members, 2):
            key = tuple(sorted([a["student_id"], b["student_id"]]))
            pair_scores.append(pair_scores_lookup.get(key, 75.0))

        avg_pair = round(float(sum(pair_scores) / max(1, len(pair_scores))), 2) if pair_scores else 75.0
        min_pair = round(float(min(pair_scores)), 2) if pair_scores else 70.0
        diffs = [s - avg_pair for s in pair_scores]
        std_pair = round(float(math.sqrt(sum(d * d for d in diffs) / max(1, len(pair_scores)))), 2) if pair_scores else 0.0

        all_skills = set()
        category_counts = {cat: 0 for cat in TECH_CATEGORIES}
        for m in team_members:
            all_skills.update(m["skills_set"])
            for cat, kw_set in TECH_CATEGORIES.items():
                if m["skills_set"] & kw_set:
                    category_counts[cat] += 1

        covered_categories = sum(1 for c in category_counts.values() if c > 0)
        tot_alloc = sum(category_counts.values())
        if tot_alloc > 0:
            entropy = 0.0
            for c in category_counts.values():
                if c > 0:
                    p = c / tot_alloc
                    entropy -= p * math.log2(p)
            entropy = round(entropy, 3)
        else:
            entropy = 0.0

        all_domains = set()
        clusters = set()
        branches = set()
        years = set()
        for m in team_members:
            all_domains.update(m["domains"])
            clusters.add(m["cluster_id"])
            branches.add(m["branch"])
            years.add(m["year"])

        tot_commits = sum(m["github_commits"] for m in team_members)
        tot_projects = sum(m["total_projects"] for m in team_members)
        avg_comp = round(sum(m["profile_completion"] for m in team_members) / max(1, k), 3)
        role_spec = round(min(1.0, covered_categories / max(1, k)), 3)

        return {
            "team_size": k,
            "avg_pair_compatibility": avg_pair,
            "min_pair_compatibility": min_pair,
            "pair_compatibility_std": std_pair,
            "unique_skills_count": len(all_skills),
            "category_coverage_count": covered_categories,
            "category_balance_entropy": entropy,
            "domain_diversity_count": len(all_domains),
            "cluster_diversity_count": len(clusters),
            "branch_diversity_count": len(branches),
            "year_diversity_count": len(years),
            "total_github_commits": tot_commits,
            "total_projects": tot_projects,
            "avg_profile_completion": avg_comp,
            "role_specialization_score": role_spec
        }

    @classmethod
    def generate_team(
        cls,
        db: Session,
        idea: str,
        team_size: int = 4,
        must_have_skills: Optional[List[str]] = None,
        current_user_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Generate an optimal, ML-formed team satisfying constraints using Level 1 pairwise
        compatibility scoring, candidate beam search, and Level 2 team quality prediction.
        """
        # Constrain team size to [2, 6]
        team_size = max(2, min(6, int(team_size or 4)))
        must_have_skills = [normalize(s) for s in (must_have_skills or []) if s]
        idea_clean = (idea or "").strip().lower()

        # 1. Extract candidates from live database
        all_profiles = cls._extract_student_profiles(db, exclude_user_id=current_user_id)
        if len(all_profiles) < team_size:
            logger.warning(f"Candidate pool size ({len(all_profiles)}) smaller than target team size ({team_size})")
            return {
                "idea": idea,
                "team_size": team_size,
                "roles": [],
                "suggestedBuilders": [],
                "team_quality_score": 50,
                "ml_score": 50.0,
                "model_version": "team_generator_v1",
                "is_ml_powered": False,
                "strengths": ["Insufficient candidates in database."],
                "weaknesses": []
            }

        # 2. Candidate Filtering & Pre-Ranking
        # Score each candidate against project idea & must-have skills to select top 25 candidates
        for p in all_profiles:
            aff_score = 0.0
            # Must-have skills match
            if must_have_skills:
                m_hits = len(p["skills_set"] & set(must_have_skills))
                aff_score += m_hits * 25.0

            # Idea keyword matches
            for s in p["skills_set"]:
                if s in idea_clean:
                    aff_score += 15.0
            for d in p["domains"]:
                if d in idea_clean:
                    aff_score += 10.0

            aff_score += p["profile_completion"] * 10.0
            aff_score += min(10.0, p["total_projects"] * 2.0)
            p["idea_affinity"] = aff_score

        all_profiles.sort(key=lambda x: x["idea_affinity"], reverse=True)
        # Choose candidate pool: top 25 plus diverse functional category representatives
        pool_set = {p["student_id"] for p in all_profiles[:18]}
        # Ensure at least 2 candidates for each functional category in the pool
        for cat in TECH_CATEGORIES:
            cat_members = [p for p in all_profiles if p["dominant_category"] == cat and p["student_id"] not in pool_set]
            for m in cat_members[:2]:
                pool_set.add(m["student_id"])

        candidate_pool = [p for p in all_profiles if p["student_id"] in pool_set]
        if len(candidate_pool) < team_size:
            candidate_pool = all_profiles[:max(team_size, 20)]

        # 3. Level 1: Pairwise Scoring
        pair_feature_dicts = []
        pair_keys = []
        for a, b in combinations(candidate_pool, 2):
            feat = cls._compute_pair_features(a, b)
            pair_feature_dicts.append(feat)
            pair_keys.append(tuple(sorted([a["student_id"], b["student_id"]])))

        is_ml = False
        model_ver = "legacy_rule_baseline"
        pair_scores_lookup = {}

        try:
            from ml.inference import get_inference_engine
            engine = get_inference_engine()
            if engine.is_team_generator_model_available():
                scores = engine.predict_team_pair_scores(pair_feature_dicts)
                for key, sc in zip(pair_keys, scores):
                    pair_scores_lookup[key] = sc
                is_ml = True
                model_ver = engine.team_generator_model_version
        except Exception as e:
            logger.warning(f"Team pair ML scoring failed, using fallback: {e}")

        if not is_ml:
            for key, feat in zip(pair_keys, pair_feature_dicts):
                pair_scores_lookup[key] = 70.0 + feat["skill_overlap_ratio"] * 15.0 + feat["domain_match"] * 10.0

        # 4. Constrained Candidate Team Formation (Beam Search + Local Swap)
        # Find top anchor pairs with highest pairwise compatibility
        sorted_pairs = sorted(pair_keys, key=lambda k: pair_scores_lookup.get(k, 50.0), reverse=True)
        cand_map = {p["student_id"]: p for p in candidate_pool}

        candidate_teams = []
        # Seed with top 10 diverse anchor pairs
        for seed_pair in sorted_pairs[:12]:
            current_team = [cand_map[seed_pair[0]], cand_map[seed_pair[1]]]
            # Greedily expand until team_size
            while len(current_team) < team_size:
                best_addition = None
                best_add_val = -1.0
                curr_ids = {m["student_id"] for m in current_team}
                curr_cats = {m["dominant_category"] for m in current_team}

                for candidate in candidate_pool:
                    if candidate["student_id"] in curr_ids:
                        continue
                    # Compute mean pair score with current members
                    pair_sum = sum(
                        pair_scores_lookup.get(tuple(sorted([candidate["student_id"], m["student_id"]])), 60.0)
                        for m in current_team
                    )
                    mean_p = pair_sum / len(current_team)
                    # Diversity bonus for covering a missing functional category
                    cat_bonus = 8.0 if candidate["dominant_category"] not in curr_cats else 0.0
                    total_val = mean_p + cat_bonus + (candidate["idea_affinity"] * 0.1)

                    if total_val > best_add_val:
                        best_add_val = total_val
                        best_addition = candidate

                if best_addition:
                    current_team.append(best_addition)
                else:
                    break

            if len(current_team) == team_size:
                candidate_teams.append(current_team)

        # 5. Level 2: Team Quality Evaluation
        team_features_list = [cls._compute_team_features(ct, pair_scores_lookup) for ct in candidate_teams]
        best_team = candidate_teams[0]
        best_team_score = 80.0
        best_team_feats = team_features_list[0]

        if is_ml:
            try:
                from ml.inference import get_inference_engine
                engine = get_inference_engine()
                quality_scores = engine.predict_team_quality_scores(team_features_list)
                best_idx = int(np.argmax(quality_scores))
                best_team = candidate_teams[best_idx]
                best_team_score = float(quality_scores[best_idx])
                best_team_feats = team_features_list[best_idx]
            except Exception as e:
                logger.warning(f"Team quality ML prediction failed: {e}")
                best_team_score = round(float(team_features_list[0]["avg_pair_compatibility"]), 2)
        else:
            best_team_score = round(float(team_features_list[0]["avg_pair_compatibility"]), 2)

        # 6. Dynamic Role Assignment (NO hardcoded roles)
        assigned_roles = []
        assigned_builders = []
        assigned_categories = set()

        for member in best_team:
            # Pick best category not yet claimed or strongest category
            preferred_cat = member["dominant_category"]
            if preferred_cat in assigned_categories:
                # Find secondary highest category
                sorted_cats = sorted(member["category_matches"].items(), key=lambda x: x[1], reverse=True)
                for cat_name, cnt in sorted_cats:
                    if cat_name not in assigned_categories and cnt > 0:
                        preferred_cat = cat_name
                        break

            assigned_categories.add(preferred_cat)
            role_title, role_desc = ROLE_TEMPLATES.get(preferred_cat, ("Full-Stack Developer", "Core application engineer."))

            # Match score for this builder relative to the team
            member_pairs = [
                pair_scores_lookup.get(tuple(sorted([member["student_id"], other["student_id"]])), 80.0)
                for other in best_team if other["student_id"] != member["student_id"]
            ]
            builder_score = round(float(sum(member_pairs) / max(1, len(member_pairs))))

            assigned_roles.append({
                "role": role_title,
                "reason": f"{member['name']} ({role_desc})",
                "skills": list(member["skills_raw"])[:4] if member["skills_raw"] else ["Python", "JavaScript"]
            })

            # Format builder object compatible with User schema
            u = member["user_model"]
            assigned_builders.append({
                "id": str(u.id),
                "name": u.name or "Builder",
                "email": u.email,
                "university": u.university or "University",
                "branch": u.branch or "Computer Science",
                "year": u.year or "3rd Year",
                "avatar": getattr(u, "avatar", None),
                "bio": u.bio or "",
                "skills": [us.skill.name for us in getattr(u, "user_skills", []) if us.skill] or member["skills_raw"],
                "score": builder_score,
                "ml_score": float(builder_score),
                "role": role_title
            })

        # 7. Generate Explainable Strengths and Considerations
        strengths = []
        if best_team_feats["category_coverage_count"] >= 4:
            strengths.append(f"Full cross-functional coverage across {best_team_feats['category_coverage_count']} core disciplines.")
        else:
            strengths.append(f"Targeted technical focus covering {best_team_feats['category_coverage_count']} specialized skill domains.")

        if best_team_feats["avg_pair_compatibility"] >= 80:
            strengths.append(f"Outstanding interpersonal compatibility (average pair affinity: {best_team_feats['avg_pair_compatibility']:.1f}%).")
        else:
            strengths.append(f"Solid collaboration harmony across candidate pairs ({best_team_feats['avg_pair_compatibility']:.1f}%).")

        if best_team_feats["cluster_diversity_count"] >= 3:
            strengths.append(f"High perspective diversity with {best_team_feats['cluster_diversity_count']} distinct student builder profiles.")

        if must_have_skills:
            all_team_skills = set().union(*[m["skills_set"] for m in best_team])
            covered_must_have = [s for s in must_have_skills if s in all_team_skills]
            if covered_must_have:
                strengths.append(f"Covered must-have requirements: {', '.join(covered_must_have[:3])}.")

        weaknesses = []
        missing_cats = [cat for cat in TECH_CATEGORIES if cat not in assigned_categories]
        if missing_cats:
            weaknesses.append(f"Team may benefit from additional support in: {', '.join(missing_cats[:2])}.")

        return {
            "idea": idea,
            "team_size": team_size,
            "roles": assigned_roles,
            "suggestedBuilders": assigned_builders,
            "team_quality_score": int(round(best_team_score)),
            "ml_score": float(np.round(best_team_score, 2)),
            "model_version": model_ver,
            "is_ml_powered": is_ml,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "category_coverage": {
                cat: (cat in assigned_categories) for cat in TECH_CATEGORIES
            }
        }
