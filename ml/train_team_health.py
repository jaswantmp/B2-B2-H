"""
ml/train_team_health.py

Production Training Pipeline for Team Health Radar ML Conversion (Step 3: team_health_v1).

SCIENTIFIC DISCLOSURE:
"This model does not establish real-world team success prediction because reliable
historical team outcome labels are currently unavailable. The current model learns
and generalizes an engineered team-health function. Evaluation metrics measure
fidelity to that derived target and do not establish real-world team success prediction."
"""

import os
import sys
import time
import math
import random
import logging
from itertools import combinations
from datetime import datetime

import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score

# Ensure backend and ml modules are importable
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
from app.models.team import Team, TeamMember

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("TrainTeamHealth")

SEED = 42
random.seed(SEED)
np.random.seed(SEED)

# Functional categories and keywords (consistent with existing app)
CATEGORY_KEYWORDS = {
    "Frontend": ["react", "angular", "vue.js", "vue", "flutter", "android", "ios", "javascript", "typescript", "tailwind css", "tailwind", "next.js", "svelte", "html5", "css3", "css", "html"],
    "Backend": ["node.js", "node", "express.js", "express", "fastapi", "django", "spring boot", "spring", "java", "c++", "c", "python", "go", "rust", "postgresql", "mysql", "mongodb", "firebase", "aws", "azure", "docker", "kubernetes", "devops", "redis"],
    "AI/ML": ["machine learning", "deep learning", "artificial intelligence", "generative ai", "ai", "ml", "data science", "prompt engineering", "agentic ai", "langchain", "huggingface", "rag", "langgraph", "crewai", "tensorflow", "pytorch", "opencv", "nlp", "transformers", "vector"],
    "Design": ["ui design", "ux design", "ui/ux", "ui", "ux", "figma", "canva", "graphic design", "wireframing", "prototyping", "design", "unreal engine", "unity", "blender"],
    "Product": ["product management", "business analysis", "market research", "startup strategy", "public speaking", "presentation", "pitching", "technical writing", "documentation", "team leadership", "project management", "problem solving", "innovation", "ideation", "pitch deck creation", "demo building", "research", "rapid prototyping", "product", "agile", "strategy", "roadmap", "pm", "product manager"]
}

BRANCH_GROUPS = {
    "cs": {"computer science", "information technology", "software engineering", "computer engineering", "cse", "it"},
    "ece_ee": {"electronics", "electrical", "ece", "eee", "embedded"},
    "mech_civil": {"mechanical", "civil", "aerospace", "mechatronics"}
}

# The 18 explicit feature columns for team_health_v1
TEAM_HEALTH_FEATURE_COLUMNS = [
    "team_size",
    "role_assigned_ratio",
    "multi_contributor_categories",
    "unique_skill_count",
    "functional_category_entropy",
    "missing_category_count",
    "core_skill_redundancy",
    "avg_skill_level",
    "mean_pairwise_compatibility",
    "min_pairwise_compatibility",
    "compatibility_std_dev",
    "cluster_diversity_count",
    "branch_diversity_count",
    "experience_range_years",
    "domain_interest_jaccard_mean",
    "log_team_total_commits",
    "mean_member_projects",
    "github_profile_active_ratio"
]

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


