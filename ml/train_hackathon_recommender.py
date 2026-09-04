"""
ml/train_hackathon_recommender.py

Train a genuine Scikit-Learn HistGradientBoostingRegressor model for Hackathon Recommendation.

TRANSPARENT METHODOLOGY & DISCLAIMER:
Because the production database contains insufficient historical hackathon participation/outcome data
(only 1 live registration recorded), this model is trained on transparently derived/synthetic compatibility
labels built from multi-factor technical alignment (TF-IDF text similarity, skill coverage, domain affinity,
academic readiness, and GitHub activity + Gaussian noise).
The resulting evaluation metrics measure how well the model reproduces this derived compatibility target,
NOT real-world user preferences or hackathon success outcomes.

Data leakage prevention:
- Grouped split strictly by student_id (zero student overlap between train, validation, and test splits).
- Preprocessors fitted exclusively on the training split.
"""

import os
import sys
import re
import math
import hashlib
import random
import time
import logging
from typing import Dict, List, Any, Tuple

# Ensure backend and project root are in sys.path
base_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(base_dir)
backend_path = os.path.join(project_root, "backend")

if project_root not in sys.path:
    sys.path.insert(0, project_root)
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

import pandas as pd
import numpy as np
import joblib

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.inspection import permutation_importance

from app.database import SessionLocal
from app.models.user import User, UserSkill
from app.models.hackathon import Hackathon
from app.models.project import Project, ProjectMember
from app.constants.recommendation_constants import (
    KNOWN_TECHNICAL_SKILLS,
    KNOWN_DOMAINS,
    BRANCH_DOMAIN_MAPPING,
    SKILL_SYNONYMS,
    DOMAIN_SYNONYMS,
    YEAR_SUITABILITY,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("train_hackathon_recommender")

HACKATHON_FEATURE_COLUMNS = [
    "tfidf_similarity",
    "skill_overlap_count",
    "skill_overlap_ratio",
    "skill_count",
    "verified_skill_count",
    "domain_match",
    "domain_overlap_count",
    "interest_overlap_count",
    "branch_alignment",
    "year_suitability",
    "student_branch",
    "student_year",
    "student_project_count",
    "hackathons_participated",
    "hackathons_won",
    "github_repos",
    "github_commits",
    "github_stars",
    "profile_completion",
    "hackathon_track_count",
    "hackathon_tag_count",
    "hackathon_description_length",
    "hackathon_team_size_max"
]

CATEGORICAL_COLUMNS = ["student_branch", "student_year"]
NUMERICAL_COLUMNS = [col for col in HACKATHON_FEATURE_COLUMNS if col not in CATEGORICAL_COLUMNS]

STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "can", "will", "just", "should", "now"
}


def normalize_str(val: str, synonyms: dict) -> str:
    if not val:
        return ""
    v = val.lower().strip()
    v = re.sub(r'[-_]', ' ', v)
    v = re.sub(r'\s+', ' ', v)
    return synonyms.get(v, v)


