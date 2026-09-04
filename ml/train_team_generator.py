"""
ml/train_team_generator.py

Production Training Pipeline for ML Team Generator (team_generator_v1).

ACADEMIC / OPERATIONAL DISCLOSURE:
"This is a genuine trained ML inference system, but its current training labels are
derived/synthetic because insufficient real historical team outcome data exists.
The evaluated metrics measure how faithfully the model learns and generalizes
the derived compatibility/team-quality function; they do not establish real-world
team success or user preference accuracy."

Two-Level Architecture:
1. Level 1: Pairwise Student Compatibility Model (HistGradientBoostingRegressor)
   - Features: skill overlap/ratio, complementarity, domain/interest alignment,
     TF-IDF text similarity, branch/year delta, cluster synergy, GitHub/project synergy.
   - Target: Multi-factor pairwise compatibility (0-100).
   - Data Leakage Prevention: Grouped split by student (zero student overlap between train/val/test).

2. Level 2: Team-Level Quality Model (HistGradientBoostingRegressor)
   - Features: average pair compatibility, min pair compatibility, std dev,
     category coverage (Frontend, Backend, AI/ML, Design, Product), category entropy,
     cluster diversity, domain diversity, activity metrics, role specialization.
   - Target: Multi-factor team synergy and cross-functional quality (0-100).
   - Data Leakage Prevention: Grouped team formation from partition-exclusive student pools.
"""

import os
import sys
import time
import math
import random
import logging
from collections import Counter
from itertools import combinations
from datetime import datetime

import numpy as np
import pandas as pd
import joblib

from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import r2_score, mean_squared_error, mean_absolute_error
from sklearn.inspection import permutation_importance
from sklearn.feature_extraction.text import TfidfVectorizer

# Ensure backend path is in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

