# B2B2H ML Capstone: Synthetic ML Target Design & Outcome Methodology (Phase 7A)

> **ACADEMIC HONESTY & METHODOLOGY DISCLAIMER**:
> All student profiles (500), project specifications (350), and student-project pair records (175,000) in this capstone dataset are **synthetic**. No real-world historical team formation outcome labels or user interaction logs exist in this dataset. Therefore, the target variables designed in this phase represent **simulated compatibility outcomes generated from a transparent, reproducible multi-factor experimental framework**, rather than real-world ground-truth team success. Models trained on this dataset predict **simulated compatibility scores within a controlled synthetic evaluation setup**.

---

## 1. Executive Summary & Design Objectives

The objective of Phase 7A is to design two target variables for the 175,000 student-project pairwise dataset:

1. **Classification Target (`match_outcome`)**: Binary indicator ($\in \{0, 1\}$) where `0` represents a **Poor Fit** and `1` represents a **Good Fit**.
2. **Regression Target (`compatibility_score`)**: Continuous compatibility metric ranging from `0.0` to `100.0`.

### Key Design Principles:
- **No Single-Feature Dominance**: The target must **NOT** be derived from a single feature (e.g. `skill_match_ratio > threshold` or `tfidf_similarity > 0.3`). Single-feature label definitions lead to trivial data leakage and prevent models from learning non-linear, multi-dimensional patterns.
- **Multi-Factor Synthesis**: The compatibility score synthesizes 5 distinct dimensions: Skill Fit, Text/Semantic Fit, Domain/Role Alignment, Interest Match, and Builder Readiness.
- **Controlled Deterministic Noise**: Controlled reproducible noise ($\mathcal{N}(0, \sigma^2)$ seeded with `hash(student_id, project_id, seed=42)`) is added. The noise is intended to preserve meaningful systematic signal while preventing a perfectly deterministic relationship between the target and its generating factors.
- **Leakage Prevention & Grouped Splitting**: A strict Grouped Student Split (GroupKFold) strategy is specified to prevent data leakage across train, validation, and test folds.

---

## 2. Multi-Factor Compatibility Score Formulation

The continuous target `compatibility_score` ($C_{final} \in [0, 100]$) is computed as the sum of 5 weighted sub-scores plus a controlled noise term:

$$\text{Raw Score } (C_{raw}) = w_1 \cdot S_{skill} + w_2 \cdot S_{semantic} + w_3 \cdot S_{domain} + w_4 \cdot S_{interest} + w_5 \cdot S_{readiness}$$

$$\text{Final Score } (C_{final}) = \text{clip}\left(C_{raw} + \epsilon, 0.0, 100.0\right)$$

### Component Breakdown & Mathematical Definitions

#### 1. Skill Compatibility Sub-score ($S_{skill} \in [0, 100]$) — Weight $w_1 = 0.40$
Skill alignment is the primary technical matching metric. It evaluates both the coverage ratio of required project skills and penalizes missing core skills:
$$S_{skill} = 100 \times \left( 0.70 \times \text{skill\_match\_ratio} + 0.30 \times \min\left(1.0, \frac{\text{matched\_skill\_count}}{3}\right) \right)$$
*Rationale*: A student matching 3+ required skills achieves maximum coverage bonus, while partial skill coverage yields proportional credit.

#### 2. Semantic & Text Alignment Sub-score ($S_{semantic} \in [0, 100]$) — Weight $w_2 = 0.25$
Measures the unstructured text alignment between the student profile (bio, branch, interests) and the project specification (name, description, role):
$$S_{semantic} = 100 \times \left( 0.75 \times \min(1.0, 2.5 \times \text{tfidf\_similarity}) + 0.25 \times \min(1.0, 4.0 \times \text{text\_similarity}) \right)$$
*Rationale*: Scaled TF-IDF cosine similarity rewards deep contextual and terminology alignment beyond exact skill keyword matches.