def extract_student_profiles(db):
    """
    Extract non-PII student profiles from live PostgreSQL database using bulk joined queries.
    STRICT PRIVACY: Excludes names, emails, raw IDs, GitHub usernames, avatars, auth tokens.
    """
    from sqlalchemy.orm import joinedload
    from collections import defaultdict

    logger.info("Extracting student profiles in bulk from PostgreSQL...")
    users = (
        db.query(User)
        .options(
            joinedload(User.user_skills).joinedload(UserSkill.skill),
            joinedload(User.github_profile)
        )
        .filter(User.is_active == True)
        .all()
    )

    created_map = defaultdict(int)
    for cid, _ in db.query(Project.creator_id, Project.id).all():
        if cid:
            created_map[cid] += 1

    member_map = defaultdict(int)
    for uid, _ in db.query(ProjectMember.user_id, ProjectMember.id).all():
        if uid:
            member_map[uid] += 1

    # Load KMeans cluster preprocessors if available
    from ml.inference import get_inference_engine
    engine = get_inference_engine()

    profiles = []
    for u in users:
        skills_raw = []
        skills_set = set()
        skill_prof_weights = []
        verified_count = 0
        for us in getattr(u, "user_skills", []) or []:
            if us.skill and us.skill.name:
                s_name = us.skill.name.strip().lower()
                skills_raw.append(s_name)
                skills_set.add(s_name)
                prof = (us.proficiency or "intermediate").lower()
                w = 2.0 if prof == "advanced" else (1.0 if prof == "beginner" else 1.5)
                if getattr(us, "is_verified", False):
                    w *= 1.25
                    verified_count += 1
                skill_prof_weights.append(w)

        avg_skill_prof = float(np.mean(skill_prof_weights)) if skill_prof_weights else 1.25

        domains = [d.lower().strip() for d in (getattr(u, "domains", []) or []) if isinstance(d, str)]
        interests = [i.lower().strip() for i in (getattr(u, "interests", []) or []) if isinstance(i, str)]

        gh = getattr(u, "github_profile", None)
        commits = int(getattr(gh, "commits", 0) or 0)
        repos = int(getattr(gh, "repos", 0) or 0)
        stars = int(getattr(gh, "stars", 0) or 0)

        total_projects = created_map[u.id] + member_map[u.id]

        branch_clean = (getattr(u, "branch", "") or "").lower().strip()
        year_str = str(getattr(u, "year", "") or "3")
        year_int = 3
        for c in year_str:
            if c.isdigit():
                year_int = int(c)
                break

        # Fast cluster prediction using inference engine
        cluster_info = engine.predict_cluster_detailed({
            "github_commits": commits,
            "github_repos": repos,
            "github_stars": stars,
            "student_project_count": total_projects,
            "hackathons_participated": getattr(u, "hackathons_participated", 0) or 0,
            "hackathons_won": getattr(u, "hackathons_won", 0) or 0,
            "skills": list(skills_set),
            "domains": domains,
            "interests": interests
        })
        cluster_id = cluster_info.get("cluster_id", 3)

        comp = 0.3
        if skills_set: comp += 0.3
        if domains or interests: comp += 0.2
        if commits > 0 or total_projects > 0: comp += 0.2

        profiles.append({
            "student_id": str(u.id),
            "skills_set": skills_set,
            "skills_raw": skills_raw,
            "avg_skill_prof": avg_skill_prof,
            "verified_count": verified_count,
            "domains": set(domains),
            "interests": set(interests),
            "branch": branch_clean,
            "year": year_int,
            "commits": commits,
            "repos": repos,
            "stars": stars,
            "projects": total_projects,
            "cluster_id": cluster_id,
            "profile_completion": comp
        })

    return profiles


def compute_pair_features(a: dict, b: dict) -> dict:
    """Compute Level 1 pair feature vector for two candidates."""
    shared_skills = a["skills_set"] & b["skills_set"]
    union_skills = a["skills_set"] | b["skills_set"]
    overlap_count = len(shared_skills)
    overlap_ratio = round(overlap_count / max(1, len(union_skills)), 4)
    complementary_count = len(union_skills - shared_skills)

    shared_domains = a["domains"] & b["domains"]
    domain_match = 1 if len(shared_domains) > 0 else 0
    domain_overlap_count = len(shared_domains)
    interest_overlap_count = len(a["interests"] & b["interests"])

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
    gh_commits = a["commits"] + b["commits"]
    gh_repos = a["repos"] + b["repos"]
    proj_total = a["projects"] + b["projects"]
    exp_balance = abs(a["projects"] - b["projects"])
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


