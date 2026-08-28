# B2B2H Phase 11 Report: ML-Based Student–Project Recommendation & Ranking

> **MANDATORY ACADEMIC DISCLAIMER**: The recommendation system combines models trained on synthetic student-project data and synthetic compatibility targets. **Its ranking performance does not establish real-world team-selection accuracy.**

## 1. Executive Summary & Architecture
- **Evaluated Pairs**: `175,000` student-project pairs (500 students $\times$ 350 projects)
- **Model Signals**: Gradient Boosting Regressor (Phase 9) + Gradient Boosting Classifier (Phase 8) + K-Means Clusterer (Phase 10) + NLP TF-IDF Text Similarity (Phase 6).
- **Primary Validation Metric**: Spearman Rank Correlation $\rho = 0.7019$ against synthetic target.
- **Top-5 Recommended Quality**: Avg Target Score = `55.67` vs `11.32` for Random Baseline (**+44.35 points improvement**).

## 2. Transparent Ranking Formula
$$\text{final\_score} = 0.40 \cdot \text{pred\_compat\_score} + 0.30 \cdot (P(\text{Good Fit}) \times 100) + 0.15 \cdot (\text{tfidf\_sim} \times 100) + 0.10 \cdot (\text{skill\_ratio} \times 100) + 0.05 \cdot (\text{domain\_interest\_align} \times 100)$$

## 3. Recommendation Quality & Ablation Analysis
| Ranking Configuration | Spearman Rank Correlation ($\rho$) | Top-5 Avg Compatibility Score | Top-10 Avg Compatibility Score | Impact vs Full Model |
|---|---|---|---|---|
| **Full Hybrid ML Model (Reg 40% + Clf 30% + Sim 30%)** | `0.7019` | **`55.67`** | `49.68` | Full Benchmark |
| **Ablation 1: No Classifier Signal** | `0.6998` | **`55.65`** | `49.69` | -0.02 pts |
| **Ablation 2: No Regressor Signal** | `0.7006` | **`55.25`** | `49.35` | -0.42 pts |
| **Random Baseline Student Selection** | `0.0000` | **`11.32`** | `11.86` | -44.35 pts |

## 4. Sample Recommendation Output (`proj_0001`)
| Rank | Student ID | Final Score | Regressor Score | Classifier P(Good Fit) | Skills Matched | Explanation |
|---|---|---|---|---|---|---|
| 1 | `7c59a687...` | **`59.91`** | `51.09` | `0.9996` | `2/4` | Strong match (Score: 59.9). Matched 2/4 required skills (50%). domain aligned. Segment: High Open-Source Contributor. |
| 2 | `bf5c6dbf...` | **`51.16`** | `36.84` | `0.9992` | `2/4` | Strong match (Score: 51.2). Matched 2/4 required skills (50%). Segment: Applied Project Specialist. |
| 3 | `132eafd1...` | **`51.01`** | `36.64` | `0.9987` | `2/4` | Strong match (Score: 51.0). Matched 2/4 required skills (50%). Segment: Applied Project Specialist. |
| 4 | `b94ac878...` | **`50.30`** | `34.06` | `0.9993` | `2/4` | Strong match (Score: 50.3). Matched 2/4 required skills (50%). Segment: High Open-Source Contributor. |
| 5 | `41548c0f...` | **`50.16`** | `35.26` | `0.9926` | `1/4` | Strong match (Score: 50.2). Matched 1/4 required skills (25%). domain aligned. Segment: High Open-Source Contributor. |

## 5. Python API Interface Demonstration
```python
from ml.recommendation_engine import recommend_students, recommend_projects
# Recommend Top 10 students for a project
top_students = recommend_students('proj_0001', top_k=10)
# Recommend Top 10 projects for a student
top_projects = recommend_projects('b4c077d2-148e-42f9-bc80-1515091459a8', top_k=10)
```

## 6. Critical Limitations
1. **Synthetic Scope**: High ranking performance reflects alignment with synthetic target generation rules.
2. **Not Ground-Truth Accuracy**: System is an experimental prototype for capstone demonstration.