#### 3. Domain & Role Alignment Sub-score ($S_{domain} \in [0, 100]$) — Weight $w_3 = 0.15$
Evaluates structural alignment between the student's declared engineering domain/branch and the project's domain/role:
$$S_{domain} = 100 \times \left( 0.60 \times \text{domain\_match} + 0.40 \times \min\left(1.0, \frac{\text{domain\_overlap\_count}}{2}\right) \right)$$
*Rationale*: Ensures students belonging to relevant engineering disciplines (e.g. Robotics student for an Autonomous Navigation project) receive domain synergy bonuses.

#### 4. Interest & Concept Overlap Sub-score ($S_{interest} \in [0, 100]$) — Weight $w_4 = 0.10$
Measures student enthusiasm and secondary concept alignment:
$$S_{interest} = 100 \times \min\left(1.0, \frac{\text{interest\_overlap\_count}}{2}\right)$$
*Rationale*: Represents intrinsic motivation and domain interest overlap.

#### 5. Builder Readiness & Profile Quality Sub-score ($S_{readiness} \in [0, 100]$) — Weight $w_5 = 0.10$
Measures student project execution experience and profile completeness:
$$S_{readiness} = 100 \times \left( 0.40 \times \min\left(1.0, \frac{\text{student\_project\_count}}{3}\right) + 0.30 \times \min\left(1.0, \frac{\text{github\_repos}}{15}\right) + 0.30 \times \frac{\text{profile\_completion}}{100} \right)$$
*Rationale*: Moderately rewards active builders without allowing GitHub stats or profile completion to dominate technical skill matching.

---

## 3. Controlled Noise Injection Methodology

To prevent models from simply memorizing the exact linear formula above, a deterministic pseudo-random Gaussian noise term $\epsilon \sim \mathcal{N}(0, \sigma^2)$ with $\sigma = 5.0$ is added to each pair:

$$\epsilon = \text{GaussianNoise}\Big(\mu=0, \sigma=5.0, \text{seed}=\text{hash}(s\_id, p\_id, \text{SEED}=42)\Big)$$

### Noise Properties & Justification:
- **Reproducibility**: Seeded deterministically using student ID, project ID, and fixed seed `42`.
- **Systematic Signal**: The noise is intended to preserve meaningful systematic signal while preventing a perfectly deterministic relationship between the target and its generating factors.
- **Variance**: $\sigma = 5.0$ adds $\pm 5-10\%$ variance on a 0–100 scale, simulating real-world soft human factors (e.g., team communication, individual availability shifts).

---

## 4. Classification Target Generation (`match_outcome`)

The continuous target `compatibility_score` is converted into a binary label `match_outcome` $\in \{0, 1\}$ using a percentile-based thresholding strategy derived from training students:

$$\text{match\_outcome} = \begin{cases} 1 & \text{if } \text{compatibility\_score} \ge \tau_{train} \\ 0 & \text{if } \text{compatibility\_score} < \tau_{train} \end{cases}$$

### Strict Threshold Selection ($\tau_{train}$) & Class Balance Rules:
1. **Training Students Only**: The 60th percentile threshold ($\tau_{train}$) **must be calculated using TRAINING STUDENTS ONLY** (the 70% train split).
2. **Fixed Evaluation Threshold**: The resulting threshold $\tau_{train}$ **must then remain fixed** when evaluating validation and test students. It is **never recalculated** using validation or test data.
3. **Expected Class Balance**: Setting a 60th percentile threshold on train data is expected to produce approximately **40% positive samples** (`1` = Good Fit) and **60% negative samples** (`0` = Poor Fit), subject to ties and score distribution.

---

## 5. Strengthened Data Leakage Analysis & Experimental Setup

### Data Leakage Mechanism Acknowledgment:
If the exact factors used to generate the synthetic target (such as `skill_match_ratio` or `tfidf_similarity`) are provided directly to a supervised model without modification, **the model can simply learn the synthetic target-generation mechanism (formula)** rather than identifying true underlying patterns.