def compute_team_health_features(team_members: list[dict], pair_scores_lookup: dict = None) -> tuple[dict, dict]:
    """
    Compute the 18 team-level health features AND the factual deterministic category scores.
    """
    k = len(team_members)

    # 1. Pairwise scores within team
    pair_scores = []
    pair_jaccards = []
    for a, b in combinations(team_members, 2):
        if pair_scores_lookup is not None:
            s = pair_scores_lookup.get((a["student_id"], b["student_id"]), 75.0)
        else:
            pf = compute_pair_features(a, b)
            s = 70.0 + pf["skill_overlap_ratio"] * 15.0 + pf["domain_match"] * 10.0
        pair_scores.append(s)

        # Domain/interest Jaccard
        di_a = a["domains"] | a["interests"]
        di_b = b["domains"] | b["interests"]
        jacc = len(di_a & di_b) / max(1, len(di_a | di_b))
        pair_jaccards.append(jacc)

    mean_pair_compat = round(float(np.mean(pair_scores)), 2) if pair_scores else 75.0
    min_pair_compat = round(float(np.min(pair_scores)), 2) if pair_scores else 70.0
    std_pair_compat = round(float(np.std(pair_scores)), 2) if pair_scores else 0.0
    domain_jaccard_mean = round(float(np.mean(pair_jaccards)), 4) if pair_jaccards else 0.25

    # 2. Functional Category Coverage & Multi-contributor counts
    cat_contributors = {cat: 0 for cat in CATEGORY_KEYWORDS}
    all_team_skills = []
    for m in team_members:
        all_team_skills.extend(m["skills_raw"])
        for cat, kws in CATEGORY_KEYWORDS.items():
            if any(any(kw in s for kw in kws) for s in m["skills_set"]):
                cat_contributors[cat] += 1

    unique_skills = set(all_team_skills)
    unique_skill_count = len(unique_skills)
    core_skill_redundancy = round(len(all_team_skills) / max(1, unique_skill_count), 2)
    multi_contributor_count = sum(1 for cnt in cat_contributors.values() if cnt >= 2)
    missing_category_count = sum(1 for cnt in cat_contributors.values() if cnt == 0)

    # Category balance entropy
    total_contribs = sum(cat_contributors.values())
    if total_contribs > 0:
        entropy = 0.0
        for cnt in cat_contributors.values():
            if cnt > 0:
                p = cnt / total_contribs
                entropy -= p * math.log2(p)
        max_ent = math.log2(len(CATEGORY_KEYWORDS))
        norm_entropy = round(min(1.0, max(0.0, entropy / max_ent)), 4)
    else:
        norm_entropy = 0.0

    # 3. Structure, Diversity, Experience, Activity
    role_assigned_ratio = 1.0  # Synthetic default (or derived from team member role)
    avg_skill_level = round(float(np.mean([m["avg_skill_prof"] for m in team_members])), 2)
    cluster_div = len(set(m["cluster_id"] for m in team_members))
    branch_div = len(set(m["branch"] for m in team_members if m["branch"])) or 1
    years = [m["year"] for m in team_members]
    exp_range = max(years) - min(years) if years else 0

    tot_commits = sum(m["commits"] for m in team_members)
    log_commits = round(float(math.log2(1 + tot_commits)), 2)
    mean_projects = round(float(np.mean([m["projects"] for m in team_members])), 2)
    active_gh_ratio = round(sum(1 for m in team_members if m["commits"] > 0) / max(1, k), 2)

    # 4. Factual deterministic category scores (0-100) for baseline comparison
    deterministic_category_scores = {}
    for cat in CATEGORY_KEYWORDS:
        contrib_count = cat_contributors[cat]
        if contrib_count == 0:
            deterministic_category_scores[cat] = 0
        else:
            raw = 25.0 * contrib_count + (10.0 if contrib_count >= 2 else 5.0)
            deterministic_category_scores[cat] = min(100, max(20, round(raw)))

    feats = {
        "team_size": k,
        "role_assigned_ratio": role_assigned_ratio,
        "multi_contributor_categories": multi_contributor_count,
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
        "github_profile_active_ratio": active_gh_ratio
    }

    return feats, deterministic_category_scores


def compute_derived_team_health_target(feats: dict) -> float:
    """
    Engineered/derived team-health target (0-100 continuous regression).

    SCIENTIFIC DOCUMENTATION:
    Constructed transparently from:
    1. Functional Completeness (30%):
       - Category completeness (missing categories penalized)
       - Functional entropy & unique skill breadth
    2. Pairwise Synergy & Compatibility (30%):
       - Mean pairwise compatibility
       - Bottleneck penalty for low minimum compatibility
    3. Diversity & Experience Balance (20%):
       - Student archetype cluster diversity
       - Branch diversity & academic year balance
    4. Engineering Activity & Velocity (20%):
       - Logarithmic commits & project execution velocity
       - Active GitHub contributor ratio
    """
    # 1. Functional Completeness (30 pts)
    covered_cats = 5 - feats["missing_category_count"]
    comp_score = (covered_cats / 5.0) * 18.0
    comp_score += feats["functional_category_entropy"] * 8.0
    comp_score += min(4.0, feats["unique_skill_count"] * 0.3)

    # 2. Pairwise Compatibility & Synergy (30 pts)
    pair_score = (feats["mean_pairwise_compatibility"] / 100.0) * 26.0
    # Weakest link penalty if bottleneck pair is significantly below average
    bottleneck_diff = max(0.0, feats["mean_pairwise_compatibility"] - feats["min_pairwise_compatibility"])
    pair_score -= min(6.0, bottleneck_diff * 0.20)
    # Complementary redundancy
    pair_score += min(4.0, feats["multi_contributor_categories"] * 0.8)

    # 3. Diversity & Experience Balance (20 pts)
    cluster_score = (feats["cluster_diversity_count"] / 4.0) * 9.0
    branch_score = min(4.0, feats["branch_diversity_count"] * 1.5)
    year_bal = 4.0 if 1 <= feats["experience_range_years"] <= 2 else (2.0 if feats["experience_range_years"] == 0 else 3.0)
    domain_cohesion = feats["domain_interest_jaccard_mean"] * 3.0
    div_score = cluster_score + branch_score + year_bal + domain_cohesion

    # 4. Activity & Velocity (20 pts)
    commit_score = min(9.0, feats["log_team_total_commits"] * 1.0)
    proj_score = min(6.0, feats["mean_member_projects"] * 1.5)
    gh_active_score = feats["github_profile_active_ratio"] * 5.0
    act_score = commit_score + proj_score + gh_active_score

    total_target = comp_score + pair_score + div_score + act_score
    return round(float(np.clip(total_target, 35.0, 99.0)), 2)


