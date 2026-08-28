import os
import json
import csv
import re
import math
from collections import Counter, defaultdict
import statistics

STOP_WORDS = {
    "a", "an", "the", "and", "or", "in", "on", "at", "for", "with", "about", "against",
    "between", "into", "through", "during", "before", "after", "above", "below", "to",
    "from", "up", "down", "in", "out", "off", "over", "under", "again", "further", "then",
    "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each",
    "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own",
    "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"
}

def tokenize(text):
    words = re.findall(r'\b[a-zA-Z0-9_\+#\.-]+\b', text.lower())
    return [w for w in words if w not in STOP_WORDS and len(w) > 1]

def normalize_set(items):
    if not items:
        return set()
    if isinstance(items, str):
        items = [items]
    res = set()
    for item in items:
        if isinstance(item, str):
            clean = item.strip().lower()
            if clean:
                res.add(clean)
    return res

def create_pair_features():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(base_dir)
    json_path = os.path.join(base_dir, "data", "students_expanded.json")
    output_csv = os.path.join(base_dir, "data", "student_project_pairs.csv")
    report_md = os.path.join(base_dir, "data", "pair_features_report.md")

    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Input file not found at: {json_path}. Please run generate_synthetic_data.py first.")

    with open(json_path, "r", encoding="utf-8") as f:
        students = json.load(f)

    # 1. Extract 350 projects
    projects = []
    for s in students:
        s_id = s.get("id")
        projs = s.get("projects", [])
        for p in projs:
            p_id = f"proj_{len(projects) + 1:04d}"
            p_name = p.get("name", "").strip()
            p_desc = p.get("desc", "").strip()
            p_tech = p.get("tech", [])
            p_role = p.get("role", "").strip()

            p_tech_set = normalize_set(p_tech)
            p_text = f"{p_name} {p_desc} {' '.join(p_tech)} {p_role}"

            projects.append({
                "project_id": p_id,
                "project_name": p_name,
                "project_desc": p_desc,
                "project_tech": p_tech,
                "project_tech_set": p_tech_set,
                "project_role": p_role,
                "project_text": p_text,
                "owner_student_id": s_id
            })

    n_students = len(students)
    n_projects = len(projects)
    expected_pairs = n_students * n_projects

    print(f"Loaded {n_students} students and {n_projects} projects.")
    print(f"Generating {expected_pairs:,} student-project pair feature records...")

    # 2. Build TF-IDF representations
    student_texts = []
    for s in students:
        bio = s.get("bio", "")
        branch = s.get("branch", "")
        year = s.get("year", "")
        sk = " ".join(s.get("skills", []))
        inte = " ".join(s.get("interests", []))
        dom = " ".join(s.get("domains", []))
        text = f"{bio} {branch} {year} {sk} {inte} {dom}"
        student_texts.append(text)

    project_texts = [p["project_text"] for p in projects]

    all_docs = [tokenize(t) for t in student_texts + project_texts]
    N = len(all_docs)

    df_map = {}
    for doc in all_docs:
        for w in set(doc):
            df_map[w] = df_map.get(w, 0) + 1

    idf_map = {w: math.log((1 + N) / (1 + cnt)) + 1 for w, cnt in df_map.items()}

    doc_vectors = []
    for doc in all_docs:
        tf = {}
        for w in doc:
            tf[w] = tf.get(w, 0) + 1

        vec = {}
        sq_sum = 0.0
        for w, cnt in tf.items():
            val = (cnt / max(1, len(doc))) * idf_map[w]
            vec[w] = val
            sq_sum += val * val

        norm = math.sqrt(sq_sum) if sq_sum > 0 else 1.0
        doc_vectors.append({w: val / norm for w, val in vec.items()})

    student_vecs = doc_vectors[:n_students]
    project_vecs = doc_vectors[n_students:]

    # 3. Generate 175,000 pair feature records
    fieldnames = [
        "student_id",
        "project_id",
        "tfidf_similarity",
        "student_project_text_similarity",
        "skill_overlap_count",
        "skill_overlap_ratio",
        "required_skill_count",
        "matched_skill_count",
        "interest_overlap_count",
        "interest_overlap_ratio",
        "domain_match",
        "domain_overlap_count",
        "student_project_count",
        "hackathons_participated",
        "hackathons_won",
        "github_repos",
        "github_commits",
        "github_stars",
        "profile_completion",
        "student_branch",
        "student_year",
        "project_technology_count",
        "project_domain",
        "project_role",
        "project_description_length"
    ]

    pairs = []
    zero_skill_overlap_count = 0
    zero_tfidf_sim_count = 0

    seen_pair_keys = set()
    duplicate_pair_count = 0

    for s_idx, s in enumerate(students):
        s_id = s.get("id")
        s_skills = normalize_set(s.get("skills", []))
        s_interests = normalize_set(s.get("interests", []))
        s_domains = normalize_set(s.get("domains", []))
        s_projects = s.get("projects", [])
        s_branch = s.get("branch", "")
        s_year = s.get("year", "")
        gh = s.get("githubStats", {})

        s_vec = student_vecs[s_idx]
        s_tokens = set(all_docs[s_idx])

        for p_idx, p in enumerate(projects):
            p_id = p["project_id"]

            pair_key = (s_id, p_id)
            if pair_key in seen_pair_keys:
                duplicate_pair_count += 1
            seen_pair_keys.add(pair_key)

            p_tech = p["project_tech_set"]
            p_vec = project_vecs[p_idx]
            p_tokens = set(all_docs[n_students + p_idx])

            # TF-IDF similarity
            tfidf_sim = sum(s_vec[w] * p_vec[w] for w in s_vec if w in p_vec)
            tfidf_sim = round(tfidf_sim, 4)
            if tfidf_sim == 0:
                zero_tfidf_sim_count += 1

            # Jaccard text similarity
            token_intersect = len(s_tokens.intersection(p_tokens))
            token_union = len(s_tokens.union(p_tokens))
            text_sim = round(token_intersect / max(1, token_union), 4)

            # Skill features
            skill_overlap = len(s_skills.intersection(p_tech))
            if skill_overlap == 0:
                zero_skill_overlap_count += 1

            req_skills = len(p_tech)
            skill_ratio = round(skill_overlap / max(1, req_skills), 4)

            # Interest overlap
            int_overlap = sum(1 for item in s_interests if any(item in w for w in p_tokens))
            int_ratio = round(int_overlap / max(1, len(s_interests)), 4)

            # Domain overlap
            p_dom_set = normalize_set(p["project_name"].split() + p["project_desc"].split())
            dom_overlap = len(s_domains.intersection(p_dom_set))
            dom_match = 1 if dom_overlap > 0 else 0

            p_desc = p["project_desc"]
            p_role = p["project_role"]

            record = {
                "student_id": s_id,
                "project_id": p_id,
                "tfidf_similarity": tfidf_sim,
                "student_project_text_similarity": text_sim,
                "skill_overlap_count": skill_overlap,
                "skill_overlap_ratio": skill_ratio,
                "required_skill_count": req_skills,
                "matched_skill_count": skill_overlap,
                "interest_overlap_count": int_overlap,
                "interest_overlap_ratio": int_ratio,
                "domain_match": dom_match,
                "domain_overlap_count": dom_overlap,
                "student_project_count": len(s_projects),
                "hackathons_participated": int(s.get("hackathonsParticipated", 0)),
                "hackathons_won": int(s.get("hackathonsWon", 0)),
                "github_repos": int(gh.get("repos", 0)),
                "github_commits": int(gh.get("commits", 0)),
                "github_stars": int(gh.get("stars", 0)),
                "profile_completion": int(s.get("profileCompletion", 0)),
                "student_branch": s_branch,
                "student_year": s_year,
                "project_technology_count": req_skills,
                "project_domain": p_role if p_role else "Engineering",
                "project_role": p_role,
                "project_description_length": len(p_desc)
            }
            pairs.append(record)

    # 4. Save to ml/data/student_project_pairs.csv
    with open(output_csv, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(pairs)

    rel_output_csv = os.path.relpath(output_csv, project_root)
    print(f"Successfully saved {len(pairs):,} pair records to: {rel_output_csv}")

    # 5. Missing values audit
    missing_dict = {f: 0 for f in fieldnames}
    for p in pairs:
        for f in fieldnames:
            v = p[f]
            if v is None or v == "":
                missing_dict[f] += 1
    total_missing = sum(missing_dict.values())

    # Sort pairs for top reports
    top_tfidf_pairs = sorted(pairs, key=lambda x: x["tfidf_similarity"], reverse=True)[:10]
    top_skill_pairs = sorted(pairs, key=lambda x: x["skill_overlap_count"], reverse=True)[:10]

    # 6. Generate pair_features_report.md
    report_lines = []
    report_lines.append("# B2B2H Student-Project Pair Feature Dataset Report\n")
    report_lines.append("## 1. Dataset Summary")
    report_lines.append(f"- **Total Student-Project Pairs Generated**: `{len(pairs):,}` (Target: `500 × 350 = 175,000`)")
    report_lines.append(f"- **Unique Student IDs**: `{n_students}`")
    report_lines.append(f"- **Unique Project IDs**: `{n_projects}`")
    report_lines.append(f"- **Duplicate Pairs**: `{duplicate_pair_count}`")
    report_lines.append(f"- **Total Missing Values**: `{total_missing}`")
    report_lines.append("")

    report_lines.append("## 2. Feature Overlap & Sparsity Analysis")
    report_lines.append(f"- **Pairs with Zero Skill Overlap**: `{zero_skill_overlap_count:,}` ({(zero_skill_overlap_count/len(pairs))*100:.2f}% of all pairs)")
    report_lines.append(f"- **Pairs with Non-Zero Skill Overlap**: `{len(pairs) - zero_skill_overlap_count:,}` ({((len(pairs) - zero_skill_overlap_count)/len(pairs))*100:.2f}%)")
    report_lines.append(f"- **Pairs with Zero TF-IDF Similarity**: `{zero_tfidf_sim_count:,}` ({(zero_tfidf_sim_count/len(pairs))*100:.2f}% of all pairs)")
    report_lines.append(f"- **Pairs with Positive TF-IDF Similarity**: `{len(pairs) - zero_tfidf_sim_count:,}` ({((len(pairs) - zero_tfidf_sim_count)/len(pairs))*100:.2f}%)")
    report_lines.append("")

    report_lines.append("## 3. Numeric Feature Distributions Summary")
    num_fields = [
        "tfidf_similarity", "student_project_text_similarity", "skill_overlap_count",
        "skill_overlap_ratio", "required_skill_count", "matched_skill_count",
        "interest_overlap_count", "interest_overlap_ratio", "domain_overlap_count"
    ]
    report_lines.append("| Feature Name | Min | Max | Mean | Median |")
    report_lines.append("|---|---|---|---|---|")
    for f in num_fields:
        vals = [p[f] for p in pairs]
        report_lines.append(f"| `{f}` | {min(vals)} | {max(vals)} | {statistics.mean(vals):.4f} | {statistics.median(vals):.4f} |")
    report_lines.append("")

    report_lines.append("## 4. Top 10 Highest TF-IDF Similarity Pairs")
    report_lines.append("| Rank | Student ID | Project ID | TF-IDF Sim | Text Sim | Skill Overlap | Project Role |")
    report_lines.append("|---|---|---|---|---|---|---|")
    for rank, p in enumerate(top_tfidf_pairs, 1):
        report_lines.append(f"| {rank} | `{p['student_id'][:8]}...` | `{p['project_id']}` | `{p['tfidf_similarity']}` | `{p['student_project_text_similarity']}` | `{p['skill_overlap_count']}` | `{p['project_role']}` |")
    report_lines.append("")

    report_lines.append("## 5. Top 10 Highest Skill-Overlap Pairs")
    report_lines.append("| Rank | Student ID | Project ID | Skill Overlap Count | Skill Ratio | TF-IDF Sim | Required Techs |")
    report_lines.append("|---|---|---|---|---|---|---|")
    for rank, p in enumerate(top_skill_pairs, 1):
        report_lines.append(f"| {rank} | `{p['student_id'][:8]}...` | `{p['project_id']}` | `{p['skill_overlap_count']}` | `{p['skill_overlap_ratio']}` | `{p['tfidf_similarity']}` | `{p['required_skill_count']}` |")
    report_lines.append("")

    report_lines.append("## 6. Example Pair Records (First 10 Pairs)")
    for rank, p in enumerate(pairs[:10], 1):
        report_lines.append(f"### Example Pair {rank}")
        report_lines.append(f"- **Student ID**: `{p['student_id']}` | **Project ID**: `{p['project_id']}`")
        report_lines.append(f"- **TF-IDF Similarity**: `{p['tfidf_similarity']}` | **Text Similarity**: `{p['student_project_text_similarity']}`")
        report_lines.append(f"- **Skill Overlap**: `{p['skill_overlap_count']}` / `{p['required_skill_count']}` (Ratio: `{p['skill_overlap_ratio']}`)")
        report_lines.append(f"- **Interest Overlap**: `{p['interest_overlap_count']}` | **Domain Match**: `{p['domain_match']}`")
        report_lines.append(f"- **Student Branch/Year**: `{p['student_branch']}` ({p['student_year']})")
        report_lines.append(f"- **Project Role**: `{p['project_role']}`")
        report_lines.append("")

    with open(report_md, "w", encoding="utf-8") as f:
        f.write("\n".join(report_lines))

    rel_report = os.path.relpath(report_md, project_root)
    print(f"Saved validation report to: {rel_report}")

    # 7. Print Terminal Summary
    print("\n" + "=" * 65)
    print("      STUDENT-PROJECT PAIR DATASET VALIDATION REPORT")
    print("=" * 65)
    print(f"1. TOTAL PAIRS GENERATED : {len(pairs):,} (Expected: 175,000)")
    print(f"2. DUPLICATE PAIRS       : {duplicate_pair_count}")
    print(f"3. MISSING VALUES        : {total_missing}")
    print("-" * 65)
    print("4. SPARSITY & OVERLAP STATS:")
    print(f"   - Zero Skill Overlap Pairs : {zero_skill_overlap_count:,} ({(zero_skill_overlap_count/len(pairs))*100:.1f}%)")
    print(f"   - Non-Zero Skill Overlap   : {len(pairs)-zero_skill_overlap_count:,} ({((len(pairs)-zero_skill_overlap_count)/len(pairs))*100:.1f}%)")
    print(f"   - Zero TF-IDF Sim Pairs    : {zero_tfidf_sim_count:,} ({(zero_tfidf_sim_count/len(pairs))*100:.1f}%)")
    print(f"   - Positive TF-IDF Sim      : {len(pairs)-zero_tfidf_sim_count:,} ({((len(pairs)-zero_tfidf_sim_count)/len(pairs))*100:.1f}%)")
    print("-" * 65)
    print("5. TOP TF-IDF SIMILARITY PAIRS (FIRST 3):")
    for r, p in enumerate(top_tfidf_pairs[:3], 1):
        print(f"   [{r}] Student: {p['student_id'][:8]}... -> {p['project_id']} | TFIDF: {p['tfidf_similarity']} | Overlap: {p['skill_overlap_count']} skills | Role: {p['project_role']}")
    print("-" * 65)
    print("6. TOP SKILL-OVERLAP PAIRS (FIRST 3):")
    for r, p in enumerate(top_skill_pairs[:3], 1):
        print(f"   [{r}] Student: {p['student_id'][:8]}... -> {p['project_id']} | Overlap: {p['skill_overlap_count']} skills | Ratio: {p['skill_overlap_ratio']} | TFIDF: {p['tfidf_similarity']}")
    print("-" * 65)
    print("7. OUTPUT FILES:")
    print(f"   - CSV: ml/data/student_project_pairs.csv")
    print(f"   - MD : ml/data/pair_features_report.md")
    print("=" * 65)

if __name__ == "__main__":
    create_pair_features()
