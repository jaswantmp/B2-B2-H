# B2B2H Phase 7B Report: Synthetic Target Generation & Validation

> **MANDATORY ACADEMIC DISCLAIMER**: The generated compatibility outcomes are **synthetic experimental targets** and **do not represent real historical team outcomes**. Models evaluated against these targets measure pattern recovery within a controlled experimental framework.

## 1. Executive Summary
- **Total Student-Project Pairs Target File**: `175,000` rows
- **Duplicate Pairs**: `0`
- **Total Missing Values**: `0`
- **Fixed Classification Threshold (derived from TRAIN ONLY)**: `tau_train = 11.8079`

## 2. Grouped Student Split Summary
| Split | Student Count | Pair Count | Percentage | Zero Overlap |
|---|---|---|---|---|
| **Train** | `350` (70%) | `122,500` | 70.0% | **Verified** |
| **Validation** | `75` (15%) | `26,250` | 15.0% | **Verified** |
| **Test** | `75` (15%) | `26,250` | 15.0% | **Verified** |

## 3. Continuous Target Distribution (`compatibility_score`)
| Split / Dataset | Count | Min | Max | Mean | Median | Std Dev |
|---|---|---|---|---|---|---|
| **ALL PAIRS** | `175,000` | 0.0000 | 93.7494 | 12.0712 | 9.4007 | 10.8378 |
| **Train Split** | `122,500` | 0.0000 | 93.7494 | 12.1152 | 9.4359 | 10.8927 |
| **Validation Split** | `26,250` | 0.0000 | 90.0592 | 11.9485 | 9.3495 | 10.6508 |
| **Test Split** | `26,250` | 0.0000 | 92.9979 | 11.9888 | 9.2779 | 10.7655 |

## 4. Binary Classification Target Distribution (`match_outcome`)
- **Classification Threshold ($	au_{train}$)**: `11.8079` (60th Percentile calculated strictly on Training Students)

| Split | Poor Fit (`0`) Count | Good Fit (`1`) Count | Poor Fit % | Good Fit % |
|---|---|---|---|---|
| **Train Split** | `73,499` | `49,001` | 60.0% | 40.0% |
| **Validation Split** | `15,902` | `10,348` | 60.6% | 39.4% |
| **Test Split** | `15,878` | `10,372` | 60.5% | 39.5% |
| **OVERALL** | `105,279` | `69,721` | 60.2% | 39.8% |

## 5. Correlation & Data Leakage Diagnostics
| Feature Name | Pearson Corr w/ `compatibility_score` | Pearson Corr w/ `match_outcome` | Feature Dominance Assessment |
|---|---|---|---|
| `skill_overlap_ratio` | `0.7786` | `0.5248` | Normal Signal |
| `skill_overlap_count` | `0.7742` | `0.5274` | Normal Signal |
| `tfidf_similarity` | `0.7153` | `0.4669` | Normal Signal |
| `student_project_text_similarity` | `0.7495` | `0.5495` | Normal Signal |
| `domain_match` | `0.3916` | `0.3552` | Normal Signal |
| `domain_overlap_count` | `0.3910` | `0.3537` | Normal Signal |
| `interest_overlap_count` | `0.1792` | `0.1803` | Normal Signal |
| `student_project_count` | `0.1017` | `0.0947` | Normal Signal |
| `github_repos` | `0.0776` | `0.0648` | Normal Signal |
| `profile_completion` | `0.0358` | `0.0320` | Normal Signal |

## 6. Quality & Integrity Check Verification
- **Non-Zero Score Variance**: `PASSED` (Overall Std Dev = 10.8378)
- **Both Classes Exist in All Splits**: `PASSED` (Train: 40.0% positive, Val: 39.4% positive, Test: 39.5% positive)
- **No Single Feature Dominance**: `PASSED` (Max feature correlation = 0.7786 < 0.80)
- **Threshold Train-Only Rule**: `PASSED` (Threshold tau = 11.8079 calculated strictly on 122,500 train rows)
- **Zero Student Overlap Between Splits**: `PASSED` (GroupKFold on `student_id`)
