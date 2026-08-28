# B2B2H Phase 9 Report: Supervised Regression — Compatibility Score Prediction

> **MANDATORY ACADEMIC DISCLAIMER**: The regression models learn patterns associated with synthetic compatibility scores generated from a simulated experimental framework. **The results do not establish real-world team-selection accuracy.**

## 1. Executive Summary & Design Objectives
- **Total Dataset Rows**: `175,000` student-project pair records
- **Train Split**: `122,500` pairs (350 unseen students)
- **Validation Split**: `26,250` pairs (75 unseen students)
- **Test Split**: `26,250` pairs (75 unseen students)
- **Splitting Strategy**: Grouped Student Split (`GroupKFold` on `student_id`). Zero student overlap across splits.

## 2. Preprocessing & Feature Engineering
- **Target Variable**: `compatibility_score` (Continuous score `0.0` to `100.0`)
- **Feature Input Space**: 19 Numerical features, 4 Categorical features $\rightarrow$ 121 encoded inputs.
- **Scaling Rule**: `StandardScaler` fitted **strictly on training data** for Ridge Regression. Passthrough for Tree regressors.

## 3. Experiment A: Full Feature Regression Results (Validation Set)
| Regressor Model | MAE | RMSE (Primary Metric) | R² Score | Performance Summary |
|---|---|---|---|---|
| **Non-ML Baseline (Heuristic)** | `6.7962` | **`8.7215`** | `0.3294` | Validation Benchmark |
| **Ridge Regression** | `3.7599` | **`4.6429`** | `0.81` | Validation Benchmark |
| **Random Forest** | `3.7872` | **`4.6739`** | `0.8074` | Validation Benchmark |
| **Gradient Boosting** | `3.7622` | **`4.6427`** | `0.81` | Validation Benchmark |

## 4. Experiment B: Feature Ablation Results (Validation Set)
> **Ablation Notice**: Removed direct target-generating features (`skill_overlap_ratio`, `skill_overlap_count`, `tfidf_similarity`, `student_project_text_similarity`).

| Regressor Model | Ablated MAE | Ablated RMSE | Ablated R² | Full R² | R² Change |
|---|---|---|---|---|---|
| **Ridge Regression (Ablated)** | `4.0434` | `5.0463` | **`0.7755`** | `0.81` | `-0.0345` |
| **Random Forest (Ablated)** | `3.9671` | `4.9153` | **`0.787`** | `0.8074` | `-0.0204` |
| **Gradient Boosting (Ablated)** | `3.9265` | `4.8598` | **`0.7918`** | `0.81` | `-0.0182` |

## 5. Model Selection & Final Held-Out Test Set Performance
- **Selected Regressor**: **Gradient Boosting** (Lowest Validation RMSE = `4.6427`)
- **Held-Out Test Set Results (ONCE Evaluated)**:
  - **Mean Absolute Error (MAE)**: `3.8264`
  - **Root Mean Squared Error (RMSE)**: **`4.7215`**
  - **$R^2$ Score**: `0.8076`

## 6. Error Analysis & Score Bucket Breakdown (Test Split)
- **Overall Test MAE**: `3.8264`
- **Median Absolute Error**: `3.4158`
- **90th Percentile Absolute Error**: `7.3679`
- **Maximum Absolute Error**: `20.3221`

**MAE by Score Range Buckets**:
| Compatibility Score Range | Pair Count | Mean Absolute Error (MAE) |
|---|---|---|
| `0–20` | `21,347` | `3.7159` |
| `20–40` | `4,249` | `4.2713` |
| `40–60` | `542` | `4.5275` |
| `60–80` | `101` | `4.3043` |
| `80–100` | `11` | `7.4369` |

