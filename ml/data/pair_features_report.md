# B2B2H Student-Project Pair Feature Dataset Report

## 1. Dataset Summary
- **Total Student-Project Pairs Generated**: `175,000` (Target: `500 × 350 = 175,000`)
- **Unique Student IDs**: `500`
- **Unique Project IDs**: `350`
- **Duplicate Pairs**: `0`
- **Total Missing Values**: `0`

## 2. Feature Overlap & Sparsity Analysis
- **Pairs with Zero Skill Overlap**: `138,067` (78.90% of all pairs)
- **Pairs with Non-Zero Skill Overlap**: `36,933` (21.10%)
- **Pairs with Zero TF-IDF Similarity**: `80,832` (46.19% of all pairs)
- **Pairs with Positive TF-IDF Similarity**: `94,168` (53.81%)

## 3. Numeric Feature Distributions Summary
| Feature Name | Min | Max | Mean | Median |
|---|---|---|---|---|
| `tfidf_similarity` | 0 | 0.5229 | 0.0271 | 0.0126 |
| `student_project_text_similarity` | 0.0 | 0.2791 | 0.0210 | 0.0204 |
| `skill_overlap_count` | 0 | 5 | 0.2610 | 0.0000 |
| `skill_overlap_ratio` | 0.0 | 1.0 | 0.0723 | 0.0000 |
| `required_skill_count` | 2 | 5 | 3.5714 | 4.0000 |
| `matched_skill_count` | 0 | 5 | 0.2610 | 0.0000 |
| `interest_overlap_count` | 0 | 2 | 0.0643 | 0.0000 |
| `interest_overlap_ratio` | 0.0 | 0.6667 | 0.0158 | 0.0000 |
| `domain_overlap_count` | 0 | 2 | 0.0870 | 0.0000 |

## 4. Top 10 Highest TF-IDF Similarity Pairs
| Rank | Student ID | Project ID | TF-IDF Sim | Text Sim | Skill Overlap | Project Role |
|---|---|---|---|---|---|---|
| 1 | `afc2bd90...` | `proj_0266` | `0.5229` | `0.1707` | `4` | `Data Scientist` |
| 2 | `96ebb060...` | `proj_0306` | `0.5031` | `0.1316` | `2` | `Full Stack Developer` |
| 3 | `6188831d...` | `proj_0162` | `0.5009` | `0.2778` | `4` | `DevOps Engineer` |
| 4 | `37921f8e...` | `proj_0288` | `0.5009` | `0.25` | `4` | `ML Engineer` |
| 5 | `6750c492...` | `proj_0287` | `0.4928` | `0.1282` | `3` | `Robotics Engineer` |
| 6 | `b5b19d8a...` | `proj_0287` | `0.4917` | `0.1136` | `2` | `Robotics Engineer` |
| 7 | `96ebb060...` | `proj_0288` | `0.4914` | `0.1892` | `3` | `ML Engineer` |
| 8 | `6af6d70b...` | `proj_0145` | `0.4905` | `0.2381` | `5` | `Bioinformatics Specialist` |
| 9 | `b5b19d8a...` | `proj_0288` | `0.4893` | `0.1905` | `3` | `ML Engineer` |
| 10 | `028835cb...` | `proj_0153` | `0.4852` | `0.2727` | `5` | `Cybersecurity Analyst` |

## 5. Top 10 Highest Skill-Overlap Pairs
| Rank | Student ID | Project ID | Skill Overlap Count | Skill Ratio | TF-IDF Sim | Required Techs |
|---|---|---|---|---|---|---|
| 1 | `c04f993f...` | `proj_0062` | `5` | `1.0` | `0.2423` | `5` |
| 2 | `c04f993f...` | `proj_0067` | `5` | `1.0` | `0.2423` | `5` |
| 3 | `b737c73d...` | `proj_0145` | `5` | `1.0` | `0.4548` | `5` |
| 4 | `68c6c4f0...` | `proj_0062` | `5` | `1.0` | `0.3073` | `5` |
| 5 | `68c6c4f0...` | `proj_0067` | `5` | `1.0` | `0.3073` | `5` |
| 6 | `ae1edce1...` | `proj_0151` | `5` | `1.0` | `0.3851` | `5` |
| 7 | `028835cb...` | `proj_0153` | `5` | `1.0` | `0.4852` | `5` |
| 8 | `221c46a1...` | `proj_0178` | `5` | `1.0` | `0.408` | `5` |
| 9 | `c478ab16...` | `proj_0165` | `5` | `1.0` | `0.2907` | `5` |
| 10 | `a7773a57...` | `proj_0337` | `5` | `1.0` | `0.3902` | `5` |

## 6. Example Pair Records (First 10 Pairs)
### Example Pair 1
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0001`
- **TF-IDF Similarity**: `0.0416` | **Text Similarity**: `0.025`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 2
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0002`
- **TF-IDF Similarity**: `0.0437` | **Text Similarity**: `0.0263`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 3
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0003`
- **TF-IDF Similarity**: `0.0549` | **Text Similarity**: `0.0244`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 4
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0004`
- **TF-IDF Similarity**: `0.0478` | **Text Similarity**: `0.0278`
- **Skill Overlap**: `1` / `3` (Ratio: `0.3333`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 5
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0005`
- **TF-IDF Similarity**: `0.0437` | **Text Similarity**: `0.0263`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 6
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0006`
- **TF-IDF Similarity**: `0.0549` | **Text Similarity**: `0.0244`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 7
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0007`
- **TF-IDF Similarity**: `0.0478` | **Text Similarity**: `0.0278`
- **Skill Overlap**: `1` / `3` (Ratio: `0.3333`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 8
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0008`
- **TF-IDF Similarity**: `0.0416` | **Text Similarity**: `0.025`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 9
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0009`
- **TF-IDF Similarity**: `0.0437` | **Text Similarity**: `0.0263`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`

### Example Pair 10
- **Student ID**: `b4c077d2-148e-42f9-bc80-1515091459a8` | **Project ID**: `proj_0010`
- **TF-IDF Similarity**: `0.0549` | **Text Similarity**: `0.0244`
- **Skill Overlap**: `1` / `4` (Ratio: `0.25`)
- **Interest Overlap**: `0` | **Domain Match**: `0`
- **Student Branch/Year**: `Computer Science Engineering` (2nd Year)
- **Project Role**: `Software Engineer`
