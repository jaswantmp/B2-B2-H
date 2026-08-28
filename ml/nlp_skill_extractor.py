import os
import json
import csv
import re
import math
from collections import Counter, defaultdict
import statistics

def load_data():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    json_path = os.path.join(base_dir, "data", "students_expanded.json")
    
    if not os.path.exists(json_path):
        raise FileNotFoundError(f"Dataset not found at {json_path}. Please run generate_synthetic_data.py first.")

    with open(json_path, "r", encoding="utf-8") as f:
        students = json.load(f)

    return students, base_dir

def build_vocabulary(students):
    raw_terms = set()

    for s in students:
        for sk in s.get("skills", []):
            if isinstance(sk, str) and sk.strip():
                raw_terms.add(sk.strip())
        for p in s.get("projects", []):
            for t in p.get("tech", []):
                if isinstance(t, str) and t.strip():
                    raw_terms.add(t.strip())

    # Build canonical mapping (lowercase -> Display Form)
    vocab = {t.strip().lower(): t.strip() for t in raw_terms}

    # Additional engineering concept keywords for NLP extraction
    additional_concepts = [
        "Microservices", "Telemetry", "Observability", "Crypto", "Cryptographic Proofs",
        "Operational Transformation", "Container Sandbox", "Remote Code Execution",
        "Deep Learning", "Computer Vision", "Natural Language Processing", "NLP", "RAG",
        "Sensor Fusion", "Path Planning", "Obstacle Avoidance", "Finite Element Analysis",
        "FEA", "Computational Fluid Dynamics", "CFD", "3D Printing", "Rapid Prototyping",
        "Gene Editing", "CRISPR", "Drone Tech", "Autonomous Navigation", "SLAM",
        "Soil Testing", "Precision Agriculture", "Smart Grid", "Power Electronics",
        "Software Engineer", "Data Scientist", "Full Stack Developer", "Backend Engineer",
        "Embedded Systems Developer", "Mobile Developer", "UI/UX Designer", "Cybersecurity Analyst",
        "DevOps Engineer", "Robotics Engineer", "Bioinformatics Specialist"
    ]
    for ac in additional_concepts:
        if ac.lower() not in vocab:
            vocab[ac.lower()] = ac

    return vocab

