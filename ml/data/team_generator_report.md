# ML Team Generator Production Report (`team_generator_v1`)

## Academic & Operational Disclosure
> **"This is a genuine trained ML inference system, but its current training labels are derived/synthetic because insufficient real historical team outcome data exists."**
>
> **"The evaluated metrics measure how faithfully the model learns and generalizes the derived compatibility/team-quality function; they do not establish real-world team success or user preference accuracy."**

---

## 1. Model Identity & Summary
- **System Name:** ML-Powered Team Formation System
- **Model Version:** `team_generator_v1`
- **Level 1 Model:** `team_pair_compatibility_model.pkl` (535.98 KB) - `HistGradientBoostingRegressor`
- **Level 2 Model:** `team_quality_model.pkl` (540.8 KB) - `HistGradientBoostingRegressor`
- **Training Timestamp:** 2026-09-04 15:38:19 UTC

---

## 2. Dataset & Zero-Leakage Grouped Partition
- **Total Students in Database:** 126
- **Group-Aware Splitting:** Students partitioned strictly by unique ID:
  - **Train Pool:** 88 students (70.0%)
  - **Validation Pool:** 18 students (15.0%)
  - **Held-Out Test Pool:** 20 students (15.0%)
- **Data Leakage Mitigation:** Zero student overlap between partitions. Pairs and candidate teams were constructed exclusively within their respective student partition.

| Partition | Pairwise Examples (Level 1) | Candidate Team Examples (Level 2) |
|---|---|---|
| **Training** | 3828 | 1800 |
| **Validation** | 153 | 400 |
| **Held-Out Test** | 190 | 400 |

---

## 3. Held-Out Evaluation Metrics & Baseline Comparison

### Level 1: Pairwise Student Compatibility Model
Evaluated on 190 unseen student pairs:

| Metric | Scikit-Learn ML Model (`HistGradientBoostingRegressor`) | Rule-Based Baseline |
|---|---|---|
| **$R^2$ Score** | **0.9891** | -129.4816 |
| **RMSE** | **0.5239** | 57.3722 |
| **MAE** | **0.2879** | 56.8718 |
| **Inference Latency** | **0.029 ms/sample** | < 0.1 ms |

### Level 2: Team-Level Quality Model
Evaluated on 400 unseen candidate teams:

| Metric | Scikit-Learn ML Model (`HistGradientBoostingRegressor`) | Rule-Based Baseline |
|---|---|---|
| **$R^2$ Score** | **0.9899** | 0.9295 |
| **RMSE** | **0.9494** | 2.5038 |
| **MAE** | **0.4909** | 2.013 |
| **Inference Latency** | **0.009 ms/sample** | < 0.1 ms |

---

## 4. Permutation Feature Importances

### Pairwise Model Feature Importance
| Rank | Feature Name | Mean Importance (\Delta R^2) |
|---|---|---|
| 1 | `domain_match` | 0.9384 |
| 2 | `skill_overlap_count` | 0.475 |
| 3 | `complementary_skill_count` | 0.151 |
| 4 | `tfidf_similarity` | 0.1148 |
| 5 | `cluster_synergy` | 0.101 |
| 6 | `project_count_total` | 0.0712 |
| 7 | `github_commits_total` | 0.0601 |
| 8 | `year_difference` | 0.0486 |
| 9 | `branch_compatibility` | 0.044 |
| 10 | `skill_overlap_ratio` | 0.0376 |
| 11 | `profile_completion_avg` | 0.0051 |
| 12 | `domain_overlap_count` | 0.0 |
| 13 | `interest_overlap_count` | 0.0 |
| 14 | `experience_balance` | -0.0 |
| 15 | `github_repos_total` | -0.0003 |

### Team-Level Quality Model Feature Importance
| Rank | Feature Name | Mean Importance (\Delta R^2) |
|---|---|---|
| 1 | `category_coverage_count` | 0.561 |
| 2 | `category_balance_entropy` | 0.1975 |
| 3 | `cluster_diversity_count` | 0.0771 |
| 4 | `unique_skills_count` | 0.0301 |
| 5 | `avg_pair_compatibility` | 0.0197 |
| 6 | `total_projects` | 0.0101 |
| 7 | `total_github_commits` | 0.0078 |
| 8 | `min_pair_compatibility` | 0.0056 |
| 9 | `avg_profile_completion` | 0.0011 |
| 10 | `pair_compatibility_std` | 0.0004 |
| 11 | `role_specialization_score` | 0.0003 |
| 12 | `domain_diversity_count` | 0.0001 |
| 13 | `team_size` | -0.0 |
| 14 | `branch_diversity_count` | 0.0 |
| 15 | `year_diversity_count` | 0.0 |

---

## 5. Constrained Optimization & Production Architecture
1. **Hard Constraints:**
   - Active builder status, availability, exclude leader from external slots.
   - Enforce exact target team size $N \in [2, 6]$.
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
