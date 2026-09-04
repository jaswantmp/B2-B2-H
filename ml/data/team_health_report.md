# ML Team Health Production Report (`team_health_v1`)

## Academic & Operational Disclosure
> **"This model does not establish real-world team success prediction because reliable historical team outcome labels are currently unavailable."**
>
> **"The current model learns and generalizes an engineered team-health function. Evaluation metrics measure fidelity to that derived target and do not establish real-world team success prediction."**

---

## 1. Model Identity & Summary
- **System Name:** ML-Powered Team Health Radar
- **Model Version:** `team_health_v1`
- **Model File:** `team_health_model.pkl` (358.72 KB)
- **Algorithm:** `HistGradientBoostingRegressor`
- **Feature Contract:** 18 continuous and discrete non-PII features
- **Target Contract:** Continuous team health score in $[0, 100]$
- **Training Timestamp:** 2026-09-04 17:03:34 UTC

---

## 2. Dataset & Zero-Leakage Grouped Partition
- **Total Students in PostgreSQL:** 126
- **Student-Level Grouped Splitting:** Students partitioned strictly by unique ID:
  - **Train Pool:** 88 students (70.0%)
  - **Validation Pool:** 18 students (15.0%)
  - **Held-Out Test Pool:** 20 students (15.0%)
- **Data Leakage Mitigation:** Zero student overlap between partitions. Synthetic cohorts were constructed exclusively within their respective student partition.

| Partition | Student Count | Team Samples | Student Overlap |
|---|---|---|---|
| **Training** | 88 | 1200 | 0 |
| **Validation** | 18 | 300 | 0 |
| **Held-Out Test** | 20 | 300 | 0 |

---

## 3. Training Target Definition
The target is a transparent, engineered multi-factor team-health function constructed from collaborative software engineering principles:
1. **Functional Completeness (30%):** Category coverage across Frontend, Backend, AI/ML, Design, Product, and category entropy.
2. **Mean Pairwise Compatibility (30%):** Pairwise ML compatibility from `team_generator_v1` Level 1 model, with bottleneck penalty for weak pairs.
3. **Synergy & Experience Balance (20%):** Student KMeans cluster archetype representation, branch diversity, and academic year balance.
4. **Engineering Activity & Velocity (20%):** Logarithmic commit volume, average completed projects, and active profile presence.

---

## 4. Held-Out Evaluation Metrics & Baseline Comparison

Evaluated on 300 unseen test teams composed solely of held-out students:

| Metric | Scikit-Learn ML Model (`HistGradientBoostingRegressor`) | Deterministic Category Mean Baseline |
|---|---|---|
| **$R^2$ Score (Held-Out)** | **0.9795** | -23.1798 |
| **RMSE** | **0.8018** | 27.5224 |
| **MAE** | **0.5585** | 25.4277 |
| **Inference Latency** | **2.855 ms/sample** | < 0.1 ms |

> *Note: $R^2$ represents the coefficient of determination against the engineered health target, demonstrating how faithfully the model generalizes the multi-factor collaborative health function across unseen student combinations.*

---

## 5. Permutation Feature Importances

| Rank | Feature Name | Mean Importance ($\Delta R^2$) |
|---|---|---|
| 1 | `functional_category_entropy` | 0.9167 |
| 2 | `log_team_total_commits` | 0.2088 |
| 3 | `mean_member_projects` | 0.1136 |
| 4 | `missing_category_count` | 0.0800 |
| 5 | `github_profile_active_ratio` | 0.0586 |
| 6 | `mean_pairwise_compatibility` | 0.0449 |
| 7 | `min_pairwise_compatibility` | 0.0139 |
| 8 | `experience_range_years` | 0.0112 |
| 9 | `multi_contributor_categories` | 0.0109 |
| 10 | `unique_skill_count` | 0.0049 |
| 11 | `avg_skill_level` | 0.0013 |
| 12 | `branch_diversity_count` | 0.0010 |
| 13 | `domain_interest_jaccard_mean` | 0.0008 |
| 14 | `compatibility_std_dev` | 0.0003 |
| 15 | `core_skill_redundancy` | 0.0002 |
| 16 | `cluster_diversity_count` | 0.0000 |
| 17 | `role_assigned_ratio` | 0.0000 |
| 18 | `team_size` | -0.0000 |

---

## 6. Real-World API & Radar Architectural Separation

The system maintains a strict separation between factual coverage and ML prediction:
- **Radar Dimensions (Factual / Deterministic):** `Frontend`, `Backend`, `AI/ML`, `Design`, `Product` continue to measure factual skill presence.
- **ML Team Health (Prediction):** `ml_health_score` represents the holistic learned collaboration quality score ($0 - 100$).
- **UI Health Status Mapping:**
  - $\ge 75$: `Healthy`
  - $50 - 74$: `Moderate`
  - $< 50$: `At Risk`

---

## 7. Fallback Behavior
If the ML model artifact is missing or fails during inference:
1. System logs warning without exposing stack traces.
2. Sets `is_ml_powered: false`.
3. Falls back to deterministic arithmetic mean of functional category scores.
4. Radar and UI continue working with 100% reliability.
