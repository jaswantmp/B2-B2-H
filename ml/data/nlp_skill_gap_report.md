# B2B2H Phase 6 Report: NLP Skill Extraction & Skill Gap Analysis

> **METHODOLOGY NOTICE**: This component utilizes **NLP-based skill extraction and rule-assisted phrase matching** against an explicit domain vocabulary. It is **NOT** an LLM-based skill extraction system. Furthermore, all student skills represent **synthetic/self-declared profile data** and are **not verified**.

## 1. Dataset Overview
- **Evaluated Students**: `500`
- **Evaluated Projects**: `350`
- **Evaluated Student-Project Skill Gap Pairs**: `175,000`
- **Normalized Skill Vocabulary Size**: `286` terms

## 2. NLP & Phrase Extraction Methodology
1. **Vocabulary Assembly**: Compiled 250+ canonical skill and technology terms across software, AI/ML, robotics, biotech, civil, mechanical, and business domains.
2. **Text Aggregation**: Combined `project_name`, `project_desc`, and `project_role` into a unified text document per project.
3. **N-Gram Phrase Matcher**: Applied deterministic boundary-aware regex matching (`(?<![a-zA-Z0-9])TERM(?![a-zA-Z0-9])`) sorted by phrase length descending to capture multi-word skills (e.g. *AutoCAD Civil 3D*, *Remote Code Execution*, *Sensor Fusion*).
4. **Explicit vs Extracted Union**: Distinguished `explicit_skills` (from project metadata) and `extracted_skills` (from text n-grams) to construct the final `required_skills` set.

## 3. Skill Gap Analysis Methodology
- `matched_skill_count`: $|\text{student\_skills} \cap \text{required\_skills}|$
- `missing_skill_count`: $|\text{required\_skills} \setminus \text{student\_skills}|$
- `skill_match_ratio`: $\frac{\text{matched\_skill\_count}}{\max(1, \text{required\_skill\_count})}$
- `skill_gap_ratio`: $\frac{\text{missing\_skill\_count}}{\max(1, \text{required\_skill\_count})}$

## 4. Key Extraction & Skill Gap Statistics
### Project Skill Extraction Statistics
- **Total Projects Evaluated**: `350`
- **Average Required Skills per Project**: `4.99` (Min: `2`, Max: `11`)
- **Projects with >=1 Extracted Text Skill**: `289` (82.6%)
- **Projects with 0 Extracted Text Skill**: `61` (17.4%)
- **Total Unique Extracted Skills**: `145`

**Top 10 Most Frequently Extracted Skills from Project Text**:
  1. **Microservices**: 35 projects
  1. **Obstacle Avoidance**: 28 projects
  1. **Sensor Fusion**: 28 projects
  1. **IoT**: 26 projects
  1. **Path Planning**: 26 projects
  1. **Telemetry**: 25 projects
  1. **Data Scientist**: 23 projects
  1. **Genomics**: 23 projects
  1. **Sensors**: 22 projects
  1. **Robotics Engineer**: 20 projects

### Skill Gap Statistics Across 175,000 Student-Project Pairs
- **Total Evaluated Pairs**: `175,000`
- **Average Skill Match Ratio**: `0.0566`
- **Median Skill Match Ratio**: `0.0000`
- **Pairs with Zero Skill Overlap**: `136,353` (77.92%)
- **Pairs with >=1 Matched Skill**: `38,647` (22.08%)
- **Pairs with Complete Skill Match (100%)**: `315` (0.18%)
- **Average Missing Skill Count**: `4.71` skills missing per pair

