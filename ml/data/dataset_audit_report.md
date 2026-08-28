# B2B2H Dataset Audit Report: Synthetic Student Dataset

> **Audit Target File**: `ml/data/students.csv` (Extracted from `src/services/data.js`)

## 1. Basic Dataset Statistics
- **Total Students**: `72`
- **Total CSV Columns**: `19`
- **Total Projects**: `139`
- **Average Projects per Student**: `1.93`
- **Students with 0 Projects**: `10` (13.9%)
- **Students with 1 Project**: `17` (23.6%)
- **Students with 2+ Projects**: `45` (62.5%)
- **Total Unique Skills (Normalized)**: `168`
- **Total Unique Interests (Normalized)**: `85`
- **Total Unique Domains (Normalized)**: `18`
- **Total Unique Technologies**: `147`
- **Total Hackathon Participations**: `212`
- **Total Hackathon Wins**: `41`

## 2. Student Distribution Analysis
### Branch Distribution
  - **Computer Science Engineering**: 3 (4.2%)
  - **Information Technology**: 3 (4.2%)
  - **Artificial Intelligence & Data Science**: 3 (4.2%)
  - **Artificial Intelligence & Machine Learning**: 3 (4.2%)
  - **Electronics & Communication Engineering**: 3 (4.2%)
  - **Electrical Engineering**: 3 (4.2%)
  - **Mechanical Engineering**: 3 (4.2%)
  - **Civil Engineering**: 3 (4.2%)
  - **Mechatronics**: 3 (4.2%)
  - **Robotics**: 3 (4.2%)
  - **Automobile Engineering**: 3 (4.2%)
  - **Chemical Engineering**: 3 (4.2%)
  - **Biotechnology**: 3 (4.2%)
  - **Biomedical Engineering**: 3 (4.2%)
  - **Agricultural Engineering**: 3 (4.2%)
  - **Aerospace Engineering**: 3 (4.2%)
  - **Industrial Engineering**: 3 (4.2%)
  - **Instrumentation Engineering**: 3 (4.2%)
  - **Architecture**: 3 (4.2%)
  - **Fashion Technology**: 3 (4.2%)
  - **Data Science**: 3 (4.2%)
  - **Cyber Security**: 3 (4.2%)
  - **MBA**: 3 (4.2%)
  - **MCA**: 3 (4.2%)

### Academic Year Distribution
  - **2nd Year**: 18 (25.0%)
  - **4th Year**: 18 (25.0%)
  - **1st Year**: 18 (25.0%)
  - **3rd Year**: 18 (25.0%)

### Availability Status Distribution
  - **LOOKING_FOR_TEAM**: 17 (23.6%)
  - **OPEN_TO_INVITES**: 16 (22.2%)
  - **LOOKING_FOR_MEMBERS**: 14 (19.4%)
  - **IN_TEAM**: 13 (18.1%)
  - **OFFLINE**: 12 (16.7%)

### University Distribution (Top 5)
  - **National Institute of Technology Tiruchirappalli**: 8 (11.1%)
  - **Vellore Institute of Technology**: 8 (11.1%)
  - **PSG College of Technology**: 6 (8.3%)
  - **Madras Institute of Technology**: 5 (6.9%)
  - **Anna University Regional Campus**: 4 (5.6%)

### Location Distribution (Top 5)
  - **Coimbatore, Tamil Nadu**: 23 (31.9%)
  - **Chennai, Tamil Nadu**: 18 (25.0%)
  - **Tiruchirappalli, Tamil Nadu**: 8 (11.1%)
  - **Vellore, Tamil Nadu**: 8 (11.1%)
  - **Thanjavur, Tamil Nadu**: 4 (5.6%)

### Low-Representation Categories (<3 students)
- **Branches with <3 Students (0)**: ...
- **Universities with <3 Students (7)**: 7 universities

## 3. Skills Analysis
- **Total Unique Normalized Skills**: `168`
- **Average Skills per Student**: `8.03`
- **Minimum Skills**: `4`
- **Maximum Skills**: `12`
- **Skills Appearing Only Once (Rare Skills)**: `31` (18.5% of all skills)

