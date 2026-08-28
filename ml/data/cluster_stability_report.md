# B2B2H Phase 10B Report: K-Means Cluster Stability & Interpretation Check

> **MANDATORY ACADEMIC DISCLAIMER**: All student data (500 profiles) is **synthetic**. The clustering structure reflects synthetic feature distributions. Clusters are **discovered profile segments** and do **not represent ground-truth student expertise or real-world categories**.

## 1. Executive Summary & Design Objectives
- **Evaluated Student Dataset**: `500` synthetic student profiles
- **Evaluation Scope**: Direct comparison between `K = 2` and `K = 4` across 5 random seeds (`0, 1, 21, 42, 100`).
- **Primary Finding**: Both `K = 2` and `K = 4` exhibit **exceptionally high seed stability** (`ARI = 0.8846` for K=2, `ARI = 0.8911` for K=4).

## 2. K=2 vs K=4 Quantitative Comparison Matrix
| Metric | K = 2 (Binary Division) | K = 4 (4-Segment Archetypes) | Trade-Off & Practical Assessment |
|---|---|---|---|
| **Mean Silhouette Score** | `0.1300 ± 0.0041` | `0.1108 ± 0.0025` | K=2 higher separation (+0.0192) |
| **Mean Inertia** | `5583.32` | `4743.45` | K=4 reduces variance by 15.0% |
| **Mean Pairwise ARI Stability** | `0.8846` | **`0.8911`** | **K=4 achieves slightly higher seed consistency** |
| **Cluster Size Range** | `174 to 326 (34.8% / 65.2%)` | `67 to 183 (13.4% / 36.6%)` | Both K configurations are well-balanced |

## 3. Multi-Seed Stability Results Across 5 Random Seeds
### K = 2 Stability Breakdown
| Seed | Silhouette Score | Inertia | Cluster Sizes (0 / 1) |
|---|---|---|---|
| `seed=0` | `0.1334` | `5582.69` | `174 / 326` |
| `seed=1` | `0.1310` | `5583.54` | `321 / 179` |
| `seed=21` | `0.1222` | `5584.45` | `297 / 203` |
| `seed=42` | `0.1334` | `5582.69` | `326 / 174` |
| `seed=100` | `0.1300` | `5583.21` | `319 / 181` |

### K = 4 Stability Breakdown
| Seed | Silhouette Score | Inertia | Cluster Sizes (0 / 1 / 2 / 3) |
|---|---|---|---|
| `seed=0` | `0.1121` | `4739.56` | `181 / 68 / 65 / 186` |
| `seed=1` | `0.1057` | `4758.21` | `68 / 94 / 174 / 164` |
| `seed=21` | `0.1123` | `4739.63` | `189 / 68 / 178 / 65` |
| `seed=42` | `0.1118` | `4740.25` | `69 / 67 / 183 / 181` |
| `seed=100` | `0.1118` | `4739.62` | `65 / 180 / 186 / 69` |

## 4. Standardized Feature z-Scores & Distinguishing Features
### Distinguishing Features for K = 2
- **Cluster 0** (n=326, 65.2%):
  - **Highest Distinguishing Features**: `github_repos (+0.43z); github_commits (+0.43z); github_stars (+0.28z); github_followers (+0.26z)`
  - **Lowest Distinguishing Features**: `project_count (-0.38z); project_technology_count (-0.38z); interest_count (-0.12z); profile_completion (-0.10z)`
- **Cluster 1** (n=174, 34.8%):
  - **Highest Distinguishing Features**: `project_count (+0.71z); project_technology_count (+0.70z); interest_count (+0.23z); profile_completion (+0.20z)`
  - **Lowest Distinguishing Features**: `github_repos (-0.81z); github_commits (-0.80z); github_stars (-0.53z); github_followers (-0.49z)`

### Distinguishing Features for K = 4
- **Cluster 0** (n=69, 13.8%):
  - **Highest Distinguishing Features**: `project_count (+1.99z); project_technology_count (+1.96z); profile_completion (+0.34z); hackathons_participated (+0.29z)`
  - **Lowest Distinguishing Features**: `github_commits (-0.50z); github_stars (-0.37z); github_repos (-0.34z); tfidf_development (-0.28z)`
- **Cluster 1** (n=67, 13.4%):
  - **Highest Distinguishing Features**: `hackathons_won (+1.91z); hackathons_participated (+0.83z); domain_count (+0.24z); tfidf_cloud (+0.23z)`
  - **Lowest Distinguishing Features**: `project_technology_count (-0.34z); project_count (-0.34z); tfidf_leadership (-0.17z); tfidf_team (-0.17z)`
- **Cluster 2** (n=183, 36.6%):
  - **Highest Distinguishing Features**: `github_commits (+0.90z); github_repos (+0.86z); github_stars (+0.40z); github_followers (+0.22z)`
  - **Lowest Distinguishing Features**: `hackathons_won (-0.41z); project_count (-0.34z); project_technology_count (-0.32z); hackathons_participated (-0.30z)`
- **Cluster 3** (n=181, 36.2%):
  - **Highest Distinguishing Features**: `tfidf_cleantech (+0.13z); tfidf_computing (+0.10z); tfidf_robotics (+0.09z); tfidf_git (+0.08z)`
  - **Lowest Distinguishing Features**: `github_repos (-0.79z); github_commits (-0.71z); hackathons_won (-0.40z); github_stars (-0.31z)`

## 5. Final Recommendation & Selection Decision
### Recommendation: **Option B — K = 4 Provides More Useful & Defensible Segmentation**

1. **Slight Silhouette Trade-off for Granular Utility**: While $K=2$ yields a slightly higher silhouette score (`0.1334` vs `0.1118`), $K=2$ merely separates students into a coarse binary split (Open-Source Contributors vs Project Builders).
2. **Equal Seed Stability**: $K=4$ demonstrates virtually identical multi-seed stability (`ARI = 0.8911` vs `0.8846`), confirming that the 4-cluster structure is mathematically robust and reproducible.
3. **Direct Utility for B2B2H Capstone**: $K=4$ isolates 4 actionable student profile segments:
   - **Cluster 0**: Applied Project Builders (`project_count` $+1.99z$)
   - **Cluster 1**: Hackathon Champions (`hackathons_won` $+1.91z$)
   - **Cluster 2**: High Open-Source Contributors (`github_commits` $+0.90z$)
   - **Cluster 3**: Emerging Generalists (`github_commits` $-0.71z$)

## 6. Generated Visualizations & Output Artifacts
- **PCA Cluster Scatter (K=2)**: `ml/data/clustering_plots/stability_k2_pca.png`
- **PCA Cluster Scatter (K=4)**: `ml/data/clustering_plots/stability_k4_pca.png`
- **Multi-Seed Stability Comparison**: `ml/data/clustering_plots/stability_silhouette_comparison.png`
- **Results CSV**: `ml/data/cluster_stability_results.csv`
- **Profiles CSV**: `ml/data/cluster_profiles.csv`

## 7. Critical Limitations
1. **Synthetic Data Limit**: All profiles are synthetic. Cluster structure reflects the synthetic data generator parameters.
2. **Descriptive Segments Only**: Clusters are discovered feature groupings. They **do not prove ground-truth human expertise**.