def tokenize(text: str) -> List[str]:
    if not text:
        return []
    words = re.findall(r'\b[a-zA-Z0-9_\+#\.-]+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 1]


from collections import Counter


def compute_tfidf_similarity(text1: str, text2: str) -> float:
    t1 = tokenize(text1)
    t2 = tokenize(text2)
    if not t1 or not t2:
        return 0.0
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
    digits = re.findall(r'\d+', team_size_str)
    if digits:
        return max(int(d) for d in digits)
    return 4


def get_deterministic_noise(student_id: str, hackathon_id: int, seed: int = 42, std: float = 3.0) -> float:
    key = f"hk_{student_id}_{hackathon_id}_{seed}".encode("utf-8")
    h = hashlib.md5(key).hexdigest()
    int_seed = int(h[:8], 16)
    rng = random.Random(int_seed)
    return rng.gauss(0.0, std)


def extract_data_from_db() -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]]]:
    """Fetch students and hackathons from the live PostgreSQL database."""
    db = SessionLocal()
    try:
        from sqlalchemy import func
        from sqlalchemy.orm import joinedload
        users = (
            db.query(User)
            .options(
                joinedload(User.user_skills).joinedload(UserSkill.skill),
                joinedload(User.github_profile)
            )
            .filter(User.is_active == True)
            .all()
        )
        hackathons = db.query(Hackathon).all()

        # Pre-aggregate project counts in 2 fast queries instead of 252 queries
        proj_created_map = dict(db.query(Project.creator_id, func.count(Project.id)).group_by(Project.creator_id).all())
        proj_member_map = dict(db.query(ProjectMember.user_id, func.count(ProjectMember.id)).group_by(ProjectMember.user_id).all())

        logger.info(f"Loaded {len(users)} users and {len(hackathons)} hackathons from database.")

        parsed_students = []
        for u in users:
            skills = []
            verified_skills = []
            for us in u.user_skills:
                if us.skill:
                    norm_s = normalize_str(us.skill.name, SKILL_SYNONYMS)
                    skills.append(norm_s)
                    if us.is_verified:
                        verified_skills.append(norm_s)

            domains = [normalize_str(d, DOMAIN_SYNONYMS) for d in (u.domains or []) if d]
            interests = [normalize_str(i, DOMAIN_SYNONYMS) for i in (getattr(u, "interests", []) or []) if i]

            gh = getattr(u, "github_profile", None)
            repos = getattr(gh, "repos", 0) if gh else 0
            commits = getattr(gh, "commits", 0) if gh else 0
            stars = getattr(gh, "stars", 0) if gh else 0

            # Project memberships count from pre-aggregated map
            proj_count = proj_created_map.get(u.id, 0) + proj_member_map.get(u.id, 0)

            h_won = getattr(u, "hackathons_won", 0) or 0
            h_part = h_won + (1 if proj_count > 0 else 0)

            # Profile completion
            fields = [
                bool(u.name), bool(u.bio), bool(u.university), bool(skills),
                bool(domains), bool(getattr(u, "github", None))
            ]
            comp = round(sum(fields) / len(fields), 2)


            parsed_students.append({
                "id": str(u.id),
                "skills": list(set(skills)),
                "verified_skills": list(set(verified_skills)),
                "domains": list(set(domains)),
                "interests": list(set(interests)),
                "branch": u.branch.strip() if u.branch else "Computer Science",
                "year": u.year.strip() if u.year else "3rd Year",
                "project_count": proj_count,
                "hackathons_participated": h_part,
                "hackathons_won": h_won,
                "github_repos": repos,
                "github_commits": commits,
                "github_stars": stars,
                "profile_completion": comp,
                "bio": u.bio or ""
            })

        parsed_hackathons = []
        for h in hackathons:
            tracks = [normalize_str(t, SKILL_SYNONYMS) for t in (h.tracks or []) if t]
            tags = [normalize_str(t, DOMAIN_SYNONYMS) for t in (h.tags or []) if t]
            team_max = parse_team_size_max(h.team_size)

            parsed_hackathons.append({
                "id": h.id,
                "title": h.title,
                "organizer": h.organizer,
                "description": h.description or "",
                "tracks": tracks,
                "tags": tags,
                "team_size_max": team_max,
                "location": h.location or "Online",
                "prize": h.prize or "₹50,000"
            })

        return parsed_students, parsed_hackathons
    finally:
        db.close()