## 7. Sample Prediction Error Inspection
### 10 Predictions with Smallest Errors
| Student ID | Project ID | Actual Score | Predicted Score | Absolute Error |
|---|---|---|---|---|
| `1f9bd25e...` | `proj_0309` | `5.8857` | `5.8853` | `0.0004` |
| `075a80d5...` | `proj_0146` | `36.1692` | `36.1688` | `0.0004` |
| `ed5299a2...` | `proj_0179` | `19.4750` | `19.4754` | `0.0004` |
| `25444a13...` | `proj_0235` | `18.5789` | `18.5795` | `0.0006` |
| `16e1d5c0...` | `proj_0204` | `4.8758` | `4.8767` | `0.0009` |
| `dcb6a76d...` | `proj_0216` | `5.5104` | `5.5092` | `0.0012` |
| `347dcda4...` | `proj_0184` | `39.3467` | `39.3453` | `0.0014` |
| `0811fe08...` | `proj_0276` | `6.5411` | `6.5425` | `0.0014` |
| `a488a43c...` | `proj_0018` | `5.7867` | `5.7884` | `0.0017` |
| `1f9bd25e...` | `proj_0201` | `11.6883` | `11.6864` | `0.0019` |

### 10 Predictions with Largest Errors
| Student ID | Project ID | Actual Score | Predicted Score | Absolute Error |
|---|---|---|---|---|
| `2eb80ac5...` | `proj_0004` | `26.3021` | `5.9800` | `20.3221` |
| `9fecce85...` | `proj_0008` | `25.6849` | `5.6611` | `20.0238` |
| `5a5e88c1...` | `proj_0017` | `24.3671` | `4.5280` | `19.8391` |
| `fb92583d...` | `proj_0272` | `1.0641` | `20.6662` | `19.6021` |
| `42564104...` | `proj_0133` | `23.6627` | `4.3853` | `19.2774` |
| `6c480048...` | `proj_0073` | `28.4363` | `9.7610` | `18.6753` |
| `347dcda4...` | `proj_0247` | `52.2937` | `33.6310` | `18.6627` |
| `5f1f946b...` | `proj_0044` | `24.2174` | `5.6304` | `18.5870` |
| `f8ec485a...` | `proj_0207` | `22.5287` | `3.9819` | `18.5468` |
| `d052c5f3...` | `proj_0311` | `31.0334` | `12.6028` | `18.4306` |

## 8. Top 10 Feature Importances (Random Forest Regressor)
| Rank | Feature Name | Feature Importance Weight | Description |
|---|---|---|---|
| 1 | `matched_skill_count` | `0.2829` | Technical/Text alignment indicator |
| 2 | `skill_overlap_count` | `0.2466` | Technical/Text alignment indicator |
| 3 | `skill_overlap_ratio` | `0.1976` | Technical/Text alignment indicator |
| 4 | `domain_overlap_count` | `0.0852` | Technical/Text alignment indicator |
| 5 | `domain_match` | `0.0736` | Technical/Text alignment indicator |
| 6 | `tfidf_similarity` | `0.0424` | Technical/Text alignment indicator |
| 7 | `interest_overlap_ratio` | `0.0121` | Technical/Text alignment indicator |
| 8 | `student_project_count` | `0.012` | Technical/Text alignment indicator |
| 9 | `interest_overlap_count` | `0.0118` | Technical/Text alignment indicator |
| 10 | `github_repos` | `0.0089` | Technical/Text alignment indicator |

## 9. Generated Visualizations
- **Actual vs Predicted Scatter**: `ml/data/regression_plots/actual_vs_predicted.png`
- **Residual Error Distribution**: `ml/data/regression_plots/residuals_distribution.png`
- **Feature Importance Bar Chart**: `ml/data/regression_plots/feature_importance.png`

## 10. Critical Leakage Check & Capstone Limitations
1. **Target Recovery vs Real Performance**: The high $R^2$ score (~0.81) reflects successful mathematical recovery of the multi-factor synthetic score formula under Gaussian noise ($\sigma=5.0$).
2. **No Real-World Ground Truth**: All data and target scores are synthetic. Performance on this benchmark proves model capability within simulated parameters.