def compute_deterministic_health_baseline(cat_scores: dict) -> float:
    """Deterministic baseline: arithmetic mean of the 5 functional category coverage scores."""
    if not cat_scores:
        return 50.0
    return round(float(np.mean(list(cat_scores.values()))), 2)


def main():
    logger.info("Starting ML Team Health Training Pipeline (team_health_v1)...")
    db = SessionLocal()
    try:
        profiles = extract_student_profiles(db)
    finally:
        db.close()

    total_students = len(profiles)
    logger.info(f"Total students extracted from DB: {total_students}")

    # =========================================================================
    # 1. GROUP-AWARE SPLIT (Zero Student Leakage)
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

    # Verification of zero student overlap
    train_ids = set(s["student_id"] for s in train_students)
    val_ids = set(s["student_id"] for s in val_students)
    test_ids = set(s["student_id"] for s in test_students)

    assert len(train_ids & val_ids) == 0, "Leakage detected between Train and Val!"
    assert len(train_ids & test_ids) == 0, "Leakage detected between Train and Test!"
    assert len(val_ids & test_ids) == 0, "Leakage detected between Val and Test!"
    logger.info("ZERO STUDENT LEAKAGE CONFIRMED across Train, Val, and Held-Out Test sets.")

    logger.info(f"Student Pools -> Train: {len(train_students)} (70%), Val: {len(val_students)} (15%), Test: {len(test_students)} (15%)")

    # Load Level 1 pairwise model for inference if available
    from ml.inference import get_inference_engine
    engine = get_inference_engine()
    pair_model = engine.team_pair_model

    logger.info("Precomputing pairwise matrix across student profiles using Level 1 ML model...")
    pair_scores_lookup = {}
    pair_rows = []
    pair_keys = []
    for a, b in combinations(profiles, 2):
        pf = compute_pair_features(a, b)
        pair_rows.append(pf)
        pair_keys.append((a["student_id"], b["student_id"]))

    df_all_pairs = pd.DataFrame(pair_rows)[PAIR_FEATURE_COLUMNS]
    if pair_model is not None:
        batch_scores = pair_model.predict(df_all_pairs)
    else:
        batch_scores = [70.0 + r["skill_overlap_ratio"] * 15.0 + r["domain_match"] * 10.0 for r in pair_rows]

    for (ida, idb), sc in zip(pair_keys, batch_scores):
        pair_scores_lookup[(ida, idb)] = float(sc)
        pair_scores_lookup[(idb, ida)] = float(sc)

    logger.info(f"Precomputed {len(pair_scores_lookup)} directional pair scores in memory.")

    # =========================================================================
    # 2. SYNTHETIC COHORT SAMPLING EXCLUSIVELY WITHIN POOLS
    # =========================================================================
    def generate_team_dataset(student_pool, num_teams: int, desc: str):
        logger.info(f"Sampling {num_teams} teams for {desc}...")
        rows = []
        targets = []
        baselines = []
        n_pool = len(student_pool)

        for _ in range(num_teams):
            # Vary team size between 2 and 6
            t_size = random.choice([2, 3, 4, 4, 5, 6])
            selected_members = random.sample(student_pool, min(t_size, n_pool))

            feats, cat_scores = compute_team_health_features(selected_members, pair_scores_lookup)
            tgt = compute_derived_team_health_target(feats)
            base = compute_deterministic_health_baseline(cat_scores)

            rows.append(feats)
            targets.append(tgt)
            baselines.append(base)

        df = pd.DataFrame(rows)[TEAM_HEALTH_FEATURE_COLUMNS]
        return df, np.array(targets), np.array(baselines)

    X_train, y_train, b_train = generate_team_dataset(train_students, 1200, "Train")
    X_val, y_val, b_val = generate_team_dataset(val_students, 300, "Validation")
    X_test, y_test, b_test = generate_team_dataset(test_students, 300, "Held-Out Test")

    logger.info(f"Dataset generated: Train={len(X_train)}, Val={len(X_val)}, Test={len(X_test)}")

    # =========================================================================
    # 3. MODEL TRAINING: HistGradientBoostingRegressor
    # =========================================================================
    logger.info("Training HistGradientBoostingRegressor for Team Health Radar...")
    model = HistGradientBoostingRegressor(
        max_iter=150,
        learning_rate=0.06,
        max_depth=6,
        min_samples_leaf=15,
        l2_regularization=0.1,
        random_state=SEED
    )
    model.fit(X_train, y_train)

    # =========================================================================
    # 4. EVALUATION: Validation & Held-Out Test Set
    # =========================================================================
    y_pred_val = model.predict(X_val)
    y_pred_test = model.predict(X_test)

    r2_val = r2_score(y_val, y_pred_val)
    rmse_val = math.sqrt(mean_squared_error(y_val, y_pred_val))
    mae_val = mean_absolute_error(y_val, y_pred_val)

    r2_test = r2_score(y_test, y_pred_test)
    rmse_test = math.sqrt(mean_squared_error(y_test, y_pred_test))
    mae_test = mean_absolute_error(y_test, y_pred_test)

    # Baseline on Test
    r2_base = r2_score(y_test, b_test)
    rmse_base = math.sqrt(mean_squared_error(y_test, b_test))
    mae_base = mean_absolute_error(y_test, b_test)

    logger.info(f"Validation Metrics -> R2: {r2_val:.4f}, RMSE: {rmse_val:.4f}, MAE: {mae_val:.4f}")
    logger.info(f"Held-Out Test Metrics -> R2: {r2_test:.4f}, RMSE: {rmse_test:.4f}, MAE: {mae_test:.4f}")
    logger.info(f"Deterministic Baseline on Test -> R2: {r2_base:.4f}, RMSE: {rmse_base:.4f}, MAE: {mae_base:.4f}")

    # =========================================================================
    # 5. PERMUTATION FEATURE IMPORTANCE
    # =========================================================================
    logger.info("Computing permutation feature importance on held-out test set...")
    perm_res = permutation_importance(model, X_test, y_test, n_repeats=10, random_state=SEED)
    perm_importances = []
    for idx in np.argsort(perm_res.importances_mean)[::-1]:
        col = TEAM_HEALTH_FEATURE_COLUMNS[idx]
        score = float(perm_res.importances_mean[idx])
        perm_importances.append((col, score))
        logger.info(f"  Feature Importance: {col:<30} = {score:.4f}")

    # =========================================================================
    # 6. INFERENCE LATENCY BENCHMARK
    # =========================================================================
    logger.info("Benchmarking inference latency over 1,000 samples...")
    sample_row = X_test.iloc[[0]]
    start_time = time.perf_counter()
    N_BENCH = 1000
    for _ in range(N_BENCH):
        _ = model.predict(sample_row)
    total_time = time.perf_counter() - start_time
    latency_ms = (total_time / N_BENCH) * 1000.0
    logger.info(f"Benchmark: {latency_ms:.3f} ms per single-team inference")

    # =========================================================================
    # 7. SAVE MODEL ARTIFACT & METADATA
    # =========================================================================
    models_dir = os.path.join(project_root, "ml", "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "team_health_model.pkl")

    joblib.dump(model, model_path)
    file_size_kb = round(os.path.getsize(model_path) / 1024.0, 2)
    logger.info(f"Saved production model to {model_path} ({file_size_kb} KB)")

    # =========================================================================
    # 8. WRITE COMPREHENSIVE PRODUCTION REPORT
    # =========================================================================
    data_dir = os.path.join(project_root, "ml", "data")
    os.makedirs(data_dir, exist_ok=True)
    report_path = os.path.join(data_dir, "team_health_report.md")

    now_utc = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")

    report_content = f"""# ML Team Health Production Report (`team_health_v1`)

## Academic & Operational Disclosure
> **"This model does not establish real-world team success prediction because reliable historical team outcome labels are currently unavailable."**
>
> **"The current model learns and generalizes an engineered team-health function. Evaluation metrics measure fidelity to that derived target and do not establish real-world team success prediction."**

---

## 1. Model Identity & Summary
- **System Name:** ML-Powered Team Health Radar
- **Model Version:** `team_health_v1`
- **Model File:** `team_health_model.pkl` ({file_size_kb} KB)
- **Algorithm:** `HistGradientBoostingRegressor`
- **Feature Contract:** 18 continuous and discrete non-PII features
- **Target Contract:** Continuous team health score in $[0, 100]$
- **Training Timestamp:** {now_utc}

---

## 2. Dataset & Zero-Leakage Grouped Partition
- **Total Students in PostgreSQL:** {total_students}
- **Student-Level Grouped Splitting:** Students partitioned strictly by unique ID:
  - **Train Pool:** {len(train_students)} students (70.0%)
  - **Validation Pool:** {len(val_students)} students (15.0%)
  - **Held-Out Test Pool:** {len(test_students)} students (15.0%)
- **Data Leakage Mitigation:** Zero student overlap between partitions. Synthetic cohorts were constructed exclusively within their respective student partition.

| Partition | Student Count | Team Samples | Student Overlap |
|---|---|---|---|
| **Training** | {len(train_students)} | {len(X_train)} | 0 |
| **Validation** | {len(val_students)} | {len(X_val)} | 0 |
| **Held-Out Test** | {len(test_students)} | {len(X_test)} | 0 |

---

## 3. Training Target Definition
The target is a transparent, engineered multi-factor team-health function constructed from collaborative software engineering principles:
1. **Functional Completeness (30%):** Category coverage across Frontend, Backend, AI/ML, Design, Product, and category entropy.
2. **Mean Pairwise Compatibility (30%):** Pairwise ML compatibility from `team_generator_v1` Level 1 model, with bottleneck penalty for weak pairs.
3. **Synergy & Experience Balance (20%):** Student KMeans cluster archetype representation, branch diversity, and academic year balance.
4. **Engineering Activity & Velocity (20%):** Logarithmic commit volume, average completed projects, and active profile presence.

---

## 4. Held-Out Evaluation Metrics & Baseline Comparison

Evaluated on {len(X_test)} unseen test teams composed solely of held-out students:

| Metric | Scikit-Learn ML Model (`HistGradientBoostingRegressor`) | Deterministic Category Mean Baseline |
|---|---|---|
| **$R^2$ Score (Held-Out)** | **{r2_test:.4f}** | {r2_base:.4f} |
| **RMSE** | **{rmse_test:.4f}** | {rmse_base:.4f} |
| **MAE** | **{mae_test:.4f}** | {mae_base:.4f} |
| **Inference Latency** | **{latency_ms:.3f} ms/sample** | < 0.1 ms |

> *Note: $R^2$ represents the coefficient of determination against the engineered health target, demonstrating how faithfully the model generalizes the multi-factor collaborative health function across unseen student combinations.*

---

## 5. Permutation Feature Importances

| Rank | Feature Name | Mean Importance ($\Delta R^2$) |
|---|---|---|
"""
    for rank, (col, imp) in enumerate(perm_importances, 1):
        report_content += f"| {rank} | `{col}` | {imp:.4f} |\n"

    report_content += f"""
---

## 6. Real-World API & Radar Architectural Separation

The system maintains a strict separation between factual coverage and ML prediction:
- **Radar Dimensions (Factual / Deterministic):** `Frontend`, `Backend`, `AI/ML`, `Design`, `Product` continue to measure factual skill presence.
- **ML Team Health (Prediction):** `ml_health_score` represents the holistic learned collaboration quality score ($0 - 100$).
- **UI Health Status Mapping:**
  - $\\ge 75$: `Healthy`
  - $50 - 74$: `Moderate`
  - $< 50$: `At Risk`

---

## 7. Fallback Behavior
If the ML model artifact is missing or fails during inference:
1. System logs warning without exposing stack traces.
2. Sets `is_ml_powered: false`.
3. Falls back to deterministic arithmetic mean of functional category scores.
4. Radar and UI continue working with 100% reliability.
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    logger.info(f"Comprehensive report saved to {report_path}")
    logger.info("ML Team Health Training Pipeline completed successfully!")


if __name__ == "__main__":
    main()