def build_pair_dataset(
    students: List[Dict[str, Any]], hackathons: List[Dict[str, Any]]
) -> pd.DataFrame:
    """
    Build student-hackathon pair dataset with 23 features and transparent derived target.
    """
    rows = []
    combined_synonyms = {**SKILL_SYNONYMS, **DOMAIN_SYNONYMS}

    for s in students:
        s_skills = set(s["skills"])
        s_domains = set(s["domains"])
        s_interests = set(s["interests"])

        # Branch domain mapping lookup
        branch_norm = normalize_str(s["branch"], {})
        branch_domains = set()
        for b_key, b_doms in BRANCH_DOMAIN_MAPPING.items():
            if b_key in branch_norm or branch_norm in b_key:
                branch_domains.update(b_doms)
                break

        # Academic year score (0.0 to 1.0)
        y_val = YEAR_SUITABILITY.get(s["year"], 10) / 10.0

        for h in hackathons:
            # Map hackathon tracks/tags into skills and domains
            h_skills = set()
            h_domains = set()
            for item in (h["tracks"] + h["tags"]):
                norm_item = normalize_str(item, combined_synonyms)
                for sk in KNOWN_TECHNICAL_SKILLS:
                    if sk == norm_item or sk in norm_item or norm_item in sk:
                        h_skills.add(sk)
                for dom in KNOWN_DOMAINS:
                    if dom == norm_item or dom in norm_item or norm_item in dom:
                        h_domains.add(dom)

            matched_skills = s_skills.intersection(h_skills)
            matched_domains = s_domains.intersection(h_domains)
            matched_interests = s_interests.intersection(set(h["tags"]))

            req_skills_cnt = max(1, len(h_skills))
            skill_overlap_cnt = len(matched_skills)
            skill_overlap_ratio = round(skill_overlap_cnt / req_skills_cnt, 4)

            domain_match = 1.0 if matched_domains else 0.0
            domain_overlap_cnt = len(matched_domains)

            branch_align = 1.0 if branch_domains.intersection(h_domains) else 0.0

            # Text similarity between student bio+skills and hackathon info
            s_text = f"{s['bio']} {' '.join(s_skills)} {' '.join(s_domains)}"
            h_text = f"{h['title']} {h['description']} {' '.join(h['tracks'])} {' '.join(h['tags'])}"
            tfidf_sim = compute_tfidf_similarity(s_text, h_text)

            # Feature dictionary matching contract
            features = {
                "student_id": s["id"],
                "hackathon_id": h["id"],
                "tfidf_similarity": tfidf_sim,
                "skill_overlap_count": skill_overlap_cnt,
                "skill_overlap_ratio": skill_overlap_ratio,
                "skill_count": len(s_skills),
                "verified_skill_count": len(s["verified_skills"]),
                "domain_match": domain_match,
                "domain_overlap_count": domain_overlap_cnt,
                "interest_overlap_count": len(matched_interests),
                "branch_alignment": branch_align,
                "year_suitability": y_val,
                "student_branch": s["branch"],
                "student_year": s["year"],
                "student_project_count": s["project_count"],
                "hackathons_participated": s["hackathons_participated"],
                "hackathons_won": s["hackathons_won"],
                "github_repos": s["github_repos"],
                "github_commits": s["github_commits"],
                "github_stars": s["github_stars"],
                "profile_completion": s["profile_completion"],
                "hackathon_track_count": len(h["tracks"]),
                "hackathon_tag_count": len(h["tags"]),
                "hackathon_description_length": len(h["description"]),
                "hackathon_team_size_max": h["team_size_max"]
            }

            # -------------------------------------------------------------
            # Transparent Derived Compatibility Score Target:
            # Latent non-linear technical alignment:
            #   - 35% Skill alignment & coverage
            #   - 25% Domain & interest alignment
            #   - 20% TF-IDF text semantic match
            #   - 10% Branch readiness & academic year suitability
            #   - 10% GitHub activity & project experience bonus
            #   - Deterministic Gaussian noise N(0, 3^2) to simulate natural variance
            # -------------------------------------------------------------
            skill_comp = (0.7 * skill_overlap_ratio + 0.3 * min(1.0, len(s["verified_skills"]) / 3.0)) * 35.0
            domain_comp = (0.6 * domain_match + 0.4 * min(1.0, len(matched_interests) / 2.0)) * 25.0
            text_comp = min(1.0, tfidf_sim * 2.0) * 20.0
            academic_comp = (0.5 * branch_align + 0.5 * y_val) * 10.0
            
            # Experience bonus
            gh_factor = min(1.0, (s["github_commits"] / 100.0) + (s["github_repos"] / 10.0))
            exp_comp = (0.5 * min(1.0, s["project_count"] / 3.0) + 0.5 * gh_factor) * 10.0

            noise = get_deterministic_noise(s["id"], h["id"], seed=42, std=3.0)
            derived_score = 40.0 + (skill_comp + domain_comp + text_comp + academic_comp + exp_comp) * 0.58 + noise
            derived_score = float(round(np.clip(derived_score, 40.0, 99.0), 2))

            features["compatibility_target"] = derived_score

            # Also compute legacy rule-based baseline score for direct benchmark comparison
            rule_skills = round((len(matched_skills) / max(1, len(s_skills))) * 40.0)
            rule_domains = round((len(matched_domains) / max(1, len(s_domains))) * 35.0) if s_domains else 0
            rule_branch = 15 if branch_align > 0 else 0
            rule_year = YEAR_SUITABILITY.get(s["year"], 10)
            rule_score = float(round(rule_skills + rule_domains + rule_branch + rule_year, 2))
            features["legacy_rule_score"] = rule_score

            rows.append(features)

    df = pd.DataFrame(rows)
    logger.info(f"Constructed pair dataset: {df.shape[0]} rows, {df.shape[1]} columns.")
    return df


