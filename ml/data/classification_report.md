# B2B2H Phase 8 Report: Supervised Classification — Student-Project Match Prediction

> **MANDATORY ACADEMIC DISCLAIMER**: The classification models learn patterns associated with synthetic compatibility outcomes generated from a simulated experimental framework. **The results do not establish real-world team-selection accuracy.**

## 1. Dataset & Grouped Split Overview
- **Total Dataset Rows**: `175,000` student-project pairs
- **Train Split**: `122,500` pairs (350 unseen students)
- **Validation Split**: `26,250` pairs (75 unseen students)
- **Test Split**: `26,250` pairs (75 unseen students)
- **Splitting Strategy**: Grouped Student Split (`GroupKFold` on `student_id`). Zero student overlap across splits.

## 2. Preprocessing & Feature Engineering
- **Target Variable**: `match_outcome` (0 = Poor Fit, 1 = Good Fit)
- **Feature Counts**: 19 Numerical features, 4 Categorical features $\rightarrow$ 121 encoded inputs.
- **Scaling Rule**: `StandardScaler` fitted **strictly on training data** for Logistic Regression. Passthrough for Tree models.

## 3. Experiment A: Full Feature Model Results (Validation Set)
| Model Family | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Confusion Matrix (TN / FP / FN / TP) |
|---|---|---|---|---|---|---|
| **Non-ML Baseline (Heuristic)** | `0.7006` | `0.989` | `0.2431` | **`0.3903`** | `0.7355` | `15874 / 28 / 7832 / 2516` |
| **Logistic Regression** | `0.8667` | `0.9071` | `0.7373` | **`0.8135`** | `0.9039` | `15121 / 781 / 2718 / 7630` |
| **Random Forest** | `0.8657` | `0.914` | `0.7278` | **`0.8103`** | `0.9016` | `15193 / 709 / 2817 / 7531` |
| **Gradient Boosting** | `0.8668` | `0.9017` | `0.7431` | **`0.8148`** | `0.9049` | `15064 / 838 / 2658 / 7690` |

## 4. Experiment B: Feature Ablation Results (Validation Set)
> **Ablation Notice**: Removed direct target-generating features (`skill_overlap_ratio`, `skill_overlap_count`, `tfidf_similarity`, `student_project_text_similarity`).

| Model Family | Accuracy | Precision | Recall | F1-Score | ROC-AUC | F1 Drop vs Full Model |
|---|---|---|---|---|---|---|
| **Logistic Regression (Ablated)** | `0.8637` | `0.9148` | `0.7215` | **`0.8067`** | `0.8896` | `-0.0068` |
| **Random Forest (Ablated)** | `0.8643` | `0.9064` | `0.7314` | **`0.8096`** | `0.8852` | `-0.0007` |
| **Gradient Boosting (Ablated)** | `0.8638` | `0.9092` | `0.7273` | **`0.8081`** | `0.8942` | `-0.0067` |

## 5. Model Selection & Final Held-Out Test Performance
- **Selected Model**: **Gradient Boosting** (Highest Validation F1 = `0.8148`)
- **Held-Out Test Set Results (ONCE Evaluated)**:
  - **Accuracy**: `0.869`
  - **Precision**: `0.9155`
  - **Recall**: `0.7363`
  - **F1-Score**: **`0.8162`**
  - **ROC-AUC**: `0.8982`
  - **Confusion Matrix**: TN=`15173`, FP=`705`, FN=`2735`, TP=`7637`

## 6. Top 10 Feature Importances (Random Forest)
| Rank | Feature Name | Feature Importance Weight | Description |
|---|---|---|---|
| 1 | `skill_overlap_count` | `0.1883` | Technical/Text alignment indicator |
| 2 | `skill_overlap_ratio` | `0.1631` | Technical/Text alignment indicator |
| 3 | `matched_skill_count` | `0.1479` | Technical/Text alignment indicator |
| 4 | `tfidf_similarity` | `0.1288` | Technical/Text alignment indicator |
| 5 | `student_project_text_similarity` | `0.1003` | Technical/Text alignment indicator |
| 6 | `domain_overlap_count` | `0.0888` | Technical/Text alignment indicator |
| 7 | `domain_match` | `0.0755` | Technical/Text alignment indicator |
| 8 | `interest_overlap_count` | `0.0171` | Technical/Text alignment indicator |
| 9 | `interest_overlap_ratio` | `0.0171` | Technical/Text alignment indicator |
| 10 | `project_description_length` | `0.0131` | Technical/Text alignment indicator |

## 7. Error Analysis (Sample False Positives & False Negatives)
### Sample False Positives (Model predicted Good Fit, Target was Poor Fit)
| Student ID | Project ID | Actual | Predicted | Pred Prob | Key Feature Values |
|---|---|---|---|---|---|
| `075a80d5...` | `proj_0027` | `0` | `1` | `0.9253` | skills=1, tfidf=0.031 |
| `075a80d5...` | `proj_0029` | `0` | `1` | `0.9281` | skills=1, tfidf=0.031 |
| `075a80d5...` | `proj_0062` | `0` | `1` | `0.8584` | skills=1, tfidf=0.011 |
| `075a80d5...` | `proj_0067` | `0` | `1` | `0.8584` | skills=1, tfidf=0.011 |
| `075a80d5...` | `proj_0083` | `0` | `1` | `0.7587` | skills=0, tfidf=0.063 |

### Sample False Negatives (Model predicted Poor Fit, Target was Good Fit)
| Student ID | Project ID | Actual | Predicted | Pred Prob | Key Feature Values |
|---|---|---|---|---|---|
| `075a80d5...` | `proj_0054` | `1` | `0` | `0.101` | skills=0, tfidf=0.000 |
| `075a80d5...` | `proj_0064` | `1` | `0` | `0.1098` | skills=0, tfidf=0.000 |
| `075a80d5...` | `proj_0069` | `1` | `0` | `0.1003` | skills=0, tfidf=0.000 |
| `075a80d5...` | `proj_0080` | `1` | `0` | `0.1052` | skills=0, tfidf=0.033 |
| `075a80d5...` | `proj_0087` | `1` | `0` | `0.1037` | skills=0, tfidf=0.000 |

## 8. Critical Limitations & Capstone Discussion
1. **Synthetic Scope**: High evaluation performance (F1 ~0.81) reflects the model's ability to learn the systematic non-linear relationships defined in the synthetic target generation framework.
2. **No Real-World Causation**: Feature importance weights reflect statistical correlation with synthetic labels, not empirical human team effectiveness.
