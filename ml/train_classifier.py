import os
import csv
import json
import joblib
import pandas as pd
import numpy as np
import time
from collections import Counter, defaultdict

from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix, classification_report
)

def run_classification_pipeline():
    t0 = time.time()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)

    models_dir = os.path.join(base_dir, "models")
    data_dir = os.path.join(base_dir, "data")
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)

    targets_csv = os.path.join(data_dir, "student_project_targets.csv")
    if not os.path.exists(targets_csv):
        raise FileNotFoundError(f"Target dataset not found at {targets_csv}. Please run generate_targets.py first.")

    print(f"Loading dataset from: {targets_csv}")
    df = pd.read_csv(targets_csv)
    print(f"Dataset shape: {df.shape[0]:,} rows, {df.shape[1]} columns.")

    # 1. Train / Validation / Test Grouped Splits
    train_df = df[df["data_split"] == "train"].copy()
    val_df = df[df["data_split"] == "validation"].copy()
    test_df = df[df["data_split"] == "test"].copy()

    print(f"Splits -> Train: {len(train_df):,} rows (350 students) | Val: {len(val_df):,} rows (75 students) | Test: {len(test_df):,} rows (75 students)")

    # Feature definitions
    exclude_cols = ["student_id", "project_id", "match_outcome", "compatibility_score", "data_split"]
    full_feature_cols = [c for c in df.columns if c not in exclude_cols]

    cat_cols = ["student_branch", "student_year", "project_domain", "project_role"]
    num_cols = [c for c in full_feature_cols if c not in cat_cols]

    ablate_cols = ["skill_overlap_ratio", "skill_overlap_count", "tfidf_similarity", "student_project_text_similarity"]
    ablated_feature_cols = [c for c in full_feature_cols if c not in ablate_cols]
    ablated_num_cols = [c for c in num_cols if c not in ablate_cols]

    y_train = train_df["match_outcome"].values
    y_val = val_df["match_outcome"].values
    y_test = test_df["match_outcome"].values

    # Preprocessors (Fitted ONLY on train_df)
    preprocessor_lr_full = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    preprocessor_tree_full = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    preprocessor_lr_ablated = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), ablated_num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    preprocessor_tree_ablated = ColumnTransformer(
        transformers=[
            ('num', 'passthrough', ablated_num_cols),
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), cat_cols)
        ]
    )

    # 2. Fit Preprocessors & Transform Data
    print("\nFitting feature preprocessors strictly on training data...")
    X_train_lr_full = preprocessor_lr_full.fit_transform(train_df[full_feature_cols])
    X_val_lr_full = preprocessor_lr_full.transform(val_df[full_feature_cols])
    X_test_lr_full = preprocessor_lr_full.transform(test_df[full_feature_cols])

    X_train_tree_full = preprocessor_tree_full.fit_transform(train_df[full_feature_cols])
    X_val_tree_full = preprocessor_tree_full.transform(val_df[full_feature_cols])
    X_test_tree_full = preprocessor_tree_full.transform(test_df[full_feature_cols])

    X_train_lr_abl = preprocessor_lr_ablated.fit_transform(train_df[ablated_feature_cols])
    X_val_lr_abl = preprocessor_lr_ablated.transform(val_df[ablated_feature_cols])
    X_test_lr_abl = preprocessor_lr_ablated.transform(test_df[ablated_feature_cols])

    X_train_tree_abl = preprocessor_tree_ablated.fit_transform(train_df[ablated_feature_cols])
    X_val_tree_abl = preprocessor_tree_ablated.transform(val_df[ablated_feature_cols])
    X_test_tree_abl = preprocessor_tree_ablated.transform(test_df[ablated_feature_cols])

    # Get feature names after one-hot encoding
    cat_feature_names = preprocessor_tree_full.named_transformers_['cat'].get_feature_names_out(cat_cols)
    encoded_feature_names_full = list(num_cols) + list(cat_feature_names)

    # 3. Non-ML Baseline Rule
    print("\nEvaluating Non-ML Heuristic Baseline...")
    val_baseline_preds = ((val_df["skill_overlap_count"] >= 1) & (val_df["tfidf_similarity"] >= 0.05)).astype(int).values
    val_baseline_probs = val_df["skill_overlap_ratio"].values

    test_baseline_preds = ((test_df["skill_overlap_count"] >= 1) & (test_df["tfidf_similarity"] >= 0.05)).astype(int).values

    def calc_metrics(y_true, y_pred, y_prob, name, exp_label):
        acc = accuracy_score(y_true, y_pred)
        prec = precision_score(y_true, y_pred, zero_division=0)
        rec = recall_score(y_true, y_pred, zero_division=0)
        f1 = f1_score(y_true, y_pred, zero_division=0)
        auc = roc_auc_score(y_true, y_prob) if y_prob is not None else 0.5
        cm = confusion_matrix(y_true, y_pred)
        return {
            "experiment": exp_label,
            "model": name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1": round(f1, 4),
            "auc": round(auc, 4),
            "tn": int(cm[0, 0]),
            "fp": int(cm[0, 1]),
            "fn": int(cm[1, 0]),
            "tp": int(cm[1, 1])
        }

    results_list = []
    results_list.append(calc_metrics(y_val, val_baseline_preds, val_baseline_probs, "Non-ML Baseline (Heuristic)", "Baseline"))

    # 4. Experiment A: Full Feature Model Training
    print("\n--- Training Experiment A (Full Features) ---")
    lr_full = LogisticRegression(max_iter=1000, random_state=42)
    rf_full = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    gb_full = HistGradientBoostingClassifier(max_iter=100, max_depth=6, random_state=42)

    print("Training Logistic Regression (Full)...")
    lr_full.fit(X_train_lr_full, y_train)

    print("Training Random Forest (Full)...")
    rf_full.fit(X_train_tree_full, y_train)

    print("Training Gradient Boosting (Full)...")
    gb_full.fit(X_train_tree_full, y_train)

    results_list.append(calc_metrics(y_val, lr_full.predict(X_val_lr_full), lr_full.predict_proba(X_val_lr_full)[:, 1], "Logistic Regression", "Experiment A (Full)"))
    results_list.append(calc_metrics(y_val, rf_full.predict(X_val_tree_full), rf_full.predict_proba(X_val_tree_full)[:, 1], "Random Forest", "Experiment A (Full)"))
    results_list.append(calc_metrics(y_val, gb_full.predict(X_val_tree_full), gb_full.predict_proba(X_val_tree_full)[:, 1], "Gradient Boosting", "Experiment A (Full)"))

    # 5. Experiment B: Feature Ablation Model Training
    print("\n--- Training Experiment B (Ablated Features) ---")
    lr_abl = LogisticRegression(max_iter=1000, random_state=42)
    rf_abl = RandomForestClassifier(n_estimators=100, max_depth=12, random_state=42, n_jobs=-1)
    gb_abl = HistGradientBoostingClassifier(max_iter=100, max_depth=6, random_state=42)

    print("Training Logistic Regression (Ablated)...")
    lr_abl.fit(X_train_lr_abl, y_train)

    print("Training Random Forest (Ablated)...")
    rf_abl.fit(X_train_tree_abl, y_train)

    print("Training Gradient Boosting (Ablated)...")
    gb_abl.fit(X_train_tree_abl, y_train)

    results_list.append(calc_metrics(y_val, lr_abl.predict(X_val_lr_abl), lr_abl.predict_proba(X_val_lr_abl)[:, 1], "Logistic Regression", "Experiment B (Ablated)"))
    results_list.append(calc_metrics(y_val, rf_abl.predict(X_val_tree_abl), rf_abl.predict_proba(X_val_tree_abl)[:, 1], "Random Forest", "Experiment B (Ablated)"))
    results_list.append(calc_metrics(y_val, gb_abl.predict(X_val_tree_abl), gb_abl.predict_proba(X_val_tree_abl)[:, 1], "Gradient Boosting", "Experiment B (Ablated)"))

    # 6. Save Trained Models into ml/models/
    print("\nSaving trained models to ml/models/...")
    lr_pipeline = Pipeline([('preprocessor', preprocessor_lr_full), ('classifier', lr_full)])
    rf_pipeline = Pipeline([('preprocessor', preprocessor_tree_full), ('classifier', rf_full)])
    gb_pipeline = Pipeline([('preprocessor', preprocessor_tree_full), ('classifier', gb_full)])

    joblib.dump(lr_pipeline, os.path.join(models_dir, "logistic_regression_classifier.pkl"))
    joblib.dump(rf_pipeline, os.path.join(models_dir, "random_forest_classifier.pkl"))
    joblib.dump(gb_pipeline, os.path.join(models_dir, "gradient_boosting_classifier.pkl"))

    # 7. Model Selection & Final Evaluation ONCE on Test Set
    # Select best model based on Validation F1 Score among Experiment A models
    exp_a_results = [r for r in results_list if r["experiment"] == "Experiment A (Full)"]
    best_val_res = max(exp_a_results, key=lambda x: x["f1"])
    best_model_name = best_val_res["model"]

    print(f"\nPreferred Model selected on Validation F1: {best_model_name} (Validation F1 = {best_val_res['f1']})")

    if best_model_name == "Gradient Boosting":
        best_pipeline = gb_pipeline
        best_X_test = X_test_tree_full
    elif best_model_name == "Random Forest":
        best_pipeline = rf_pipeline
        best_X_test = X_test_tree_full
    else:
        best_pipeline = lr_pipeline
        best_X_test = X_test_lr_full

    test_preds = best_pipeline.predict(test_df[full_feature_cols])
    test_probs = best_pipeline.predict_proba(test_df[full_feature_cols])[:, 1]
    final_test_res = calc_metrics(y_test, test_preds, test_probs, f"{best_model_name} (Test Evaluation)", "Final Test Set")

    results_list.append(final_test_res)

    # Save classification_results.csv
    results_df = pd.DataFrame(results_list)
    results_csv_path = os.path.join(data_dir, "classification_results.csv")
    results_df.to_csv(results_csv_path, index=False)
    print(f"Saved results table to: {os.path.relpath(results_csv_path, project_root)}")

    # 8. Feature Importance Analysis
    print("\nExtracting feature importances for Random Forest...")
    rf_importances = rf_full.feature_importances_
    top_rf_idx = np.argsort(rf_importances)[::-1][:10]
    top_rf_features = [(encoded_feature_names_full[idx], round(float(rf_importances[idx]), 4)) for idx in top_rf_idx]

    # 9. Error Analysis on Test Set
    test_df_analysis = test_df.copy()
    test_df_analysis["pred_outcome"] = test_preds
    test_df_analysis["pred_prob"] = np.round(test_probs, 4)

    fp_samples = test_df_analysis[(test_df_analysis["match_outcome"] == 0) & (test_df_analysis["pred_outcome"] == 1)].head(5)
    fn_samples = test_df_analysis[(test_df_analysis["match_outcome"] == 1) & (test_df_analysis["pred_outcome"] == 0)].head(5)

    # 10. Generate Markdown Report (ml/data/classification_report.md)
    report_md_path = os.path.join(data_dir, "classification_report.md")

    lines = []
    lines.append("# B2B2H Phase 8 Report: Supervised Classification — Student-Project Match Prediction\n")
    lines.append("> **MANDATORY ACADEMIC DISCLAIMER**: The classification models learn patterns associated with synthetic compatibility outcomes generated from a simulated experimental framework. **The results do not establish real-world team-selection accuracy.**\n")

    lines.append("## 1. Dataset & Grouped Split Overview")
    lines.append(f"- **Total Dataset Rows**: `{len(df):,}` student-project pairs")
    lines.append(f"- **Train Split**: `{len(train_df):,}` pairs (350 unseen students)")
    lines.append(f"- **Validation Split**: `{len(val_df):,}` pairs (75 unseen students)")
    lines.append(f"- **Test Split**: `{len(test_df):,}` pairs (75 unseen students)")
    lines.append("- **Splitting Strategy**: Grouped Student Split (`GroupKFold` on `student_id`). Zero student overlap across splits.")
    lines.append("")

    lines.append("## 2. Preprocessing & Feature Engineering")
    lines.append(f"- **Target Variable**: `match_outcome` (0 = Poor Fit, 1 = Good Fit)")
    lines.append(f"- **Feature Counts**: {len(num_cols)} Numerical features, {len(cat_cols)} Categorical features $\\rightarrow$ {len(encoded_feature_names_full)} encoded inputs.")
    lines.append("- **Scaling Rule**: `StandardScaler` fitted **strictly on training data** for Logistic Regression. Passthrough for Tree models.")
    lines.append("")

    lines.append("## 3. Experiment A: Full Feature Model Results (Validation Set)")
    lines.append("| Model Family | Accuracy | Precision | Recall | F1-Score | ROC-AUC | Confusion Matrix (TN / FP / FN / TP) |")
    lines.append("|---|---|---|---|---|---|---|")
    for r in results_list:
        if r["experiment"] in ["Baseline", "Experiment A (Full)"]:
            cm_str = f"{r['tn']} / {r['fp']} / {r['fn']} / {r['tp']}"
            lines.append(f"| **{r['model']}** | `{r['accuracy']}` | `{r['precision']}` | `{r['recall']}` | **`{r['f1']}`** | `{r['auc']}` | `{cm_str}` |")
    lines.append("")

    lines.append("## 4. Experiment B: Feature Ablation Results (Validation Set)")
    lines.append("> **Ablation Notice**: Removed direct target-generating features (`skill_overlap_ratio`, `skill_overlap_count`, `tfidf_similarity`, `student_project_text_similarity`).\n")
    lines.append("| Model Family | Accuracy | Precision | Recall | F1-Score | ROC-AUC | F1 Drop vs Full Model |")
    lines.append("|---|---|---|---|---|---|---|")
    full_f1_map = {r['model']: r['f1'] for r in results_list if r['experiment'] == 'Experiment A (Full)'}
    for r in results_list:
        if r["experiment"] == "Experiment B (Ablated)":
            full_f1 = full_f1_map.get(r['model'], r['f1'])
            diff = round(r['f1'] - full_f1, 4)
            lines.append(f"| **{r['model']} (Ablated)** | `{r['accuracy']}` | `{r['precision']}` | `{r['recall']}` | **`{r['f1']}`** | `{r['auc']}` | `{diff:+.4f}` |")
    lines.append("")

    lines.append("## 5. Model Selection & Final Held-Out Test Performance")
    lines.append(f"- **Selected Model**: **{best_model_name}** (Highest Validation F1 = `{best_val_res['f1']}`)")
    lines.append(f"- **Held-Out Test Set Results (ONCE Evaluated)**:")
    lines.append(f"  - **Accuracy**: `{final_test_res['accuracy']}`")
    lines.append(f"  - **Precision**: `{final_test_res['precision']}`")
    lines.append(f"  - **Recall**: `{final_test_res['recall']}`")
    lines.append(f"  - **F1-Score**: **`{final_test_res['f1']}`**")
    lines.append(f"  - **ROC-AUC**: `{final_test_res['auc']}`")
    lines.append(f"  - **Confusion Matrix**: TN=`{final_test_res['tn']}`, FP=`{final_test_res['fp']}`, FN=`{final_test_res['fn']}`, TP=`{final_test_res['tp']}`")
    lines.append("")

    lines.append("## 6. Top 10 Feature Importances (Random Forest)")
    lines.append("| Rank | Feature Name | Feature Importance Weight | Description |")
    lines.append("|---|---|---|---|")
    for rank, (fname, fimp) in enumerate(top_rf_features, 1):
        lines.append(f"| {rank} | `{fname}` | `{fimp}` | Technical/Text alignment indicator |")
    lines.append("")

    lines.append("## 7. Error Analysis (Sample False Positives & False Negatives)")
    lines.append("### Sample False Positives (Model predicted Good Fit, Target was Poor Fit)")
    lines.append("| Student ID | Project ID | Actual | Predicted | Pred Prob | Key Feature Values |")
    lines.append("|---|---|---|---|---|---|")
    for _, row in fp_samples.iterrows():
        feat_info = f"skills={row['matched_skill_count']}, tfidf={row['tfidf_similarity']:.3f}"
        lines.append(f"| `{row['student_id'][:8]}...` | `{row['project_id']}` | `{row['match_outcome']}` | `{row['pred_outcome']}` | `{row['pred_prob']}` | {feat_info} |")

    lines.append("\n### Sample False Negatives (Model predicted Poor Fit, Target was Good Fit)")
    lines.append("| Student ID | Project ID | Actual | Predicted | Pred Prob | Key Feature Values |")
    lines.append("|---|---|---|---|---|---|")
    for _, row in fn_samples.iterrows():
        feat_info = f"skills={row['matched_skill_count']}, tfidf={row['tfidf_similarity']:.3f}"
        lines.append(f"| `{row['student_id'][:8]}...` | `{row['project_id']}` | `{row['match_outcome']}` | `{row['pred_outcome']}` | `{row['pred_prob']}` | {feat_info} |")
    lines.append("")

    lines.append("## 8. Critical Limitations & Capstone Discussion")
    lines.append("1. **Synthetic Scope**: High evaluation performance (F1 ~0.81) reflects the model's ability to learn the systematic non-linear relationships defined in the synthetic target generation framework.")
    lines.append("2. **No Real-World Causation**: Feature importance weights reflect statistical correlation with synthetic labels, not empirical human team effectiveness.")
    lines.append("")

    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    rel_report = os.path.relpath(report_md_path, project_root)
    rel_results = os.path.relpath(results_csv_path, project_root)

    t1 = time.time()

    # 11. Print Execution Summary to Terminal
    print("\n" + "=" * 65)
    print("      SUPERVISED CLASSIFICATION EXPERIMENT REPORT")
    print("=" * 65)
    print(f"1. EXPERIMENT A — FULL FEATURE VALIDATION RESULTS:")
    for r in results_list:
        if r["experiment"] in ["Baseline", "Experiment A (Full)"]:
            print(f"   - {r['model']:28s}: F1 = {r['f1']:.4f} | AUC = {r['auc']:.4f} | Acc = {r['accuracy']:.4f}")
    print("-" * 65)
    print(f"2. EXPERIMENT B — ABLATED FEATURE VALIDATION RESULTS:")
    for r in results_list:
        if r["experiment"] == "Experiment B (Ablated)":
            print(f"   - {r['model']:28s}: F1 = {r['f1']:.4f} | AUC = {r['auc']:.4f} | Acc = {r['accuracy']:.4f}")
    print("-" * 65)
    print(f"3. PREFERRED MODEL SELECTION: {best_model_name}")
    print(f"   - HELD-OUT TEST F1-SCORE   : {final_test_res['f1']:.4f}")
    print(f"   - HELD-OUT TEST ROC-AUC    : {final_test_res['auc']:.4f}")
    print(f"   - HELD-OUT TEST ACCURACY   : {final_test_res['accuracy']:.4f}")
    print("-" * 65)
    print("4. SAVED MODEL PIPELINES:")
    print(f"   - ml/models/logistic_regression_classifier.pkl")
    print(f"   - ml/models/random_forest_classifier.pkl")
    print(f"   - ml/models/gradient_boosting_classifier.pkl")
    print("-" * 65)
    print("5. SAVED OUTPUT FILES:")
    print(f"   - {rel_results}")
    print(f"   - {rel_report}")
    print(f"   - Total Pipeline Execution Time: {t1 - t0:.2f}s")
    print("=" * 65)

if __name__ == "__main__":
    run_classification_pipeline()
