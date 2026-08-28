"""
ml/inference.py

Lightweight ML Inference Engine for B2B2H Student-Project and Team Matching.

ACADEMIC DISCLAIMER:
The compatibility targets used to train/evaluate these models are synthetic experimental targets
and do not represent real historical team outcomes.
"""

import os
import threading
import logging
try:
    import pandas as pd
    import numpy as np
    import joblib
    HAS_ML_DEPS = True
except ImportError:
    pd = None
    np = None
    joblib = None
    HAS_ML_DEPS = False

logger = logging.getLogger(__name__)

# Cluster segment metadata lookup
CLUSTER_SEGMENTS = {
    0: "Applied Project Specialist",
    1: "Hackathon Champion",
    2: "High Open-Source Contributor",
    3: "Emerging Generalist Builder"
}

# The 23 feature columns required by trained classifier & regressor pipelines
FEATURE_COLUMNS = [
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


class MLInferenceEngine:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(MLInferenceEngine, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self):
        if self._initialized:
            return

        self.models_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")
        self.clf_pipeline = None
        self.reg_pipeline = None
        self.kmeans_model = None
        self.kmeans_preprocessor = None

        self.is_loaded = False
        self.load_error = None
        self.model_version = "GradientBoosting-v1.0"

        self._initialized = True

    def load_models(self) -> bool:
        """Lazy load ML models from disk. Thread-safe."""
        if self.is_loaded:
            return True

        with self._lock:
            if self.is_loaded:
                return True

            if not HAS_ML_DEPS:
                self.load_error = "Required ML libraries (pandas, numpy, joblib) are not installed in python environment."
                logger.warning(f"[MLInferenceEngine] {self.load_error}")
                return False

            clf_path = os.path.join(self.models_dir, "gradient_boosting_classifier.pkl")
            reg_path = os.path.join(self.models_dir, "gradient_boosting_regressor.pkl")
            kmeans_path = os.path.join(self.models_dir, "kmeans_student_segmentation.pkl")
            kmeans_prep_path = os.path.join(self.models_dir, "kmeans_preprocessor.pkl")

            missing_files = [p for p in [clf_path, reg_path, kmeans_path, kmeans_prep_path] if not os.path.exists(p)]
            if missing_files:
                self.load_error = f"Missing model file(s): {', '.join(missing_files)}"
                logger.warning(f"[MLInferenceEngine] {self.load_error}")
                return False

            try:
                self.clf_pipeline = joblib.load(clf_path)
                self.reg_pipeline = joblib.load(reg_path)
                self.kmeans_model = joblib.load(kmeans_path)
                self.kmeans_preprocessor = joblib.load(kmeans_prep_path)

                self.is_loaded = True
                self.load_error = None
                logger.info("[MLInferenceEngine] Successfully loaded ML recommendation models & preprocessors.")
                return True
            except Exception as e:
                self.load_error = f"Error loading ML models: {str(e)}"
                logger.error(f"[MLInferenceEngine] {self.load_error}", exc_info=True)
                return False

    def is_available(self) -> bool:
        """Check if models are loaded and available for inference."""
        if not self.is_loaded:
            return self.load_models()
        return True

    def predict_pair(self, feature_dict: dict) -> dict:
        """
        Run prediction for a single pair feature dictionary.
        Returns prediction outputs including prob_good_fit, pred_compat_score, and final_score.
        """
        if not self.is_available():
            raise RuntimeError(f"ML models unavailable: {self.load_error}")

        # Ensure all required 23 columns exist in DataFrame with correct dtypes
        df_row = pd.DataFrame([feature_dict])
        for col in FEATURE_COLUMNS:
            if col not in df_row.columns:
                df_row[col] = 0 if "count" in col or "repos" in col or "commits" in col or "stars" in col else 0.0

        # Enforce column ordering
        df_features = df_row[FEATURE_COLUMNS]

        # 1. Classification prediction: P(Good Fit)
        prob_good_fit = float(np.round(self.clf_pipeline.predict_proba(df_features)[0, 1], 4))

        # 2. Regression prediction: Predicted Compatibility Score
        pred_compat_score = float(np.round(self.reg_pipeline.predict(df_features)[0], 4))

        # 3. Dynamic Feature Calculations for Hybrid Ranking
        tfidf_sim = float(feature_dict.get("tfidf_similarity", 0.0))
        skill_ratio = float(feature_dict.get("skill_overlap_ratio", 0.0))
        domain_match = float(feature_dict.get("domain_match", 0))
        interest_ratio = float(feature_dict.get("interest_overlap_ratio", 0.0))

        domain_align = 0.50 * domain_match + 0.50 * interest_ratio

        # 4. Hybrid Ranking Formula
        ml_final_score = float(np.round(
            0.40 * pred_compat_score +
            0.30 * (prob_good_fit * 100.0) +
            0.15 * (tfidf_sim * 100.0) +
            0.10 * (skill_ratio * 100.0) +
            0.05 * (domain_align * 100.0),
            2
        ))

        # Build feature signals for explanation
        signals = []
        if prob_good_fit >= 0.70:
            signals.append(f"High ML classifier match probability ({prob_good_fit*100:.1f}%)")
        elif prob_good_fit >= 0.40:
            signals.append(f"Moderate ML match probability ({prob_good_fit*100:.1f}%)")

        if pred_compat_score >= 70.0:
            signals.append(f"Strong predicted compatibility score ({pred_compat_score:.1f})")

        if tfidf_sim >= 0.15:
            signals.append(f"High text & profile similarity ({tfidf_sim:.2f})")

        return {
            "prob_good_fit": prob_good_fit,
            "pred_compat_score": pred_compat_score,
            "ml_final_score": ml_final_score,
            "signals": signals,
            "model_version": self.model_version
        }

    def predict_batch(self, feature_dicts: list[dict]) -> list[dict]:
        """
        Run vectorized batch prediction for a list of feature dictionaries.
        Significantly faster than calling predict_pair in a loop.
        """
        if not self.is_available() or not feature_dicts:
            return []

        df_rows = pd.DataFrame(feature_dicts)
        for col in FEATURE_COLUMNS:
            if col not in df_rows.columns:
                df_rows[col] = 0 if "count" in col or "repos" in col or "commits" in col or "stars" in col else 0.0

        df_features = df_rows[FEATURE_COLUMNS]

        # 1. Batch classification & regression predictions
        prob_good_fits = self.clf_pipeline.predict_proba(df_features)[:, 1]
        pred_compat_scores = self.reg_pipeline.predict(df_features)

        results = []
        for i, feature_dict in enumerate(feature_dicts):
            prob_good_fit = float(np.round(prob_good_fits[i], 4))
            pred_compat_score = float(np.round(pred_compat_scores[i], 4))

            tfidf_sim = float(feature_dict.get("tfidf_similarity", 0.0))
            skill_ratio = float(feature_dict.get("skill_overlap_ratio", 0.0))
            domain_match = float(feature_dict.get("domain_match", 0))
            interest_ratio = float(feature_dict.get("interest_overlap_ratio", 0.0))

            domain_align = 0.50 * domain_match + 0.50 * interest_ratio

            ml_final_score = float(np.round(
                0.40 * pred_compat_score +
                0.30 * (prob_good_fit * 100.0) +
                0.15 * (tfidf_sim * 100.0) +
                0.10 * (skill_ratio * 100.0) +
                0.05 * (domain_align * 100.0),
                2
            ))

            results.append({
                "prob_good_fit": prob_good_fit,
                "pred_compat_score": pred_compat_score,
                "ml_final_score": ml_final_score,
                "model_version": self.model_version
            })

        return results

    def predict_cluster_detailed(self, student_profile_dict: dict) -> dict:
        """
        Predict K-Means cluster segment for a student profile with detailed centroid metrics,
        confidence scores, dominant skills/domains, and explainable rationale.
        """
        if not self.is_available():
            return {
                "cluster_id": 3,
                "segment_name": CLUSTER_SEGMENTS[3],
                "confidence": 0.50,
                "centroid_distance": 2.50,
                "dominant_skills": ["JavaScript", "Python", "React"],
                "dominant_domains": ["Web Development"],
                "explanation": "Generalist student profile with balanced foundational software development experience."
            }

        try:
            scaler = self.kmeans_preprocessor["scaler"]
            tfidf = self.kmeans_preprocessor["tfidf"]
            num_cols = self.kmeans_preprocessor["num_cols"]

            # 1. Prepare numerical features (NEVER PII)
            num_vals = [float(student_profile_dict.get(col, 0)) for col in num_cols]
            num_df = pd.DataFrame([num_vals], columns=num_cols)
            num_scaled = scaler.transform(num_df)

            # 2. Prepare text feature
            skills_list = student_profile_dict.get("skills", [])
            interests_list = student_profile_dict.get("interests", [])
            domains_list = student_profile_dict.get("domains", [])

            skills_str = " ".join(skills_list)
            interests_str = " ".join(interests_list)
            domains_str = " ".join(domains_list)
            text_doc = f"{skills_str} {interests_str} {domains_str}".strip()

            text_tfidf = tfidf.transform([text_doc if text_doc else "generalist"]).toarray()

            # 3. Stack combined 42-dimension feature vector X
            X = np.hstack([num_scaled, text_tfidf])

            # 4. Calculate distances to all 4 cluster centroids
            distances = self.kmeans_model.transform(X)[0]
            cluster_id = int(np.argmin(distances))
            centroid_distance = round(float(distances[cluster_id]), 4)

            # 5. Compute normalized confidence score based on centroid distance
            confidence = round(float(1.0 / (1.0 + 0.3 * centroid_distance)), 4)
            confidence = min(0.98, max(0.40, confidence))

            segment_name = CLUSTER_SEGMENTS.get(cluster_id, CLUSTER_SEGMENTS[3])

            # 6. Determine dominant skills & domains for explanation
            cluster_default_skills = {
                0: ["Python", "FastAPI", "React", "PostgreSQL", "Machine Learning"],
                1: ["React", "Node.js", "Python", "UI/UX", "TypeScript"],
                2: ["Git", "Node.js", "Python", "Docker", "TypeScript"],
                3: ["JavaScript", "HTML/CSS", "Python", "React", "Git"]
            }

            cluster_default_domains = {
                0: ["AI/ML", "Web Development", "IoT"],
                1: ["Hackathons", "Rapid Prototyping", "Full-Stack"],
                2: ["Open-Source", "Cloud & DevOps", "Backend"],
                3: ["Web Development", "Software Engineering"]
            }

            user_skills = [s for s in skills_list if s]
            user_domains = [d for d in domains_list if d]

            dominant_skills = user_skills[:3] if len(user_skills) >= 2 else cluster_default_skills.get(cluster_id, cluster_default_skills[3])[:3]
            dominant_domains = user_domains[:2] if user_domains else cluster_default_domains.get(cluster_id, cluster_default_domains[3])[:2]

            skills_formatted = ", ".join(dominant_skills[:3])

            # 7. Generate explainable rationale
            explanations = {
                0: f"Your profile is strongly associated with practical project execution and technical depth, featuring {skills_formatted} as dominant skills.",
                1: f"Your profile exhibits high competitive hackathon participation and rapid full-stack prototyping, driven by {skills_formatted}.",
                2: f"Your profile reflects strong GitHub open-source code contributions, repository activity, and collaborative development with {skills_formatted}.",
                3: f"Your profile represents an emerging generalist builder with foundational software development skills across {skills_formatted}."
            }
            explanation = explanations.get(cluster_id, explanations[3])

            return {
                "cluster_id": cluster_id,
                "segment_name": segment_name,
                "confidence": confidence,
                "centroid_distance": centroid_distance,
                "dominant_skills": dominant_skills,
                "dominant_domains": dominant_domains,
                "explanation": explanation
            }
        except Exception as e:
            logger.warning(f"[MLInferenceEngine] Failed to predict detailed student cluster: {e}", exc_info=True)
            return {
                "cluster_id": 3,
                "segment_name": CLUSTER_SEGMENTS[3],
                "confidence": 0.50,
                "centroid_distance": 2.50,
                "dominant_skills": ["JavaScript", "Python", "React"],
                "dominant_domains": ["Web Development"],
                "explanation": "Generalist student profile with balanced foundational software development experience."
            }

    def predict_cluster(self, student_profile_dict: dict) -> dict:
        """
        Predict K-Means cluster segment for a student profile.
        """
        detailed = self.predict_cluster_detailed(student_profile_dict)
        return {
            "cluster_id": detailed["cluster_id"],
            "cluster_segment": detailed["segment_name"]
        }


# Singleton getter function
def get_inference_engine() -> MLInferenceEngine:
    engine = MLInferenceEngine()
    engine.load_models()
    return engine

