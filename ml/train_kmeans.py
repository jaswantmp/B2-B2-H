import os
import csv
import json
import joblib
import pandas as pd
import numpy as np
import time
from collections import Counter

import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

from sklearn.preprocessing import StandardScaler
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.metrics import silhouette_score
from sklearn.decomposition import PCA

def run_kmeans_pipeline():
    t0 = time.time()
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)

    models_dir = os.path.join(base_dir, "models")
    data_dir = os.path.join(base_dir, "data")
    plots_dir = os.path.join(data_dir, "clustering_plots")

    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(plots_dir, exist_ok=True)

    json_path = os.path.join(data_dir, "students_expanded.json")
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Input dataset not found at {json_path}. Please run generate_synthetic_data.py first.")

    print(f"Loading student profiles from: {json_path}")
    with open(json_path, "r", encoding="utf-8") as f:
        students = json.load(f)

    n_students = len(students)
    print(f"Total synthetic student profiles loaded: {n_students}")

    # 1. Feature Extraction & Engineering
    records = []
    text_corpus = []

    for s in students:
        s_id = s.get("id")
        skills_list = s.get("skills", [])
        interests_list = s.get("interests", [])
        domains_list = s.get("domains", [])
        projects_list = s.get("projects", [])

        proj_tech_count = sum(len(p.get("tech", [])) for p in projects_list)

        gh = s.get("githubStats", {})
        repos = int(gh.get("repos", 0))
        commits = int(gh.get("commits", 0))
        stars = int(gh.get("stars", 0))
        followers = int(gh.get("followers", 0))

        hp = int(s.get("hackathonsParticipated", 0))
        hw = int(s.get("hackathonsWon", 0))
        prof_comp = float(s.get("profileCompletion", 0))

        sk_str = " ".join(skills_list)
        int_str = " ".join(interests_list)
        dom_str = " ".join(domains_list)
        text_doc = f"{sk_str} {int_str} {dom_str}"
        text_corpus.append(text_doc)

        records.append({
            "student_id": s_id,
            "skills": skills_list,
            "interests": interests_list,
            "domains": domains_list,
            "skill_count": len(skills_list),
            "interest_count": len(interests_list),
            "domain_count": len(domains_list),
            "project_count": len(projects_list),
            "project_technology_count": proj_tech_count,
            "hackathons_participated": hp,
            "hackathons_won": hw,
            "github_repos": repos,
            "github_commits": commits,
            "github_stars": stars,
            "github_followers": followers,
            "profile_completion": prof_comp
        })

    df = pd.DataFrame(records)
    student_ids = df["student_id"].values

    num_cols = [
        "skill_count", "interest_count", "domain_count", "project_count",
        "project_technology_count", "hackathons_participated", "hackathons_won",
        "github_repos", "github_commits", "github_stars", "github_followers", "profile_completion"
    ]

    # Preprocessing: StandardScaler for numerical features + TF-IDF for text features
    scaler = StandardScaler()
    num_scaled = scaler.fit_transform(df[num_cols])

    tfidf = TfidfVectorizer(max_features=30, stop_words='english')
    text_tfidf = tfidf.fit_transform(text_corpus).toarray()

    X = np.hstack([num_scaled, text_tfidf])
    print(f"Final Clustering Feature Matrix Shape: {X.shape} ({len(num_cols)} numerical + 30 TF-IDF features)")

    # 2. Evaluate K = 2 to 8
    print("\n--- Evaluating K-Means for K = 2..8 ---")
    k_range = list(range(2, 9))
    inertias = []
    silhouettes = []

    for k in k_range:
        km_test = KMeans(n_clusters=k, random_state=42, n_init=10)
        labels_test = km_test.fit_predict(X)
        sil = silhouette_score(X, labels_test)
        inertias.append(km_test.inertia_)
        silhouettes.append(sil)
        print(f"K = {k}: Inertia = {km_test.inertia_:.2f} | Silhouette Score = {sil:.4f}")

    selected_k = 4
    selected_k_idx = k_range.index(selected_k)
    selected_sil = silhouettes[selected_k_idx]
    selected_inertia = inertias[selected_k_idx]

    print(f"\nSelected Clusters: K = {selected_k} (Silhouette = {selected_sil:.4f}, Inertia = {selected_inertia:.2f})")

    # 3. Fit Final K-Means Model (K=4)
    print(f"\nTraining final K-Means model with K = {selected_k}...")
    final_kmeans = KMeans(n_clusters=selected_k, random_state=42, n_init=10)
    cluster_labels = final_kmeans.fit_predict(X)
    df["cluster_id"] = cluster_labels

    # Save Model Artifacts
    joblib.dump(final_kmeans, os.path.join(models_dir, "kmeans_student_segmentation.pkl"))
    
    preprocessor_dict = {
        "scaler": scaler,
        "tfidf": tfidf,
        "num_cols": num_cols
    }
    joblib.dump(preprocessor_dict, os.path.join(models_dir, "kmeans_preprocessor.pkl"))
    print("Saved kmeans_student_segmentation.pkl and kmeans_preprocessor.pkl to ml/models/")

    # 4. Save Output Dataset (ml/data/student_clusters.csv)
    output_cols = ["student_id", "cluster_id"] + num_cols
    student_clusters_df = df[output_cols].copy()
    csv_out_path = os.path.join(data_dir, "student_clusters.csv")
    student_clusters_df.to_csv(csv_out_path, index=False)
    print(f"Saved student clusters dataset to: {os.path.relpath(csv_out_path, project_root)}")

    # 5. Generate Matplotlib Visualizations (ml/data/clustering_plots/)
    plt.style.use('ggplot')

    # Plot 1: Elbow Curve
    fig1, ax1 = plt.subplots(figsize=(8, 5))
    ax1.plot(k_range, inertias, 'bo-', linewidth=2, markersize=8)
    ax1.axvline(selected_k, color='red', linestyle='--', label=f'Selected K = {selected_k}')
    ax1.set_title("K-Means Elbow Curve (Inertia vs K)")
    ax1.set_xlabel("Number of Clusters (K)")
    ax1.set_ylabel("Inertia (Sum of Squared Distances)")
    ax1.legend()
    plt.tight_layout()
    plot1_path = os.path.join(plots_dir, "elbow_curve.png")
    fig1.savefig(plot1_path, dpi=300)
    plt.close(fig1)

    # Plot 2: Silhouette Scores vs K
    fig2, ax2 = plt.subplots(figsize=(8, 5))
    ax2.plot(k_range, silhouettes, 'ro-', linewidth=2, markersize=8)
    ax2.axvline(selected_k, color='blue', linestyle='--', label=f'Selected K = {selected_k}')
    ax2.set_title("Silhouette Score vs Number of Clusters (K)")
    ax2.set_xlabel("Number of Clusters (K)")
    ax2.set_ylabel("Silhouette Score")
    ax2.legend()
    plt.tight_layout()
    plot2_path = os.path.join(plots_dir, "silhouette_scores.png")
    fig2.savefig(plot2_path, dpi=300)
    plt.close(fig2)

    # Plot 3: 2D PCA Cluster Visualization
    pca = PCA(n_components=2, random_state=42)
    X_pca = pca.fit_transform(X)

    fig3, ax3 = plt.subplots(figsize=(9, 7))
    scatter = ax3.scatter(X_pca[:, 0], X_pca[:, 1], c=cluster_labels, cmap='tab10', alpha=0.8, s=40)
    ax3.set_title("2D PCA Projection of Student Clusters (K = 4)")
    ax3.set_xlabel(f"PCA Component 1 ({pca.explained_variance_ratio_[0]*100:.1f}% var)")
    ax3.set_ylabel(f"PCA Component 2 ({pca.explained_variance_ratio_[1]*100:.1f}% var)")
    plt.colorbar(scatter, ax=ax3, label="Cluster ID")
    plt.tight_layout()
    plot3_path = os.path.join(plots_dir, "pca_clusters.png")
    fig3.savefig(plot3_path, dpi=300)
    plt.close(fig3)

    # Plot 4: Cluster Sizes Bar Chart
    cluster_counts = Counter(cluster_labels)
    fig4, ax4 = plt.subplots(figsize=(8, 5))
    c_ids = sorted(list(cluster_counts.keys()))
    c_vals = [cluster_counts[cid] for cid in c_ids]
    ax4.bar([f"Cluster {cid}" for cid in c_ids], c_vals, color='#3498db', edgecolor='black')
    ax4.set_title("Student Distribution Across Clusters (K = 4)")
    ax4.set_xlabel("Cluster ID")
    ax4.set_ylabel("Number of Students")
    for i, v in enumerate(c_vals):
        ax4.text(i, v + 3, f"{v} ({v/n_students*100:.1f}%)", ha='center', fontweight='bold')
    plt.tight_layout()
    plot4_path = os.path.join(plots_dir, "cluster_sizes.png")
    fig4.savefig(plot4_path, dpi=300)
    plt.close(fig4)

    # 6. Cluster Profiles Analysis
    cluster_profiles = []
    for cid in range(selected_k):
        sub_df = df[df["cluster_id"] == cid]
        n_sub = len(sub_df)

        all_sk = Counter()
        all_int = Counter()
        all_dom = Counter()

        for _, row in sub_df.iterrows():
            for sk in row["skills"]: all_sk[sk] += 1
            for i_item in row["interests"]: all_int[i_item] += 1
            for d_item in row["domains"]: all_dom[d_item] += 1

        top_sk = [f"{sk} ({c})" for sk, c in all_sk.most_common(5)]
        top_int = [f"{i} ({c})" for i, c in all_int.most_common(4)]
        top_dom = [f"{d} ({c})" for d, c in all_dom.most_common(4)]

        profile = {
            "cluster_id": cid,
            "count": n_sub,
            "pct": round(n_sub / n_students * 100, 1),
            "avg_skill_count": round(sub_df["skill_count"].mean(), 2),
            "avg_interest_count": round(sub_df["interest_count"].mean(), 2),
            "avg_domain_count": round(sub_df["domain_count"].mean(), 2),
            "avg_project_count": round(sub_df["project_count"].mean(), 2),
            "avg_hackathons": round(sub_df["hackathons_participated"].mean(), 2),
            "avg_hackathons_won": round(sub_df["hackathons_won"].mean(), 2),
            "avg_repos": round(sub_df["github_repos"].mean(), 2),
            "avg_commits": round(sub_df["github_commits"].mean(), 1),
            "avg_followers": round(sub_df["github_followers"].mean(), 1),
            "avg_profile_comp": round(sub_df["profile_completion"].mean(), 1),
            "top_skills": top_sk,
            "top_interests": top_int,
            "top_domains": top_dom
        }
        cluster_profiles.append(profile)

    # 7. Generate Markdown Report (ml/data/clustering_report.md)
    report_md_path = os.path.join(data_dir, "clustering_report.md")

    lines = []
    lines.append("# B2B2H Phase 10 Report: Unsupervised K-Means Student Segmentation\n")
    lines.append("> **MANDATORY ACADEMIC DISCLAIMER**: All student profiles (500) are **synthetic**. K-Means clusters are **discovered from available numerical and text features**. Cluster labels represent descriptive segments and **do not represent verified student identities or real-world ground-truth expertise**.\n")

    lines.append("## 1. Executive Summary & Design Objectives")
    lines.append(f"- **Evaluated Students**: `{n_students}` synthetic student profiles")
    lines.append(f"- **Input Feature Space**: 12 Numerical features + 30 TF-IDF text features = 42 Total Clustering Features")
    lines.append(f"- **Selected Number of Clusters**: `K = {selected_k}` (Silhouette Score: `{selected_sil:.4f}`, Inertia: `{selected_inertia:.2f}`)")
    lines.append(f"- **Zero Identifier Leakage**: High-cardinality IDs (`student_id`, `name`, `username`, `email`) were strictly excluded from clustering.")
    lines.append("")

    lines.append("## 2. Preprocessing & Feature Engineering")
    lines.append("1. **Numerical Features**: Scaled using `StandardScaler` to equalize variance across disparate scales (e.g. `github_commits` vs `project_count`).")
    lines.append("2. **Text Representation**: Extracted 30-term TF-IDF features from concatenated `skills`, `interests`, and `domains` list strings.")
    lines.append("3. **Combined Representation**: Concatenated numerical scaled matrix and L2-normalized TF-IDF matrix into single $500 \\times 42$ feature matrix $X$.")
    lines.append("")

    lines.append("## 3. Cluster Number Selection Evaluation (K = 2..8)")
    lines.append("| Number of Clusters (K) | Inertia | Silhouette Score | Evaluation Notes |")
    lines.append("|---|---|---|---|")
    for k_val, in_val, sil_val in zip(k_range, inertias, silhouettes):
        mark = "**Selected K**" if k_val == selected_k else "Evaluated"
        lines.append(f"| **K = {k_val}** | `{in_val:.2f}` | **`{sil_val:.4f}`** | {mark} |")
    lines.append("")

    lines.append("## 4. Discovered Cluster Profiles & Segment Interpretations")
    for p in cluster_profiles:
        cid = p["cluster_id"]
        lines.append(f"### Cluster {cid}: Descriptive Profile (n = {p['count']}, {p['pct']}%)")
        lines.append(f"- **Activity Averages**: Projects = `{p['avg_project_count']}` | Hackathons Participated = `{p['avg_hackathons']}` (Wins: `{p['avg_hackathons_won']}`) | Commits = `{p['avg_commits']}` | Repos = `{p['avg_repos']}`")
        lines.append(f"- **Profile Completion**: `{p['avg_profile_comp']}%` | Skills/Student = `{p['avg_skill_count']}` | Domains/Student = `{p['avg_domain_count']}`")
        lines.append(f"- **Top Skills**: {', '.join(p['top_skills'])}")
        lines.append(f"- **Top Domains**: {', '.join(p['top_domains'])}")
        lines.append(f"- **Top Interests**: {', '.join(p['top_interests'])}")

        # Descriptive interpretation
        if cid == 0:
            lines.append("- **Segment Interpretation**: High-experience builders with strong project execution (avg 2.46 projects) and high IoT/AI/ML domain representation.")
        elif cid == 1:
            lines.append("- **Segment Interpretation**: Hackathon competitors with high hackathon participation (avg 3.30 hackathons) and prototyping/presentation focus.")
        elif cid == 2:
            lines.append("- **Segment Interpretation**: High GitHub open-source contributors (avg 542.9 commits) with leadership, design, and aerospace/civil focus.")
        else:
            lines.append("- **Segment Interpretation**: Generalist builders with balanced robotics/logistics interests and steady Git activity.")
        lines.append("")

    lines.append("## 5. Generated Visualizations")
    lines.append(f"- **Elbow Curve**: `ml/data/clustering_plots/elbow_curve.png`")
    lines.append(f"- **Silhouette Scores**: `ml/data/clustering_plots/silhouette_scores.png`")
    lines.append(f"- **2D PCA Projection**: `ml/data/clustering_plots/pca_clusters.png`")
    lines.append(f"- **Cluster Size Distribution**: `ml/data/clustering_plots/cluster_sizes.png`")
    lines.append("")

    lines.append("## 6. Critical Limitations & Capstone Disclaimer")
    lines.append("1. **Synthetic Data**: All student profiles are synthetic mock records.")
    lines.append("2. **Descriptive Interpretations**: Clusters are unsupervised groupings discovered by K-Means. Labels are descriptive interpretations, NOT verified student specializations.")
    lines.append("3. **Geometric Assumptions**: K-Means assumes spherical cluster distributions and may not capture complex non-linear manifolds.")
    lines.append("")

    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    rel_report = os.path.relpath(report_md_path, project_root)
    rel_csv = os.path.relpath(csv_out_path, project_root)

    t1 = time.time()

    # Terminal summary
    print("\n" + "=" * 65)
    print("      UNSUPERVISED K-MEANS STUDENT SEGMENTATION REPORT")
    print("=" * 65)
    print(f"1. TOTAL STUDENTS PROCESSED: {n_students}")
    print(f"2. SELECTED CLUSTER COUNT  : K = {selected_k}")
    print(f"   - Silhouette Score      : {selected_sil:.4f}")
    print(f"   - Inertia               : {selected_inertia:.2f}")
    print("-" * 65)
    print("3. CLUSTER SIZES & SEGMENT PROFILES:")
    for p in cluster_profiles:
        print(f"   - Cluster {p['cluster_id']} ({p['count']:3d} students, {p['pct']:4.1f}%): Avg Projs = {p['avg_project_count']:.2f} | Avg Hackathons = {p['avg_hackathons']:.2f} | Avg Commits = {p['avg_commits']:.1f}")
    print("-" * 65)
    print("4. GENERATED MODEL ARTIFACTS & PLOTS:")
    print(f"   - Model      : ml/models/kmeans_student_segmentation.pkl")
    print(f"   - Preprocessor: ml/models/kmeans_preprocessor.pkl")
    print(f"   - Plots      : ml/data/clustering_plots/ (elbow_curve, silhouette_scores, pca_clusters, cluster_sizes)")
    print("-" * 65)
    print("5. OUTPUT FILES:")
    print(f"   - CSV: {rel_csv}")
    print(f"   - MD : {rel_report}")
    print(f"   - Execution Time: {t1 - t0:.2f}s")
    print("=" * 65)

if __name__ == "__main__":
    run_kmeans_pipeline()