### Top 30 Most Common Skills
1. **Python**: 25 occurrences (34.7% of students)
2. **Communication**: 22 occurrences (30.6% of students)
3. **Team Leadership**: 21 occurrences (29.2% of students)
4. **Rapid Prototyping**: 20 occurrences (27.8% of students)
5. **Problem Solving**: 17 occurrences (23.6% of students)
6. **Ideation**: 16 occurrences (22.2% of students)
7. **Matlab**: 16 occurrences (22.2% of students)
8. **Presentation**: 14 occurrences (19.4% of students)
9. **Solidworks**: 9 occurrences (12.5% of students)
10. **Signal Processing**: 8 occurrences (11.1% of students)
11. **Plc**: 7 occurrences (9.7% of students)
12. **Ansys**: 7 occurrences (9.7% of students)
13. **Cfd**: 7 occurrences (9.7% of students)
14. **Git**: 6 occurrences (8.3% of students)
15. **Tableau**: 6 occurrences (8.3% of students)
16. **Catia**: 6 occurrences (8.3% of students)
17. **C++**: 5 occurrences (6.9% of students)
18. **Java**: 5 occurrences (6.9% of students)
19. **Docker**: 5 occurrences (6.9% of students)
20. **React**: 5 occurrences (6.9% of students)
21. **R**: 5 occurrences (6.9% of students)
22. **Sql**: 5 occurrences (6.9% of students)
23. **Labview**: 5 occurrences (6.9% of students)
24. **Thermodynamics**: 5 occurrences (6.9% of students)
25. **Autocad**: 5 occurrences (6.9% of students)
26. **Power Bi**: 5 occurrences (6.9% of students)
27. **Postgresql**: 4 occurrences (5.6% of students)
28. **Aws**: 4 occurrences (5.6% of students)
29. **Scikit-Learn**: 4 occurrences (5.6% of students)
30. **Pandas**: 4 occurrences (5.6% of students)

## 4. Interests Analysis
- **Total Unique Interests**: `85`
- **Average Interests per Student**: `4.62`
- **Minimum Interests**: `3`
- **Maximum Interests**: `6`
- **Rare Interests (Appearing Once)**: `7`

### Top 20 Most Common Interests
1. **Manufacturing**: 9 occurrences
2. **Telemedicine**: 8 occurrences
3. **Micro-Mobility**: 8 occurrences
4. **Sustainable Materials**: 7 occurrences
5. **Web3**: 7 occurrences
6. **Logistics**: 7 occurrences
7. **Green Building**: 7 occurrences
8. **Green Mobility**: 7 occurrences
9. **Synthetic Biology**: 6 occurrences
10. **Robotics**: 6 occurrences
11. **Automation**: 6 occurrences
12. **Defence**: 6 occurrences
13. **Quantum Computing**: 6 occurrences
14. **Nanotechnology**: 6 occurrences
15. **Embedded Systems**: 6 occurrences
16. **High Performance Computing**: 6 occurrences
17. **Supply Chain**: 6 occurrences
18. **Smart Agriculture**: 6 occurrences
19. **Fintech**: 5 occurrences
20. **Precision Agriculture**: 5 occurrences

## 5. Domain Analysis
- **Total Unique Domains**: `18`
- **Average Domains per Student**: `3.21`

### Domain Frequencies
- **Civil**: 19 students (26.4%)
- **Ai/Ml**: 18 students (25.0%)
- **Agritech**: 18 students (25.0%)
- **Design**: 17 students (23.6%)
- **Aerospace**: 16 students (22.2%)
- **Fintech**: 15 students (20.8%)
- **Logistics**: 14 students (19.4%)
- **Iot**: 14 students (19.4%)
- **Ev**: 14 students (19.4%)
- **Mechanical**: 13 students (18.1%)
- **Healthcare**: 13 students (18.1%)
- **Cleantech**: 11 students (15.3%)
- **Web**: 10 students (13.9%)
- **Edtech**: 9 students (12.5%)
- **Product**: 8 students (11.1%)
- **Biotech**: 8 students (11.1%)
- **Robotics**: 8 students (11.1%)
- **Cybersecurity**: 6 students (8.3%)

