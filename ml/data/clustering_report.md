# B2B2H Phase 10 Report: Unsupervised K-Means Student Segmentation

> **MANDATORY ACADEMIC DISCLAIMER**: All student profiles (500) are **synthetic**. K-Means clusters are **discovered from available numerical and text features**. Cluster labels represent descriptive segments and **do not represent verified student identities or real-world ground-truth expertise**.

## 1. Executive Summary & Design Objectives
- **Evaluated Students**: `500` synthetic student profiles
- **Input Feature Space**: 12 Numerical features + 30 TF-IDF text features = 42 Total Clustering Features
- **Selected Number of Clusters**: `K = 4` (Silhouette Score: `0.1118`, Inertia: `4740.25`)
- **Zero Identifier Leakage**: High-cardinality IDs (`student_id`, `name`, `username`, `email`) were strictly excluded from clustering.

## 2. Preprocessing & Feature Engineering
1. **Numerical Features**: Scaled using `StandardScaler` to equalize variance across disparate scales (e.g. `github_commits` vs `project_count`).
2. **Text Representation**: Extracted 30-term TF-IDF features from concatenated `skills`, `interests`, and `domains` list strings.
3. **Combined Representation**: Concatenated numerical scaled matrix and L2-normalized TF-IDF matrix into single $500 \times 42$ feature matrix $X$.

## 3. Cluster Number Selection Evaluation (K = 2..8)
| Number of Clusters (K) | Inertia | Silhouette Score | Evaluation Notes |
|---|---|---|---|
| **K = 2** | `5582.69` | **`0.1334`** | Evaluated |
| **K = 3** | `5051.32` | **`0.1113`** | Evaluated |
| **K = 4** | `4740.25` | **`0.1118`** | **Selected K** |
| **K = 5** | `4508.28` | **`0.0972`** | Evaluated |
| **K = 6** | `4326.79` | **`0.0919`** | Evaluated |
| **K = 7** | `4216.79` | **`0.0829`** | Evaluated |
| **K = 8** | `4069.23` | **`0.0887`** | Evaluated |

## 4. Discovered Cluster Profiles & Segment Interpretations
### Cluster 0: Descriptive Profile (n = 69, 13.8%)
- **Activity Averages**: Projects = `2.46` | Hackathons Participated = `2.33` (Wins: `0.42`) | Commits = `204.3` | Repos = `13.03`
- **Profile Completion**: `86.3%` | Skills/Student = `8.19` | Domains/Student = `3.1`
- **Top Skills**: Python (24), Communication (24), Rapid Prototyping (21), Team Leadership (19), Problem Solving (14)
- **Top Domains**: IoT (19), AI/ML (17), Civil (15), Logistics (13)
- **Top Interests**: Bioinformatics (10), Robotics (9), Smart Cities (9), FinTech (8)
- **Segment Interpretation**: High-experience builders with strong project execution (avg 2.46 projects) and high IoT/AI/ML domain representation.

### Cluster 1: Descriptive Profile (n = 67, 13.4%)
- **Activity Averages**: Projects = `0.4` | Hackathons Participated = `3.3` (Wins: `1.3`) | Commits = `316.3` | Repos = `18.21`
- **Profile Completion**: `84.2%` | Skills/Student = `8.13` | Domains/Student = `3.24`
- **Top Skills**: Rapid Prototyping (19), Presentation (19), Communication (18), Python (17), Team Leadership (15)
- **Top Domains**: Civil (18), EdTech (15), Robotics (15), Aerospace (14)
- **Top Interests**: IoT (14), Cybersecurity (13), SpaceTech (12), Game Development (12)
- **Segment Interpretation**: Hackathon competitors with high hackathon participation (avg 3.30 hackathons) and prototyping/presentation focus.

### Cluster 2: Descriptive Profile (n = 183, 36.6%)
- **Activity Averages**: Projects = `0.4` | Hackathons Participated = `1.28` (Wins: `0.04`) | Commits = `542.9` | Repos = `25.66`
- **Profile Completion**: `82.9%` | Skills/Student = `8.33` | Domains/Student = `2.94`
- **Top Skills**: Team Leadership (59), Rapid Prototyping (58), Presentation (48), Problem Solving (47), Python (43)
- **Top Domains**: Design (37), Civil (35), Aerospace (34), EdTech (34)
- **Top Interests**: Game Development (35), Blockchain (35), Web3 (33), Renewable Energy (31)
- **Segment Interpretation**: High GitHub open-source contributors (avg 542.9 commits) with leadership, design, and aerospace/civil focus.

### Cluster 3: Descriptive Profile (n = 181, 36.2%)
- **Activity Averages**: Projects = `0.44` | Hackathons Participated = `1.61` (Wins: `0.05`) | Commits = `153.3` | Repos = `8.2`
- **Profile Completion**: `82.0%` | Skills/Student = `7.61` | Domains/Student = `3.04`
- **Top Skills**: Team Leadership (53), Presentation (53), Communication (50), Git (49), Python (43)
- **Top Domains**: Robotics (37), Logistics (37), CleanTech (34), Cybersecurity (30)
- **Top Interests**: Robotics (33), SpaceTech (33), HealthTech (32), FinTech (31)
- **Segment Interpretation**: Generalist builders with balanced robotics/logistics interests and steady Git activity.

## 5. Generated Visualizations
- **Elbow Curve**: `ml/data/clustering_plots/elbow_curve.png`
- **Silhouette Scores**: `ml/data/clustering_plots/silhouette_scores.png`
- **2D PCA Projection**: `ml/data/clustering_plots/pca_clusters.png`
- **Cluster Size Distribution**: `ml/data/clustering_plots/cluster_sizes.png`

## 6. Critical Limitations & Capstone Disclaimer
1. **Synthetic Data**: All student profiles are synthetic mock records.
2. **Descriptive Interpretations**: Clusters are unsupervised groupings discovered by K-Means. Labels are descriptive interpretations, NOT verified student specializations.
3. **Geometric Assumptions**: K-Means assumes spherical cluster distributions and may not capture complex non-linear manifolds.