def train_hackathon_model():
    t0 = time.time()
    models_dir = os.path.join(base_dir, "models")
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    model_path = os.path.join(models_dir, "hackathon_recommendation_model.pkl")
    report_path = os.path.join(data_dir, "hackathon_recommendation_report.md")

    # 1. Fetch live DB data
    students, hackathons = extract_data_from_db()
    df = build_pair_dataset(students, hackathons)

    # 2. Strict Grouped Split by student_id to prevent data leakage
    unique_students = sorted(list(df["student_id"].unique()))
    rng = random.Random(42)
    rng.shuffle(unique_students)

    n_students = len(unique_students)
    n_train = int(round(n_students * 0.70))
    n_val = int(round(n_students * 0.15))

    train_students = set(unique_students[:n_train])
    val_students = set(unique_students[n_train:n_train + n_val])
    test_students = set(unique_students[n_train + n_val:])

    train_df = df[df["student_id"].isin(train_students)].copy()
    val_df = df[df["student_id"].isin(val_students)].copy()
    test_df = df[df["student_id"].isin(test_students)].copy()

    logger.info(f"Grouped Split: {n_students} students total.")
    logger.info(f"  Train: {len(train_students)} students ({len(train_df)} pairs)")
    logger.info(f"  Val:   {len(val_students)} students ({len(val_df)} pairs)")
    logger.info(f"  Test:  {len(test_students)} students ({len(test_df)} pairs)")

    X_train = train_df[HACKATHON_FEATURE_COLUMNS]
    y_train = train_df["compatibility_target"].values

    X_val = val_df[HACKATHON_FEATURE_COLUMNS]
    y_val = val_df["compatibility_target"].values

    X_test = test_df[HACKATHON_FEATURE_COLUMNS]
    y_test = test_df["compatibility_target"].values
    y_test_rule = test_df["legacy_rule_score"].values

    # 3. Build Scikit-Learn Pipeline
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), NUMERICAL_COLUMNS),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_COLUMNS)
        ],
        remainder="drop"
    )

    regressor = HistGradientBoostingRegressor(
        loss="squared_error",
        learning_rate=0.08,
        max_iter=150,
        max_leaf_nodes=31,
        min_samples_leaf=10,
        random_state=42
    )

    pipeline = Pipeline(steps=[
        ("preprocessor", preprocessor),
        ("regressor", regressor)
    ])

    # 4. Train pipeline on training split only
    logger.info("Fitting HistGradientBoostingRegressor pipeline...")
    pipeline.fit(X_train, y_train)

    def calc_rmse(y_true, y_pred):
        return float(np.sqrt(mean_squared_error(y_true, y_pred)))

    # 5. Evaluate on Validation & Test splits
    y_val_pred = pipeline.predict(X_val)
    val_r2 = r2_score(y_val, y_val_pred)
    val_rmse = calc_rmse(y_val, y_val_pred)
    val_mae = mean_absolute_error(y_val, y_val_pred)

    y_test_pred = pipeline.predict(X_test)
    test_r2 = r2_score(y_test, y_test_pred)
    test_rmse = calc_rmse(y_test, y_test_pred)
    test_mae = mean_absolute_error(y_test, y_test_pred)

    # Legacy rule baseline evaluation on test split
    rule_test_r2 = r2_score(y_test, y_test_rule)
    rule_test_rmse = calc_rmse(y_test, y_test_rule)
    rule_test_mae = mean_absolute_error(y_test, y_test_rule)

    logger.info(f"Validation Metrics -> R2: {val_r2:.4f}, RMSE: {val_rmse:.4f}, MAE: {val_mae:.4f}")
    logger.info(f"Test Metrics (ML)  -> R2: {test_r2:.4f}, RMSE: {test_rmse:.4f}, MAE: {test_mae:.4f}")
    logger.info(f"Test Metrics (Rule Baseline) -> R2: {rule_test_r2:.4f}, RMSE: {rule_test_rmse:.4f}, MAE: {rule_test_mae:.4f}")

    # 6. Compute Feature Importances via Permutation Importance on Test Split
    perm_importance = permutation_importance(
        pipeline, X_test, y_test, n_repeats=10, random_state=42, n_jobs=1
    )
    importances = perm_importance.importances_mean
    feature_ranking = sorted(zip(HACKATHON_FEATURE_COLUMNS, importances), key=lambda x: x[1], reverse=True)

    # 7. Serialize production model
    joblib.dump(pipeline, model_path)
    file_size_kb = round(os.path.getsize(model_path) / 1024, 2)
    logger.info(f"Serialized production model to {model_path} ({file_size_kb} KB)")

    # 8. Generate transparent markdown report
    duration = round(time.time() - t0, 2)
    top_features_md = "\n".join([f"| `{f}` | {score:.4f} |" for f, score in feature_ranking[:10]])

    report_content = f"""# Hackathon Recommendation Model (v1.0) - Training Report

**Model Version:** `hackathon_recommender_v1`  
**Model File:** `ml/models/hackathon_recommendation_model.pkl` ({file_size_kb} KB)  
**Algorithm:** `sklearn.pipeline.Pipeline` (`ColumnTransformer` + `HistGradientBoostingRegressor`)  
**Training Date:** {time.strftime('%Y-%m-%d %H:%M:%S')}  
**Execution Duration:** {duration} seconds  

---

## 1. Transparent Training Methodology & Academic Disclaimer

> [!WARNING]
> **SYNTHETIC / DERIVED LABELS NOTICE**  
> The production database currently contains insufficient historical user-hackathon participation records (only 1 live registration).  
> Therefore, this model was trained on **transparently derived compatibility targets** combining multi-faceted technical alignment (TF-IDF text similarity, skill overlap, domain affinity, academic readiness, and GitHub activity + Gaussian noise).  
> **These metrics measure fidelity against the derived technical compatibility target, NOT real-world user preferences or hackathon success outcomes.**  
> The architecture is designed to allow seamless retraining once sufficient real historical participation and competition outcome data accumulates.

---

## 2. Dataset & Data Leakage Prevention

- **Number of Students:** {n_students}
- **Number of Hackathons:** {len(hackathons)}
- **Total Student-Hackathon Pairs:** {len(df):,}
- **Leakage Prevention:** Strict grouped split by `student_id`. No student appears in more than one split.
  - **Train Set:** {len(train_students)} students ({len(train_df):,} pairs, ~70%)
  - **Validation Set:** {len(val_students)} students ({len(val_df):,} pairs, ~15%)
  - **Held-out Test Set:** {len(test_students)} students ({len(test_df):,} pairs, ~15%)

---

## 3. Performance Metrics on Held-out Test Set

| Metric | ML Model (`hackathon_recommender_v1`) | Legacy Rule-Based Baseline (40/35/15/10) |
| :--- | :---: | :---: |
| **$R^2$ Score** | **{test_r2:.4f}** | {rule_test_r2:.4f} |
| **Root Mean Squared Error (RMSE)** | **{test_rmse:.4f}** | {rule_test_rmse:.4f} |
| **Mean Absolute Error (MAE)** | **{test_mae:.4f}** | {rule_test_mae:.4f} |

*Validation Set Metrics: $R^2 = {val_r2:.4f}$, $\\text{{RMSE}} = {val_rmse:.4f}$, $\\text{{MAE}} = {val_mae:.4f}$.*

---

## 4. Top 10 Permutation Feature Importances (Held-out Test Set)

| Feature | Permutation Importance (Mean Metric Drop) |
| :--- | :---: |
{top_features_md}

---

## 5. Summary & Production Readiness

- **Status:** Trained, serialized, and ready for production inference via `MLInferenceEngine.predict_hackathon_scores()`.
- **Zero Heavy Artifacts:** Model file size is only **{file_size_kb} KB**. No heavy training datasets are required at production runtime.
"""

    with open(report_path, "w", encoding="utf-8") as f:
        f.write(report_content)

    logger.info(f"Report written to {report_path}")
    print("\nTraining completed successfully!")
    print(f"Model saved: {model_path}")
    print(f"Test R2: {test_r2:.4f} | Test RMSE: {test_rmse:.4f} | Test MAE: {test_mae:.4f}")
    return test_r2, test_rmse, test_mae, rule_test_r2, rule_test_rmse, rule_test_mae


if __name__ == "__main__":
    train_hackathon_model()