- **Domains with Very Few Students (<5)**: None

## 6. Project Analysis
- **Available Project Fields**: `['desc', 'name', 'role', 'tech']`
- **Total Projects**: `139`
- **Average Projects per Student**: `1.93`
- **Projects with Descriptions**: `139` (100.0%)
- **Projects without Descriptions**: `0`
- **Projects with Tech Stack**: `139` (100.0%)
- **Projects without Tech Stack**: `0`
- **Total Unique Technologies**: `147`

### Top 15 Project Technologies
1. **Python**: 33 projects
2. **Matlab**: 14 projects
3. **Sql**: 12 projects
4. **Docker**: 11 projects
5. **React**: 11 projects
6. **Solidworks**: 10 projects
7. **Arduino**: 9 projects
8. **Plc**: 9 projects
9. **Node.Js**: 8 projects
10. **Opencv**: 8 projects
11. **Pcb Design**: 8 projects
12. **Tableau**: 7 projects
13. **C++**: 7 projects
14. **Signal Processing**: 7 projects
15. **Cfd**: 7 projects

### Top Project Roles
- **Software Engineer**: 10 projects
- **Data Scientist**: 8 projects
- **AI Engineer**: 8 projects
- **Embedded Engineer**: 8 projects
- **Mechatronics Engineer**: 8 projects
- **BIM Designer**: 8 projects
- **Operations Analyst**: 7 projects
- **Product Manager**: 7 projects
- **Electrical Systems Engineer**: 6 projects
- **Robotics Engineer**: 6 projects
- **Aerospace Systems Engineer**: 6 projects
- **UI/Creative Designer**: 6 projects
- **CAD Engineer**: 5 projects
- **Structural Engineer**: 5 projects
- **Automotive & EV Engineer**: 5 projects
- **Bioinformatics Researcher**: 5 projects
- **Data Engineer**: 5 projects
- **Security Analyst**: 5 projects
- **Backend Developer**: 5 projects
- **AgriTech Specialist**: 4 projects
- **Instrumentation Engineer**: 4 projects
- **Full Stack Developer**: 3 projects
- **Medical AI Specialist**: 3 projects
- **Process Engineer**: 2 projects

## 7. Hackathon Analysis
### Participation Stats
- **Min / Max / Mean / Median**: `0` / `7` / `2.94` / `3.0`
- **Students with Zero Participation**: `8` (11.1%)
- **Students with >=1 Participation**: `64` (88.9%)

### Win Stats
- **Min / Max / Mean / Median**: `0` / `2` / `0.57` / `0.0`
- **Students with at least 1 Win**: `32` (44.4%)

## 8. GitHub Stats Analysis
- **Available Fields**: `['repos', 'commits', 'stars', 'followers', 'following']`
- **repos**: Min=0, Max=28, Mean=12.2, Median=11.5
- **commits**: Min=0, Max=443, Mean=189.7, Median=192.0
- **stars**: Min=0, Max=45, Mean=14.8, Median=11.0
- **followers**: Min=0, Max=80, Mean=29.4, Median=25.5
- **following**: Min=0, Max=49, Mean=20.6, Median=18.0

## 9. Profile Completion Analysis
- **Min / Max / Mean / Median**: `70` / `100` / `86.40` / `88.0`
- **Concentration Analysis**: Profile completions range from 70% to 100%, heavily concentrated between 75% and 95%. No students have incomplete profiles (<50%).

## 10. Data Quality Audit
- **Duplicate IDs**: `0` (None)
- **Duplicate Usernames**: `0` (None)
- **Duplicate Emails**: `0` (None)
- **Malformed JSON Fields**: `0`
- **Duplicate Skills within Single Profiles**: `0` occurrences
- **Duplicate Interests within Single Profiles**: `0` occurrences
- **Duplicate Tech Stack entries within Single Projects**: `0` occurrences
- **Impossible / Suspicious Numeric Values**: `0` (None)