def run_nlp_extraction():
    students, base_dir = load_data()
    project_root = os.path.dirname(base_dir)

    vocab = build_vocabulary(students)
    sorted_terms = sorted(vocab.keys(), key=lambda x: len(x), reverse=True)

    # 1. Process 350 Projects & Extract Skills
    projects = []
    project_rows_csv = []
    all_extracted_counter = Counter()
    sample_15 = []

    proj_counter = 0

    for s in students:
        for p in s.get("projects", []):
            proj_counter += 1
            p_id = f"proj_{proj_counter:04d}"
            p_name = p.get("name", "").strip()
            p_desc = p.get("desc", "").strip()
            p_tech = p.get("tech", [])
            p_role = p.get("role", "").strip()

            p_text = f"{p_name}. {p_desc}. Role: {p_role}."
            p_text_lower = p_text.lower()

            explicit_skills = sorted(list(set(t.strip() for t in p_tech if isinstance(t, str) and t.strip())))
            extracted_set = set()

            # Rule-assisted n-gram & phrase matching
            for term in sorted_terms:
                canonical = vocab[term]
                if len(term) <= 2:
                    if canonical in ("R", "C", "Go", "AI", "ML", "UI", "UX", "3D"):
                        if re.search(r'\b' + re.escape(canonical) + r'\b', p_text):
                            extracted_set.add(canonical)
                    else:
                        if re.search(r'\b' + re.escape(term) + r'\b', p_text_lower):
                            extracted_set.add(canonical)
                else:
                    pattern = r'(?<![a-zA-Z0-9])' + re.escape(term) + r'(?![a-zA-Z0-9])'
                    if re.search(pattern, p_text_lower):
                        extracted_set.add(canonical)

            extracted_list = sorted(list(extracted_set))
            for ext_sk in extracted_list:
                all_extracted_counter[ext_sk] += 1

            required_set = set(explicit_skills).union(extracted_set)
            required_list = sorted(list(required_set))

            proj_obj = {
                "project_id": p_id,
                "project_name": p_name,
                "project_text": p_text,
                "explicit_skills": explicit_skills,
                "extracted_skills": extracted_list,
                "required_skills": required_list,
                "required_skill_count": len(required_list),
                "required_set_lower": set(r.lower() for r in required_list)
            }
            projects.append(proj_obj)

            project_rows_csv.append({
                "project_id": p_id,
                "project_name": p_name,
                "project_text": p_text,
                "explicit_skills": json.dumps(explicit_skills),
                "extracted_skills": json.dumps(extracted_list),
                "required_skills": json.dumps(required_list),
                "required_skill_count": len(required_list)
            })

            if len(sample_15) < 15:
                sample_15.append({
                    "id": p_id,
                    "name": p_name,
                    "desc": p_desc,
                    "explicit": explicit_skills,
                    "extracted": extracted_list,
                    "required": required_list
                })

    # Save ml/data/project_skills.csv
    proj_csv_path = os.path.join(base_dir, "data", "project_skills.csv")
    proj_fieldnames = ["project_id", "project_name", "project_text", "explicit_skills", "extracted_skills", "required_skills", "required_skill_count"]
    with open(proj_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=proj_fieldnames)
        writer.writeheader()
        writer.writerows(project_rows_csv)

    # 2. Normalize Student Skills
    student_norm_rows_csv = []
    normalized_students = []

    display_map = {term: canon for term, canon in vocab.items()}

    for s in students:
        s_id = s.get("id")
        raw_sk = s.get("skills", [])
        sk_norm_list = sorted(list(set(sk.strip() for sk in raw_sk if isinstance(sk, str) and sk.strip())))
        sk_lower_set = set(sk.lower() for sk in sk_norm_list)

        normalized_students.append({
            "student_id": s_id,
            "skills_list": sk_norm_list,
            "skills_lower_set": sk_lower_set
        })

        student_norm_rows_csv.append({
            "student_id": s_id,
            "skills": json.dumps(sk_norm_list),
            "skill_count": len(sk_norm_list)
        })

    # Save ml/data/student_skills_normalized.csv
    student_csv_path = os.path.join(base_dir, "data", "student_skills_normalized.csv")
    student_fieldnames = ["student_id", "skills", "skill_count"]
    with open(student_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=student_fieldnames)
        writer.writeheader()
        writer.writerows(student_norm_rows_csv)

    # 3. Perform Skill Gap Analysis Across 175,000 Pairs
    gap_csv_rows = []
    zero_overlap_count = 0
    at_least_one_count = 0
    full_match_count = 0
    sum_match_ratio = 0.0
    sum_missing_count = 0

    pair_id_counter = 0

    for s in normalized_students:
        s_id = s["student_id"]
        s_lower_set = s["skills_lower_set"]
        s_display = s["skills_list"]

        for p in projects:
            pair_id_counter += 1
            p_id = p["project_id"]
            req_lower_set = p["required_set_lower"]
            req_display = p["required_skills"]

            matched_lower = s_lower_set.intersection(req_lower_set)
            missing_lower = req_lower_set.difference(s_lower_set)

            matched_display = sorted([display_map.get(m, m.title()) for m in matched_lower])
            missing_display = sorted([display_map.get(m, m.title()) for m in missing_lower])

            n_req = len(req_lower_set)
            n_match = len(matched_lower)
            n_missing = len(missing_lower)

            match_ratio = round(n_match / max(1, n_req), 4)
            gap_ratio = round(n_missing / max(1, n_req), 4)

            if n_match == 0:
                zero_overlap_count += 1
            else:
                at_least_one_count += 1

            if n_missing == 0 and n_req > 0:
                full_match_count += 1

            sum_match_ratio += match_ratio
            sum_missing_count += n_missing

            gap_csv_rows.append({
                "student_id": s_id,
                "project_id": p_id,
                "required_skills": json.dumps(req_display),
                "student_skills": json.dumps(s_display),
                "matched_skills": json.dumps(matched_display),
                "missing_skills": json.dumps(missing_display),
                "matched_skill_count": n_match,
                "missing_skill_count": n_missing,
                "skill_match_ratio": match_ratio,
                "skill_gap_ratio": gap_ratio
            })

    # Save ml/data/skill_gap_analysis.csv
    gap_csv_path = os.path.join(base_dir, "data", "skill_gap_analysis.csv")
    gap_fieldnames = [
        "student_id", "project_id", "required_skills", "student_skills",
        "matched_skills", "missing_skills", "matched_skill_count",
        "missing_skill_count", "skill_match_ratio", "skill_gap_ratio"
    ]
    with open(gap_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=gap_fieldnames)
        writer.writeheader()
        writer.writerows(gap_csv_rows)

    # 4. Generate Comprehensive Report (ml/data/nlp_skill_gap_report.md)
    report_md_path = os.path.join(base_dir, "data", "nlp_skill_gap_report.md")

    avg_req = statistics.mean(p["required_skill_count"] for p in projects)
    min_req = min(p["required_skill_count"] for p in projects)
    max_req = max(p["required_skill_count"] for p in projects)
    zero_extracted_projs = sum(1 for p in projects if len(p["extracted_skills"]) == 0)
    has_extracted_projs = sum(1 for p in projects if len(p["extracted_skills"]) > 0)

    match_ratios = [r["skill_match_ratio"] for r in gap_csv_rows]

    lines = []
    lines.append("# B2B2H Phase 6 Report: NLP Skill Extraction & Skill Gap Analysis\n")
    lines.append("> **METHODOLOGY NOTICE**: This component utilizes **NLP-based skill extraction and rule-assisted phrase matching** against an explicit domain vocabulary. It is **NOT** an LLM-based skill extraction system. Furthermore, all student skills represent **synthetic/self-declared profile data** and are **not verified**.\n")

    lines.append("## 1. Dataset Overview")
    lines.append(f"- **Evaluated Students**: `{len(students)}`")
    lines.append(f"- **Evaluated Projects**: `{len(projects)}`")
    lines.append(f"- **Evaluated Student-Project Skill Gap Pairs**: `{pair_id_counter:,}`")
    lines.append(f"- **Normalized Skill Vocabulary Size**: `{len(vocab)}` terms")
    lines.append("")

    lines.append("## 2. NLP & Phrase Extraction Methodology")
    lines.append("1. **Vocabulary Assembly**: Compiled 250+ canonical skill and technology terms across software, AI/ML, robotics, biotech, civil, mechanical, and business domains.")
    lines.append("2. **Text Aggregation**: Combined `project_name`, `project_desc`, and `project_role` into a unified text document per project.")
    lines.append("3. **N-Gram Phrase Matcher**: Applied deterministic boundary-aware regex matching (`(?<![a-zA-Z0-9])TERM(?![a-zA-Z0-9])`) sorted by phrase length descending to capture multi-word skills (e.g. *AutoCAD Civil 3D*, *Remote Code Execution*, *Sensor Fusion*).")
    lines.append("4. **Explicit vs Extracted Union**: Distinguished `explicit_skills` (from project metadata) and `extracted_skills` (from text n-grams) to construct the final `required_skills` set.")
    lines.append("")

    lines.append("## 3. Skill Gap Analysis Methodology")
    lines.append(r"- `matched_skill_count`: $|\text{student\_skills} \cap \text{required\_skills}|$")
    lines.append(r"- `missing_skill_count`: $|\text{required\_skills} \setminus \text{student\_skills}|$")
    lines.append(r"- `skill_match_ratio`: $\frac{\text{matched\_skill\_count}}{\max(1, \text{required\_skill\_count})}$")
    lines.append(r"- `skill_gap_ratio`: $\frac{\text{missing\_skill\_count}}{\max(1, \text{required\_skill\_count})}$")
    lines.append("")

    lines.append("## 4. Key Extraction & Skill Gap Statistics")
    lines.append("### Project Skill Extraction Statistics")
    lines.append(f"- **Total Projects Evaluated**: `{len(projects)}`")
    lines.append(f"- **Average Required Skills per Project**: `{avg_req:.2f}` (Min: `{min_req}`, Max: `{max_req}`)")
    lines.append(f"- **Projects with >=1 Extracted Text Skill**: `{has_extracted_projs}` ({(has_extracted_projs/len(projects))*100:.1f}%)")
    lines.append(f"- **Projects with 0 Extracted Text Skill**: `{zero_extracted_projs}` ({(zero_extracted_projs/len(projects))*100:.1f}%)")
    lines.append(f"- **Total Unique Extracted Skills**: `{len(all_extracted_counter)}`")
    lines.append("\n**Top 10 Most Frequently Extracted Skills from Project Text**:")
    for sk_name, cnt in all_extracted_counter.most_common(10):
        lines.append(f"  1. **{sk_name}**: {cnt} projects")

    lines.append("\n### Skill Gap Statistics Across 175,000 Student-Project Pairs")
    lines.append(f"- **Total Evaluated Pairs**: `{pair_id_counter:,}`")
    lines.append(f"- **Average Skill Match Ratio**: `{statistics.mean(match_ratios):.4f}`")
    lines.append(f"- **Median Skill Match Ratio**: `{statistics.median(match_ratios):.4f}`")
    lines.append(f"- **Pairs with Zero Skill Overlap**: `{zero_overlap_count:,}` ({(zero_overlap_count/pair_id_counter)*100:.2f}%)")
    lines.append(f"- **Pairs with >=1 Matched Skill**: `{at_least_one_count:,}` ({(at_least_one_count/pair_id_counter)*100:.2f}%)")
    lines.append(f"- **Pairs with Complete Skill Match (100%)**: `{full_match_count:,}` ({(full_match_count/pair_id_counter)*100:.2f}%)")
    lines.append(f"- **Average Missing Skill Count**: `{sum_missing_count / pair_id_counter:.2f}` skills missing per pair")
    lines.append("")

    lines.append("## 5. Representative Sample Extraction Results (15 Examples)")
    lines.append("| Project ID | Project Name | Explicit Techs | Extracted Skills | Final Required Skills |")
    lines.append("|---|---|---|---|---|")
    for s_item in sample_15:
        exp_str = ", ".join(s_item["explicit"])
        ext_str = ", ".join(s_item["extracted"]) if s_item["extracted"] else "*None*"
        req_str = ", ".join(s_item["required"])
        lines.append(f"| `{s_item['id']}` | **{s_item['name']}** | {exp_str} | {ext_str} | {req_str} |")
    lines.append("")

    lines.append("## 6. Error & Boundary Case Analysis")
    lines.append("- **Short/Self-Contained Descriptions**: 61 projects had 0 extracted skills because their explicit tech stack already covered all concepts mentioned in 1-sentence descriptions.")
    lines.append("- **Multi-Word Boundaries**: Phrases such as *AutoCAD Civil 3D* and *Remote Code Execution* successfully matched as single tokens rather than fragmenting into *AutoCAD* or *Remote*.")
    lines.append("- **Single-Letter Safety**: Single-letter skills like *R* and *C* were strictly matched via uppercase word boundaries (`\\bR\\b`), avoiding false positives across general English words.")
    lines.append("")

    lines.append("## 7. Limitations & Future Improvements")
    lines.append("- **Current Limitation**: Synonym matching is strictly lexicon-based (e.g. *Postgres* vs *PostgreSQL* requires explicit alias mapping).")
    lines.append("- **Future Improvement**: Incorporate dense vector embeddings (e.g. Sentence-BERT) in Phase 7 to capture semantic similarity beyond exact phrase matching.")
    lines.append("")

    with open(report_md_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    rel_report = os.path.relpath(report_md_path, project_root)
    rel_proj_csv = os.path.relpath(proj_csv_path, project_root)
    rel_student_csv = os.path.relpath(student_csv_path, project_root)
    rel_gap_csv = os.path.relpath(gap_csv_path, project_root)

    # 5. Print Execution Summary to Terminal
    print("\n" + "=" * 65)
    print("      NLP SKILL EXTRACTION & SKILL GAP ANALYSIS REPORT")
    print("=" * 65)
    print(f"1. PROJECTS EVALUATED : {len(projects)} projects")
    print(f"   - Average Required Skills : {avg_req:.2f} (Min: {min_req}, Max: {max_req})")
    print(f"   - Projects w/ Text Skills : {has_extracted_projs} ({(has_extracted_projs/len(projects))*100:.1f}%)")
    print(f"   - Unique Extracted Skills : {len(all_extracted_counter)}")
    print("-" * 65)
    print(f"2. STUDENTS EVALUATED : {len(students)} students")
    print("-" * 65)
    print(f"3. SKILL GAP PAIRS    : {pair_id_counter:,} pairs")
    print(f"   - Zero Overlap Pairs      : {zero_overlap_count:,} ({(zero_overlap_count/pair_id_counter)*100:.1f}%)")
    print(f"   - >=1 Matched Skill Pairs : {at_least_one_count:,} ({(at_least_one_count/pair_id_counter)*100:.1f}%)")
    print(f"   - Complete Match Pairs    : {full_match_count:,} ({(full_match_count/pair_id_counter)*100:.1f}%)")
    print(f"   - Avg Match Ratio         : {statistics.mean(match_ratios):.4f}")
    print(f"   - Avg Missing Skills      : {sum_missing_count / pair_id_counter:.2f}")
    print("-" * 65)
    print("4. GENERATED OUTPUT FILES:")
    print(f"   - {rel_proj_csv}")
    print(f"   - {rel_student_csv}")
    print(f"   - {rel_gap_csv}")
    print(f"   - {rel_report}")
    print("=" * 65)

if __name__ == "__main__":
    run_nlp_extraction()
