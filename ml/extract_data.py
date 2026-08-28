import os
import json
import re
import csv

def extract_students():
    # 1. Ensure ml/data and ml/models directories exist
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_dir = os.path.join(base_dir, "data")
    models_dir = os.path.join(base_dir, "models")
    os.makedirs(data_dir, exist_ok=True)
    os.makedirs(models_dir, exist_ok=True)

    # 2. Locate dataset file (checking src/services/data.js and src/data.js)
    project_root = os.path.dirname(base_dir)
    possible_paths = [
        os.path.join(project_root, "src", "services", "data.js"),
        os.path.join(project_root, "src", "data.js"),
        os.path.join(project_root, "generated_profiles.json"),
    ]

    source_path = None
    for path in possible_paths:
        if os.path.exists(path):
            source_path = path
            break

    if not source_path:
        raise FileNotFoundError("Could not locate dataset in src/services/data.js or src/data.js")

    rel_source = os.path.relpath(source_path, project_root)
    print(f"Extracting student dataset from: {rel_source}")

    # 3. Read & parse JS/JSON file content
    with open(source_path, "r", encoding="utf-8") as f:
        content = f.read()

    users = None
    if source_path.endswith(".json"):
        users = json.loads(content)
    else:
        # Extract JS users array
        match = re.search(r'export\s+const\s+users\s*=\s*(\[)', content)
        if not match:
            raise ValueError(f"Could not find 'export const users =' in {source_path}")
        
        start_idx = match.start(1)
        depth = 0
        end_idx = -1
        in_string = False
        escape = False
        string_char = ''

        for i in range(start_idx, len(content)):
            char = content[i]
            if in_string:
                if escape:
                    escape = False
                elif char == '\\':
                    escape = True
                elif char == string_char:
                    in_string = False
            else:
                if char in ('"', "'", '`'):
                    in_string = True
                    string_char = char
                elif char == '[':
                    depth += 1
                elif char == ']':
                    depth -= 1
                    if depth == 0:
                        end_idx = i + 1
                        break

        if end_idx == -1:
            raise ValueError("Failed to match closing bracket of users array.")

        json_str = content[start_idx:end_idx]
        json_str = re.sub(r',\s*([\]}])', r'\1', json_str)
        users = json.loads(json_str)

    # 4. Build tabular records preserving all useful fields
    fieldnames = [
        "id",
        "name",
        "username",
        "email",
        "university",
        "college",
        "location",
        "branch",
        "year",
        "status",
        "bio",
        "skills",
        "interests",
        "domains",
        "projects",
        "hackathonsParticipated",
        "hackathonsWon",
        "githubStats",
        "profileCompletion",
    ]

    records = []
    missing_counts = {field: 0 for field in fieldnames}

    for u in users:
        record = {
            "id": u.get("id"),
            "name": u.get("name"),
            "username": u.get("username"),
            "email": u.get("email"),
            "university": u.get("university"),
            "college": u.get("college"),
            "location": u.get("location"),
            "branch": u.get("branch"),
            "year": u.get("year"),
            "status": u.get("status"),
            "bio": u.get("bio"),
            "skills": json.dumps(u.get("skills", [])),
            "interests": json.dumps(u.get("interests", [])),
            "domains": json.dumps(u.get("domains", [])),
            "projects": json.dumps(u.get("projects", [])),
            "hackathonsParticipated": u.get("hackathonsParticipated", 0),
            "hackathonsWon": u.get("hackathonsWon", u.get("hackathons_won", 0)),
            "githubStats": json.dumps(u.get("githubStats", u.get("github_stats", {}))),
            "profileCompletion": u.get("profileCompletion", 0),
        }

        # Track missing values
        for field in fieldnames:
            val = record[field]
            if val is None or val == "" or val == "[]" or val == "{}":
                missing_counts[field] += 1

        records.append(record)

    # 5. Write to ml/data/students.csv
    output_path = os.path.join(data_dir, "students.csv")
    with open(output_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(records)

    rel_output = os.path.relpath(output_path, project_root)
    print(f"Successfully saved dataset to: {rel_output}")

    # 6. Report extraction verification metrics
    total_missing = sum(missing_counts.values())
    print("\n" + "=" * 50)
    print("      DATASET EXTRACTION VERIFICATION REPORT")
    print("=" * 50)
    print(f"1. Number of students extracted: {len(records)}")
    print(f"2. Number of columns: {len(fieldnames)}")
    print(f"3. Column names: {fieldnames}")
    print(f"4. Missing values per column:")
    for field in fieldnames:
        print(f"   - {field:23s}: {missing_counts[field]} missing")
    print(f"   Total missing value count: {total_missing}")
    print(f"5. Parsing problems: None (successfully extracted all {len(records)} records without syntax or structural errors)")
    print("=" * 50)

if __name__ == "__main__":
    extract_students()