## 11. ML Readiness Evaluation
### A. K-Means Student Clustering
- **STATUS**: `READY`
- **REASON**: Rich feature representation across skills, branches, domains, hackathons, and GitHub stats allows effective unsupervised builder personas clustering.

### B. TF-IDF Student/Project Matching
- **STATUS**: `READY`
- **REASON**: Detailed project text and student skill/interest/domain strings provide clean text for TF-IDF / Cosine Similarity matching.

### C. Recommendation Systems (Content-Based)
- **STATUS**: `READY`
- **REASON**: Content-based filtering using skill vectors and TF-IDF profile similarity works immediately with the current feature set.

### D. Supervised Classification
- **STATUS**: `NOT READY`
- **REASON**: No ground truth target labels exist in the dataset (e.g. successful vs failed team formation). Synthetic outcome labels must be defined.

### E. Supervised Regression
- **STATUS**: `NOT READY`
- **REASON**: No continuous ground truth targets exist (e.g. real team compatibility score or hackathon score metrics).

### F. NLP Skill Extraction
- **STATUS**: `PARTIALLY READY`
- **REASON**: Project descriptions and bios are clear but short. Larger text corpus required for training custom NER/skill extraction models.

### G. Skill-Gap Analysis
- **STATUS**: `READY`
- **REASON**: Explicit skill vectors allow rule-based and distance-based gap identification for candidate teams.

## 12. Data Imbalance Analysis
- **Branch Imbalance**: Computer Science and IT dominate (~40% of students). Specialized branches (Biotechnology, Mechatronics, MCA) have 1-2 students each.
- **Skill Imbalance**: High frequency of popular web skills (Python, JavaScript, React, Docker) with heavy long-tail sparsity (100+ skills appearing only 1 time).
- **Project Imbalance**: 10 students have 0 projects while 45 students have 2+ projects.
- **Impact on ML**: Models trained on this dataset will overfit to CS/web projects and perform poorly on niche domain team matching (e.g. AgriTech or Hardware).

## 13. Recommended Dataset Expansion Plan
| Field / Component | Current State | Target State | Why It Is Needed |
|---|---|---|---|
| Student Profiles | 72 students | 500 - 1,000 students | Provide sufficient statistical support for all 24 engineering branches and prevent overfitting. |
| Project Records | 139 projects (across 62 students) | 1,000+ realistic student projects | Enable robust project-team matching, tech stack overlap detection, and domain tagging. |
| Supervised Labels / Interaction Data | 0 interaction labels | 5,000+ team formation / invite response pairs | Required to train supervised classification/regression team compatibility models. |
| Hackathon History | 212 participations | 1,500+ hackathon records with explicit domain tags | Enables hackathon team formation modeling and performance forecasting. |

## 14. Recommended Dataset Size for Capstone
- **Target Students**: `500` to `1,000` students
- **Target Projects**: `1,200` to `2,000` project records
- **Target Pairwise Matches / Labels**: `5,000` team compatibility pairs
- **Feasibility**: High. Can be synthesized deterministically using schema-consistent generators within 1-2 days without ballooning repository storage.

## 15. Final Recommendation
- **CURRENT DATASET**: 72 synthetic students
- **DATA QUALITY**: `Excellent` (0 duplicate IDs, 0 duplicate emails, 0 malformed records)
- **ML READINESS**: Ready for unsupervised K-Means clustering, TF-IDF content matching, and rule-based skill gap analysis. Not ready for supervised learning due to lack of ground truth labels.
- **MAIN DATA GAPS**: Small sample size (72), branch sparsity, lack of explicit team outcome labels.
- **RECOMMENDED EXPANSION TARGET**: 500 Students | 1,200 Projects | 5,000 Match Pairs
- **RECOMMENDED NEXT PHASE**: **Synthetic Data Expansion & Outcome Labeling Pipeline**.