## 5. Representative Sample Extraction Results (15 Examples)
| Project ID | Project Name | Explicit Techs | Extracted Skills | Final Required Skills |
|---|---|---|---|---|
| `proj_0001` | **Microservice Telemetry Mesh** | Docker, Go, PostgreSQL, Prometheus | Microservices, Observability, Software Engineer, Telemetry | Docker, Go, Microservices, Observability, PostgreSQL, Prometheus, Software Engineer, Telemetry |
| `proj_0002` | **Realtime Collaborative IDE** | Node.js, React, TypeScript, WebSockets | Operational Transformation, Software Engineer | Node.js, Operational Transformation, React, Software Engineer, TypeScript, WebSockets |
| `proj_0003` | **Cloud Native Compiler Platform** | Docker, Kubernetes, Python, React | Container Sandbox, Remote Code Execution, Software Engineer | Container Sandbox, Docker, Kubernetes, Python, React, Remote Code Execution, Software Engineer |
| `proj_0004` | **Low-Latency Micro-Ledger** | Docker, PostgreSQL, Rust | Cryptographic Proofs, Software Engineer | Cryptographic Proofs, Docker, PostgreSQL, Rust, Software Engineer |
| `proj_0005` | **Realtime Collaborative IDE** | Node.js, React, TypeScript, WebSockets | Operational Transformation, Software Engineer | Node.js, Operational Transformation, React, Software Engineer, TypeScript, WebSockets |
| `proj_0006` | **Cloud Native Compiler Platform** | Docker, Kubernetes, Python, React | Container Sandbox, Remote Code Execution, Software Engineer | Container Sandbox, Docker, Kubernetes, Python, React, Remote Code Execution, Software Engineer |
| `proj_0007` | **Low-Latency Micro-Ledger** | Docker, PostgreSQL, Rust | Cryptographic Proofs, Software Engineer | Cryptographic Proofs, Docker, PostgreSQL, Rust, Software Engineer |
| `proj_0008` | **Microservice Telemetry Mesh** | Docker, Go, PostgreSQL, Prometheus | Microservices, Observability, Software Engineer, Telemetry | Docker, Go, Microservices, Observability, PostgreSQL, Prometheus, Software Engineer, Telemetry |
| `proj_0009` | **Realtime Collaborative IDE** | Node.js, React, TypeScript, WebSockets | Operational Transformation, Software Engineer | Node.js, Operational Transformation, React, Software Engineer, TypeScript, WebSockets |
| `proj_0010` | **Cloud Native Compiler Platform** | Docker, Kubernetes, Python, React | Container Sandbox, Remote Code Execution, Software Engineer | Container Sandbox, Docker, Kubernetes, Python, React, Remote Code Execution, Software Engineer |
| `proj_0011` | **Peer-to-Peer Notes Sharing Network** | MongoDB, Node.js, React | Full Stack Developer | Full Stack Developer, MongoDB, Node.js, React |
| `proj_0012` | **Campus Smart Resource Portal** | Express.js, MongoDB, Node.js, React | Full Stack Developer | Express.js, Full Stack Developer, MongoDB, Node.js, React |
| `proj_0013` | **Peer-to-Peer Notes Sharing Network** | MongoDB, Node.js, React | Full Stack Developer | Full Stack Developer, MongoDB, Node.js, React |
| `proj_0014` | **Financial Fraud Detector** | Pandas, Python, SQL, Scikit-Learn | Data Scientist | Data Scientist, Pandas, Python, SQL, Scikit-Learn |
| `proj_0015` | **Automated Medical Image Classifier** | FastAPI, OpenCV, PyTorch, Python | Data Scientist | Data Scientist, FastAPI, OpenCV, PyTorch, Python |

## 6. Error & Boundary Case Analysis
- **Short/Self-Contained Descriptions**: 61 projects had 0 extracted skills because their explicit tech stack already covered all concepts mentioned in 1-sentence descriptions.
- **Multi-Word Boundaries**: Phrases such as *AutoCAD Civil 3D* and *Remote Code Execution* successfully matched as single tokens rather than fragmenting into *AutoCAD* or *Remote*.
- **Single-Letter Safety**: Single-letter skills like *R* and *C* were strictly matched via uppercase word boundaries (`\bR\b`), avoiding false positives across general English words.

## 7. Limitations & Future Improvements
- **Current Limitation**: Synonym matching is strictly lexicon-based (e.g. *Postgres* vs *PostgreSQL* requires explicit alias mapping).
- **Future Improvement**: Incorporate dense vector embeddings (e.g. Sentence-BERT) in Phase 7 to capture semantic similarity beyond exact phrase matching.
