# Hackathon Recommendation Model (v1.0) - Training Report

**Model Version:** `hackathon_recommender_v1`  
**Model File:** `ml/models/hackathon_recommendation_model.pkl` (543.04 KB)  
**Algorithm:** `sklearn.pipeline.Pipeline` (`ColumnTransformer` + `HistGradientBoostingRegressor`)  
**Training Date:** 2026-09-04 15:17:07  
**Execution Duration:** 50.56 seconds  

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

- **Number of Students:** 126
- **Number of Hackathons:** 20
- **Total Student-Hackathon Pairs:** 2,520
- **Leakage Prevention:** Strict grouped split by `student_id`. No student appears in more than one split.
  - **Train Set:** 88 students (1,760 pairs, ~70%)
  - **Validation Set:** 19 students (380 pairs, ~15%)
  - **Held-out Test Set:** 19 students (380 pairs, ~15%)

---

## 3. Performance Metrics on Held-out Test Set

| Metric | ML Model (`hackathon_recommender_v1`) | Legacy Rule-Based Baseline (40/35/15/10) |
| :--- | :---: | :---: |
| **$R^2$ Score** | **0.6550** | -46.7214 |
| **Root Mean Squared Error (RMSE)** | **3.4475** | 40.5444 |
| **Mean Absolute Error (MAE)** | **2.8051** | 39.9441 |

*Validation Set Metrics: $R^2 = 0.6531$, $\text{RMSE} = 3.4761$, $\text{MAE} = 2.7434$.*

---

## 4. Top 10 Permutation Feature Importances (Held-out Test Set)

| Feature | Permutation Importance (Mean Metric Drop) |
| :--- | :---: |
| `domain_match` | 0.6001 |
| `verified_skill_count` | 0.2728 |
| `tfidf_similarity` | 0.0676 |
| `student_project_count` | 0.0664 |
| `branch_alignment` | 0.0493 |
| `github_repos` | 0.0409 |
| `github_stars` | 0.0118 |
| `skill_overlap_count` | 0.0087 |
| `github_commits` | 0.0084 |
| `skill_count` | 0.0017 |

---

## 5. Summary & Production Readiness

- **Status:** Trained, serialized, and ready for production inference via `MLInferenceEngine.predict_hackathon_scores()`.
- **Zero Heavy Artifacts:** Model file size is only **543.04 KB**. No heavy training datasets are required at production runtime.