project_root = os.path.abspath(os.path.join(backend_path, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.database import SessionLocal
from app.models.user import User, UserSkill
from app.models.project import Project, ProjectMember
from app.models.github import GithubProfile

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TrainTeamGenerator")

# Random seeds for reproducibility
SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# Skill synonym mapping for normalization
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

# 5 Core Functional Categories
TECH_CATEGORIES = {
    "Frontend": {"react", "vue", "vue.js", "angular", "next.js", "svelte", "javascript", "typescript", "tailwind", "tailwind css", "html", "css", "flutter"},
    "Backend": {"node.js", "fastapi", "django", "express", "spring boot", "python", "go", "rust", "java", "c++", "postgresql", "mysql", "mongodb", "redis", "docker", "kubernetes", "aws"},
    "AI/ML": {"machine learning", "deep learning", "artificial intelligence", "data science", "tensorflow", "pytorch", "langchain", "rag", "agentic ai", "nlp", "computer vision", "opencv"},
    "Design": {"figma", "ui/ux", "ui design", "ux design", "canva", "prototyping", "wireframing", "graphic design", "blender", "design"},
    "Product": {"product management", "agile", "scrum", "market research", "business analysis", "public speaking", "pitching", "presentation", "team leadership", "technical writing"}
}

BRANCH_GROUPS = {
    "cs": {"computer science", "information technology", "software engineering", "computer engineering", "cse", "it"},
    "ece_ee": {"electronics", "electrical", "ece", "eee", "embedded"},
    "mech_civil": {"mechanical", "civil", "aerospace", "mechatronics"}
}

PAIR_FEATURE_COLUMNS = [
    "skill_overlap_count",
    "skill_overlap_ratio",
    "complementary_skill_count",
    "domain_match",
    "domain_overlap_count",
    "interest_overlap_count",
    "tfidf_similarity",
    "branch_compatibility",
    "year_difference",
    "cluster_synergy",
    "github_commits_total",
    "github_repos_total",
    "project_count_total",
    "experience_balance",
    "profile_completion_avg"
]

TEAM_FEATURE_COLUMNS = [
    "team_size",
    "avg_pair_compatibility",
    "min_pair_compatibility",
    "pair_compatibility_std",
    "unique_skills_count",
    "category_coverage_count",
    "category_balance_entropy",
    "domain_diversity_count",
    "cluster_diversity_count",
    "branch_diversity_count",
    "year_diversity_count",
    "total_github_commits",
    "total_projects",
    "avg_profile_completion",
    "role_specialization_score"
]


def normalize(s: str) -> str:
    if not s:
        return ""
    clean = s.strip().lower()
    return SKILL_SYNONYMS.get(clean, clean)


def extract_student_profiles(db) -> list[dict]:
    """Query and extract rich non-PII profiles for all students from PostgreSQL."""
    logger.info("Extracting student profiles from PostgreSQL...")
    from sqlalchemy.orm import joinedload

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
    corpus_texts = []

    for u in users:
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

        # Year as integer
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

        # Approximate student cluster based on existing K-Means segmentation heuristics
        if hackathons_won >= 2:
            cluster_id = 1  # Hackathon Champion
        elif commits >= 150 or repos >= 8:
            cluster_id = 2  # High Open-Source Contributor
        elif total_projects >= 2:
            cluster_id = 0  # Applied Project Specialist
        else:
            cluster_id = 3  # Emerging Generalist Builder

        text_rep = f"{u.bio or ''} {' '.join(skills_set)} {' '.join(domains)} {' '.join(interests)}".strip()
        corpus_texts.append(text_rep if text_rep else "student developer software")

        profiles.append({
            "student_id": u.id,
            "skills_set": skills_set,
            "skills_raw": skills_raw,
            "verified_skills_count": verified_count,
            "domains": set(domains),
            "interests": set(interests),
            "branch": branch_clean,
            "year": year_int,
            "github_repos": repos,
            "github_commits": commits,
            "github_stars": stars,
            "total_projects": total_projects,
            "hackathons_won": hackathons_won,
            "hackathons_participated": hackathons_part,
            "profile_completion": completion,
            "cluster_id": cluster_id,
            "text": text_rep
        })

    # Compute TF-IDF matrix across all students
    tfidf = TfidfVectorizer(stop_words="english", max_features=200)
    tfidf_matrix = tfidf.fit_transform(corpus_texts).toarray()

    for idx, p in enumerate(profiles):
        p["tfidf_vector"] = tfidf_matrix[idx]

    logger.info(f"Loaded {len(profiles)} student profiles successfully.")
    return profiles


def compute_pair_features(a: dict, b: dict) -> dict:
    """Compute 15 features for student pair (A, B)."""
    # 1. Skill Overlap & Complementarity
    shared_skills = a["skills_set"] & b["skills_set"]
    union_skills = a["skills_set"] | b["skills_set"]
    overlap_count = len(shared_skills)
    overlap_ratio = round(overlap_count / max(1, len(union_skills)), 4)

    # Complementary skills: skills in B not in A plus skills in A not in B
    complementary_count = len(union_skills - shared_skills)

    # 2. Domains & Interests
    shared_domains = a["domains"] & b["domains"]
    domain_match = 1 if len(shared_domains) > 0 else 0
    domain_overlap_count = len(shared_domains)
    interest_overlap_count = len(a["interests"] & b["interests"])

    # 3. TF-IDF text cosine similarity
    vec_a = a["tfidf_vector"]
    vec_b = b["tfidf_vector"]
    norm_a = np.linalg.norm(vec_a)
    norm_b = np.linalg.norm(vec_b)
    if norm_a > 0 and norm_b > 0:
        sim = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
    else:
        sim = 0.0
    sim = round(max(0.0, min(1.0, sim)), 4)

    # 4. Branch Compatibility
    branch_compat = 0.5
    for group in BRANCH_GROUPS.values():
        if any(term in a["branch"] for term in group) and any(term in b["branch"] for term in group):
            branch_compat = 1.0
            break

    # 5. Year Difference
    year_diff = abs(a["year"] - b["year"])

    # 6. Cluster Synergy (Complementary clusters: e.g. 0+1, 0+2, 1+2 are highly synergetic)
    if a["cluster_id"] != b["cluster_id"]:
        cluster_syn = 1.0
    else:
        cluster_syn = 0.6

    # 7. GitHub and Projects Total
    gh_commits = a["github_commits"] + b["github_commits"]
    gh_repos = a["github_repos"] + b["github_repos"]
    proj_total = a["total_projects"] + b["total_projects"]

    # 8. Experience Balance
    exp_balance = abs(a["total_projects"] - b["total_projects"])

    # 9. Profile Completion Avg
    prof_avg = round((a["profile_completion"] + b["profile_completion"]) / 2.0, 3)

    return {
        "skill_overlap_count": overlap_count,
        "skill_overlap_ratio": overlap_ratio,
        "complementary_skill_count": complementary_count,
        "domain_match": domain_match,
        "domain_overlap_count": domain_overlap_count,
        "interest_overlap_count": interest_overlap_count,
        "tfidf_similarity": sim,
        "branch_compatibility": branch_compat,
        "year_difference": year_diff,
        "cluster_synergy": cluster_syn,
        "github_commits_total": gh_commits,
        "github_repos_total": gh_repos,
        "project_count_total": proj_total,
        "experience_balance": exp_balance,
        "profile_completion_avg": prof_avg
    }


def compute_derived_pair_target(feats: dict) -> float:
    """
    Transparent derived target function for pairwise compatibility (0-100).
    Explicitly combines complementarity, overlap, domain match, and experience synergy.
    """
    # Base score
    score = 45.0

    # Skill Complementarity (up to 20 pts)
    score += min(20.0, feats["complementary_skill_count"] * 2.5)

    # Skill Overlap common ground (up to 10 pts)
    score += min(10.0, feats["skill_overlap_count"] * 3.5)

    # Domain & Interest match (up to 15 pts)
    score += feats["domain_match"] * 8.0 + min(7.0, feats["domain_overlap_count"] * 3.0 + feats["interest_overlap_count"] * 2.0)

    # TF-IDF similarity (up to 12 pts)
    score += feats["tfidf_similarity"] * 12.0

    # Cluster synergy (up to 8 pts)
    score += feats["cluster_synergy"] * 8.0

    # Branch & Year harmony (up to 8 pts)
    score += feats["branch_compatibility"] * 5.0
    score += max(0.0, (3.0 - feats["year_difference"] * 1.0))

    # Activity and Projects (up to 7 pts)
    activity_bonus = min(7.0, math.log1p(feats["github_commits_total"]) * 0.8 + feats["project_count_total"] * 0.5)
    score += activity_bonus

    # Profile completion (up to 5 pts)
    score += feats["profile_completion_avg"] * 5.0

    return round(float(np.clip(score, 40.0, 99.0)), 2)


def compute_rule_pair_baseline(feats: dict) -> float:
    """Deterministic rule-based baseline for pair compatibility."""
    # Simple rule: 40% overlap ratio, 30% domain match, 15% branch, 15% year
    score = (
        feats["skill_overlap_ratio"] * 40.0 +
        feats["domain_match"] * 30.0 +
        feats["branch_compatibility"] * 15.0 +
        max(0.0, (1.0 - feats["year_difference"] / 3.0)) * 15.0
    )
    return round(float(np.clip(score, 30.0, 95.0)), 2)


def compute_team_features(team_members: list[dict], pair_model=None) -> dict:
    """Compute 15 team-level aggregate features for a candidate team."""
    k = len(team_members)

    # 1. Pairwise scores within team
    pair_scores = []
    for a, b in combinations(team_members, 2):
        pf = compute_pair_features(a, b)
        if pair_model:
            df_p = pd.DataFrame([pf])[PAIR_FEATURE_COLUMNS]
            s = float(pair_model.predict(df_p)[0])
        else:
            s = compute_derived_pair_target(pf)
        pair_scores.append(s)

    avg_pair_compat = round(float(np.mean(pair_scores)), 2) if pair_scores else 50.0
    min_pair_compat = round(float(np.min(pair_scores)), 2) if pair_scores else 50.0
    std_pair_compat = round(float(np.std(pair_scores)), 2) if pair_scores else 0.0

    # 2. Skill & Category Coverage
    all_skills = set()
    category_counts = {cat: 0 for cat in TECH_CATEGORIES}
    for m in team_members:
        all_skills.update(m["skills_set"])
        for cat, kw_set in TECH_CATEGORIES.items():
            if m["skills_set"] & kw_set:
                category_counts[cat] += 1

    unique_skills_count = len(all_skills)
    covered_categories = sum(1 for c in category_counts.values() if c > 0)

    # Category entropy (diversity of functional skills)
    total_cat_alloc = sum(category_counts.values())
    if total_cat_alloc > 0:
        entropy = 0.0
        for c in category_counts.values():
            if c > 0:
                p = c / total_cat_alloc
                entropy -= p * math.log2(p)
        entropy = round(entropy, 3)
    else:
        entropy = 0.0

    # 3. Diversity metrics
    all_domains = set()
    clusters = set()
    branches = set()
    years = set()
    for m in team_members:
        all_domains.update(m["domains"])
        clusters.add(m["cluster_id"])
        branches.add(m["branch"])
        years.add(m["year"])

    domain_div = len(all_domains)
    cluster_div = len(clusters)
    branch_div = len(branches)
    year_div = len(years)

    # 4. Total activity
    tot_commits = sum(m["github_commits"] for m in team_members)
    tot_projects = sum(m["total_projects"] for m in team_members)
    avg_comp = round(sum(m["profile_completion"] for m in team_members) / max(1, k), 3)

    # 5. Role specialization score (proportion of distinct top categories)
    role_spec = round(min(1.0, covered_categories / max(1, k)), 3)

    return {
        "team_size": k,
        "avg_pair_compatibility": avg_pair_compat,
        "min_pair_compatibility": min_pair_compat,
        "pair_compatibility_std": std_pair_compat,
        "unique_skills_count": unique_skills_count,
        "category_coverage_count": covered_categories,
        "category_balance_entropy": entropy,
        "domain_diversity_count": domain_div,
        "cluster_diversity_count": cluster_div,
        "branch_diversity_count": branch_div,
        "year_diversity_count": year_div,
        "total_github_commits": tot_commits,
        "total_projects": tot_projects,
        "avg_profile_completion": avg_comp,
        "role_specialization_score": role_spec
    }


def compute_derived_team_target(feats: dict) -> float:
    """
    Transparent derived target function for overall team quality (0-100).
    Combines pair compatibility, category cross-functional coverage, cluster diversity, and activity.
    """
    # Pairwise compatibility baseline (up to 40 pts)
    score = feats["avg_pair_compatibility"] * 0.40

    # Cross-Functional Category Coverage (5 categories: up to 25 pts)
    score += (feats["category_coverage_count"] / 5.0) * 25.0

    # Category balance entropy (up to 10 pts)
    score += min(10.0, feats["category_balance_entropy"] * 4.5)

    # Student Cluster diversity (up to 10 pts)
    score += (feats["cluster_diversity_count"] / 4.0) * 10.0

    # Project & Coding Activity (up to 8 pts)
    activity = min(8.0, math.log1p(feats["total_github_commits"]) * 0.9 + feats["total_projects"] * 0.4)
    score += activity

    # Weakest link penalty (if min pair compatibility is significantly lower than average)
    penalty = max(0.0, (feats["avg_pair_compatibility"] - feats["min_pair_compatibility"]) * 0.20)
    score -= penalty

    # Unique skills bonus (up to 7 pts)
    score += min(7.0, feats["unique_skills_count"] * 0.35)

    return round(float(np.clip(score, 40.0, 99.0)), 2)


def compute_rule_team_baseline(feats: dict) -> float:
    """Rule-based team quality baseline."""
    score = (
        feats["avg_pair_compatibility"] * 0.50 +
        (feats["category_coverage_count"] / 5.0) * 30.0 +
        (feats["cluster_diversity_count"] / 4.0) * 20.0
    )
    return round(float(np.clip(score, 35.0, 95.0)), 2)


def main():
    logger.info("Starting ML Team Generator Training Pipeline (team_generator_v1)...")
    db = SessionLocal()
    try:
        profiles = extract_student_profiles(db)
    finally:
        db.close()

    total_students = len(profiles)
    logger.info(f"Total students extracted: {total_students}")

    # =========================================================================
    # 1. GROUP-AWARE SPLIT (Zero Data Leakage)
    # =========================================================================
    indices = list(range(total_students))
    random.seed(SEED)
    random.shuffle(indices)

    n_train = int(total_students * 0.70)
    n_val = int(total_students * 0.15)
    train_idx = set(indices[:n_train])
    val_idx = set(indices[n_train:n_train + n_val])
    test_idx = set(indices[n_train + n_val:])

    train_students = [profiles[i] for i in sorted(train_idx)]
    val_students = [profiles[i] for i in sorted(val_idx)]
    test_students = [profiles[i] for i in sorted(test_idx)]

    logger.info(f"Grouped Student Split -> Train: {len(train_students)}, Val: {len(val_students)}, Test: {len(test_students)}")

    # =========================================================================
    # 2. LEVEL 1: PAIRWISE MODEL TRAINING
    # =========================================================================
    logger.info("Generating pairwise datasets with zero student leakage...")

    def generate_pair_dataset(student_subset):
        rows = []
        targets = []
        baselines = []
        for a, b in combinations(student_subset, 2):
            feat = compute_pair_features(a, b)
            target = compute_derived_pair_target(feat)
            base = compute_rule_pair_baseline(feat)
            rows.append(feat)
            targets.append(target)
            baselines.append(base)
        return pd.DataFrame(rows)[PAIR_FEATURE_COLUMNS], np.array(targets), np.array(baselines)

    X_pair_train, y_pair_train, base_pair_train = generate_pair_dataset(train_students)
    X_pair_val, y_pair_val, base_pair_val = generate_pair_dataset(val_students)
    X_pair_test, y_pair_test, base_pair_test = generate_pair_dataset(test_students)

    logger.info(f"Pairwise Data Sizes -> Train: {len(X_pair_train)}, Val: {len(X_pair_val)}, Test: {len(X_pair_test)}")

    # Fit HistGradientBoostingRegressor for Pairwise Compatibility
    logger.info("Training Level 1: Pairwise HistGradientBoostingRegressor...")
    pair_model = HistGradientBoostingRegressor(
        learning_rate=0.05,
        max_iter=150,
        max_leaf_nodes=31,
        min_samples_leaf=15,
        l2_regularization=0.1,
        random_state=SEED
    )
    pair_model.fit(X_pair_train, y_pair_train)

    # Evaluate Pairwise Model on Held-out Test Set
    t0 = time.time()
    y_pair_pred = pair_model.predict(X_pair_test)
    pair_latency_ms = round((time.time() - t0) * 1000.0 / len(X_pair_test), 3)

    r2_pair = round(float(r2_score(y_pair_test, y_pair_pred)), 4)
    rmse_pair = round(float(np.sqrt(mean_squared_error(y_pair_test, y_pair_pred))), 4)
    mae_pair = round(float(mean_absolute_error(y_pair_test, y_pair_pred)), 4)

    r2_pair_base = round(float(r2_score(y_pair_test, base_pair_test)), 4)
    rmse_pair_base = round(float(np.sqrt(mean_squared_error(y_pair_test, base_pair_test))), 4)
    mae_pair_base = round(float(mean_absolute_error(y_pair_test, base_pair_test)), 4)

    logger.info(f"[Pairwise Test] ML -> R2: {r2_pair}, RMSE: {rmse_pair}, MAE: {mae_pair}, Latency: {pair_latency_ms} ms/sample")
    logger.info(f"[Pairwise Test] Baseline -> R2: {r2_pair_base}, RMSE: {rmse_pair_base}, MAE: {mae_pair_base}")

    # Permutation Importance for Pairwise Model
    perm_pair = permutation_importance(pair_model, X_pair_test, y_pair_test, n_repeats=5, random_state=SEED, n_jobs=1)
    pair_importances = []
    for idx, col in enumerate(PAIR_FEATURE_COLUMNS):
        pair_importances.append((col, round(float(perm_pair.importances_mean[idx]), 4)))
    pair_importances.sort(key=lambda x: x[1], reverse=True)

    # =========================================================================
    # 3. LEVEL 2: TEAM-LEVEL MODEL TRAINING
    # =========================================================================
    logger.info("Generating candidate team datasets with zero student leakage...")

    def generate_team_dataset(student_subset, n_samples=1500):
        rows = []
        targets = []
        baselines = []
        sub_len = len(student_subset)
        if sub_len < 4:
            return pd.DataFrame(), np.array([]), np.array([])

        sizes = [2, 3, 4, 5, 6]
        for _ in range(n_samples):
            k = random.choice(sizes)
            if k > sub_len:
                k = sub_len
            team_members = random.sample(student_subset, k)
            feat = compute_team_features(team_members, pair_model=pair_model)
            target = compute_derived_team_target(feat)
            base = compute_rule_team_baseline(feat)
            rows.append(feat)
            targets.append(target)
            baselines.append(base)

        return pd.DataFrame(rows)[TEAM_FEATURE_COLUMNS], np.array(targets), np.array(baselines)

    X_team_train, y_team_train, base_team_train = generate_team_dataset(train_students, n_samples=1800)
    X_team_val, y_team_val, base_team_val = generate_team_dataset(val_students, n_samples=400)
    X_team_test, y_team_test, base_team_test = generate_team_dataset(test_students, n_samples=400)

    logger.info(f"Team Data Sizes -> Train: {len(X_team_train)}, Val: {len(X_team_val)}, Test: {len(X_team_test)}")

    # Fit HistGradientBoostingRegressor for Team Quality
    logger.info("Training Level 2: Team Quality HistGradientBoostingRegressor...")
    team_model = HistGradientBoostingRegressor(
        learning_rate=0.05,
        max_iter=150,
        max_leaf_nodes=31,
        min_samples_leaf=15,
        l2_regularization=0.1,
        random_state=SEED
    )
    team_model.fit(X_team_train, y_team_train)

    # Evaluate Team Model on Held-out Test Set
    t0 = time.time()
    y_team_pred = team_model.predict(X_team_test)
    team_latency_ms = round((time.time() - t0) * 1000.0 / len(X_team_test), 3)

    r2_team = round(float(r2_score(y_team_test, y_team_pred)), 4)
    rmse_team = round(float(np.sqrt(mean_squared_error(y_team_test, y_team_pred))), 4)
    mae_team = round(float(mean_absolute_error(y_team_test, y_team_pred)), 4)

    r2_team_base = round(float(r2_score(y_team_test, base_team_test)), 4)
    rmse_team_base = round(float(np.sqrt(mean_squared_error(y_team_test, base_team_test))), 4)
    mae_team_base = round(float(mean_absolute_error(y_team_test, base_team_test)), 4)

    logger.info(f"[Team Test] ML -> R2: {r2_team}, RMSE: {rmse_team}, MAE: {mae_team}, Latency: {team_latency_ms} ms/sample")
    logger.info(f"[Team Test] Baseline -> R2: {r2_team_base}, RMSE: {rmse_team_base}, MAE: {mae_team_base}")

    # Permutation Importance for Team Model
    perm_team = permutation_importance(team_model, X_team_test, y_team_test, n_repeats=5, random_state=SEED, n_jobs=1)
    team_importances = []
    for idx, col in enumerate(TEAM_FEATURE_COLUMNS):
        team_importances.append((col, round(float(perm_team.importances_mean[idx]), 4)))
    team_importances.sort(key=lambda x: x[1], reverse=True)

    # =========================================================================
    # 4. SERIALIZE PRODUCTION ARTIFACTS
    # =========================================================================
    models_dir = os.path.join(project_root, "ml", "models")
    os.makedirs(models_dir, exist_ok=True)

    pair_model_path = os.path.join(models_dir, "team_pair_compatibility_model.pkl")
    team_model_path = os.path.join(models_dir, "team_quality_model.pkl")

    joblib.dump(pair_model, pair_model_path)
    joblib.dump(team_model, team_model_path)

    pair_size_kb = round(os.path.getsize(pair_model_path) / 1024.0, 2)
    team_size_kb = round(os.path.getsize(team_model_path) / 1024.0, 2)

    logger.info(f"Saved pair model: {pair_model_path} ({pair_size_kb} KB)")
    logger.info(f"Saved team model: {team_model_path} ({team_size_kb} KB)")

    # =========================================================================
    # 5. GENERATE MARKDOWN REPORT
    # =========================================================================
    data_dir = os.path.join(project_root, "ml", "data")
    os.makedirs(data_dir, exist_ok=True)
    report_path = os.path.join(data_dir, "team_generator_report.md")

    report_content = f"""# ML Team Generator Production Report (`team_generator_v1`)

## Academic & Operational Disclosure
> **"This is a genuine trained ML inference system, but its current training labels are derived/synthetic because insufficient real historical team outcome data exists."**
>
> **"The evaluated metrics measure how faithfully the model learns and generalizes the derived compatibility/team-quality function; they do not establish real-world team success or user preference accuracy."**

---

## 1. Model Identity & Summary
- **System Name:** ML-Powered Team Formation System
- **Model Version:** `team_generator_v1`
- **Level 1 Model:** `team_pair_compatibility_model.pkl` ({pair_size_kb} KB) - `HistGradientBoostingRegressor`
- **Level 2 Model:** `team_quality_model.pkl` ({team_size_kb} KB) - `HistGradientBoostingRegressor`
- **Training Timestamp:** {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}

---

## 2. Dataset & Zero-Leakage Grouped Partition
- **Total Students in Database:** {total_students}
- **Group-Aware Splitting:** Students partitioned strictly by unique ID:
  - **Train Pool:** {len(train_students)} students (70.0%)
  - **Validation Pool:** {len(val_students)} students (15.0%)
  - **Held-Out Test Pool:** {len(test_students)} students (15.0%)
- **Data Leakage Mitigation:** Zero student overlap between partitions. Pairs and candidate teams were constructed exclusively within their respective student partition.

| Partition | Pairwise Examples (Level 1) | Candidate Team Examples (Level 2) |
|---|---|---|
| **Training** | {len(X_pair_train)} | {len(X_team_train)} |
| **Validation** | {len(X_pair_val)} | {len(X_team_val)} |
| **Held-Out Test** | {len(X_pair_test)} | {len(X_team_test)} |

---

## 3. Held-Out Evaluation Metrics & Baseline Comparison

### Level 1: Pairwise Student Compatibility Model
Evaluated on {len(X_pair_test)} unseen student pairs:

| Metric | Scikit-Learn ML Model (`HistGradientBoostingRegressor`) | Rule-Based Baseline |
|---|---|---|
| **$R^2$ Score** | **{r2_pair}** | {r2_pair_base} |
| **RMSE** | **{rmse_pair}** | {rmse_pair_base} |
| **MAE** | **{mae_pair}** | {mae_pair_base} |
| **Inference Latency** | **{pair_latency_ms} ms/sample** | < 0.1 ms |

### Level 2: Team-Level Quality Model
Evaluated on {len(X_team_test)} unseen candidate teams:

| Metric | Scikit-Learn ML Model (`HistGradientBoostingRegressor`) | Rule-Based Baseline |
|---|---|---|
| **$R^2$ Score** | **{r2_team}** | {r2_team_base} |
| **RMSE** | **{rmse_team}** | {rmse_team_base} |
| **MAE** | **{mae_team}** | {mae_team_base} |
| **Inference Latency** | **{team_latency_ms} ms/sample** | < 0.1 ms |

---

## 4. Permutation Feature Importances

### Pairwise Model Feature Importance
| Rank | Feature Name | Mean Importance (\\Delta R^2) |
|---|---|---|
"""
    for rank, (feat, imp) in enumerate(pair_importances, 1):
        report_content += f"| {rank} | `{feat}` | {imp} |\n"

    report_content += """
### Team-Level Quality Model Feature Importance
| Rank | Feature Name | Mean Importance (\\Delta R^2) |
|---|---|---|
"""
    for rank, (feat, imp) in enumerate(team_importances, 1):
        report_content += f"| {rank} | `{feat}` | {imp} |\n"

    report_content += """
---

## 5. Constrained Optimization & Production Architecture
1. **Hard Constraints:**
   - Active builder status, availability, exclude leader from external slots.
   - Enforce exact target team size $N \\in [2, 6]$.
   - Filter candidates possessing idea/must-have skill affinity to prevent combinatorial explosion.
2. **Constrained Formation:**
   - Vectorize candidate pool pairwise features and infer compatibility matrix with Level 1 model.
   - Seed teams using highest compatible anchor pairs covering must-have skills.
   - Greedy expansion + beam search with local 1-opt/2-opt candidate exchange.
   - Level 2 model scores team cross-functional quality, selecting the globally maximal configuration.
3. **Dynamic Role Assignment:**
   - Synthesizes roles (Frontend, Backend, AI/ML, Design, Product Lead) based on each student's strongest competency profile relative to the project idea.

---

## 6. Future Retraining Plan
When empirical outcome data accumulates in PostgreSQL:
- Track accepted invitations, project completions, hackathon placements, and peer feedback.
- Swap or augment derived synthetic targets with real collaboration outcome weights.
- Retraining command: `python ml/train_team_generator.py`.
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    logger.info(f"Written comprehensive report to {report_path}")
    print("\nTraining and Evaluation Completed Successfully!")


if __name__ == "__main__":
    main()