### Experimental Comparison Plan:

To rigorously test and demonstrate model behavior against target-generation leakage, the evaluation will conduct 3 experimental comparisons:

1. **Experiment A (Baseline)**: Direct weighted synthetic compatibility formula (non-ML baseline).
2. **Experiment B (Model Experiment)**: Use engineered predictive features and evaluate whether supervised models can learn generalizable relationships on completely unseen students.
3. **Experiment C (Feature-Ablation Experiment)**: Remove the strongest target-generating features individually (e.g., ablation of `skill_match_ratio` or `tfidf_similarity`) and measure performance degradation to verify feature robustness.

---

## 6. Train / Validation / Test Grouped Splitting Strategy

Standard random splitting ($80/20$ train/test) on pairwise datasets creates severe data leakage because student $S_i$ appears in 350 pairs across both training and testing sets. The model learns student-specific biases rather than generalizable matching patterns.

### Strict Grouped Student Split Rules:
- **70% Train Students**: 350 students $\rightarrow$ 122,500 pairs
- **15% Validation Students**: 75 students $\rightarrow$ 26,250 pairs
- **15% Test Students**: 75 students $\rightarrow$ 26,250 pairs
- **Zero Cross-Split Leakage**: No student ID may appear across multiple splits. Validation and test folds contain **completely unseen students**.

---

## 7. Baseline Methods for Future Comparison

Future supervised ML models will be benchmarked against 3 heuristic baselines:

1. **Baseline 1: Random Guessing / Uniform Prior**: Predicts class `1` with probability equal to class ratio (or mean score for regression).
2. **Baseline 2: Pure Skill-Overlap Heuristic**: Predicts `1` if `skill_overlap_count >= 2`, else `0`.
3. **Baseline 3: Pure TF-IDF Text Similarity Heuristic**: Predicts `1` if `tfidf_similarity >= 0.10`, else `0`.
4. **Baseline 4: Direct Weighted Compatibility Baseline**: Formula calculation without ML training.

---

## 8. Model Evaluation Metrics

### Classification Metrics:
- **Accuracy**: Overall correct classification percentage.
- **Precision**: Proportion of predicted Good Fits that are actually Good Fits (minimizes false positive recommendations).
- **Recall**: Proportion of true Good Fits identified by model (minimizes missed team matches).
- **F1-Score**: Harmonic mean of Precision and Recall (primary classification benchmark metric).
- **ROC-AUC**: Area under ROC curve, measuring overall ranking capability.
- **Confusion Matrix**: Detailed count of TP, FP, TN, FN.

### Regression Metrics:
- **Mean Absolute Error (MAE)**: Average absolute error in points on the 0–100 scale.
- **Root Mean Squared Error (RMSE)**: Penalizes larger prediction errors.
- **$R^2$ Score (Coefficient of Determination)**: Proportion of compatibility score variance explained by model features.

---

## 9. Recommended ML Model Candidates for Future Phases

### Classification Models:
1. **Logistic Regression** (Linear baseline)
2. **Random Forest Classifier** (Non-linear decision tree ensemble)
3. **Gradient Boosting / LightGBM Classifier** (High-performance boosted trees)

### Regression Models:
1. **Ridge Regression / Lasso** (Regularized linear baseline)
2. **Random Forest Regressor** (Non-linear regression ensemble)
3. **Gradient Boosting / LightGBM Regressor** (Boosted decision tree regressor)

---

## 10. Explicit Limitations & Capstone Disclaimer

1. **Synthetic Nature**: All student profiles, project specifications, and student-project pair records in this dataset are synthetic.
2. **Simulated Scope**: The supervised learning task evaluates whether models can recover simulated compatibility relationships within a synthetic dataset. Performance does not establish real-world team-selection accuracy.
3. **Future Extension**: Real-world deployment would require validating models on empirical human team formation logs and feedback metrics.
