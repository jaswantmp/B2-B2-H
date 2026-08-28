"""
backend/tests/test_ml_integration.py

Comprehensive Integration Tests for ML Recommendation & Team Matching.

ACADEMIC DISCLAIMER:
The compatibility targets used to train/evaluate these models are synthetic experimental targets
and do not represent real historical team outcomes.
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend path and project root are in sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

project_root = os.path.abspath(os.path.join(backend_path, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.inference import get_inference_engine, MLInferenceEngine
from app.services.ml_inference_service import MLInferenceService
from app.schemas.team_match import TeamMatchCandidate


class TestMLInferenceEngine(unittest.TestCase):

    def test_00_backend_runtime_import_path(self):
        """Verify ml.inference is importable when initialized from backend context."""
        import importlib
        ml_mod = importlib.import_module("ml.inference")
        self.assertTrue(hasattr(ml_mod, "get_inference_engine"))
        self.assertTrue(hasattr(ml_mod, "MLInferenceEngine"))

    def test_01_engine_loading_and_prediction(self):
        """A. ML Inference Test: Verify models load and single prediction works."""
        engine = get_inference_engine()
        self.assertTrue(engine.is_available(), "ML Engine should be available and load models.")

        sample_features = {
            "tfidf_similarity": 0.20,
            "student_project_text_similarity": 0.15,
            "skill_overlap_count": 2,
            "skill_overlap_ratio": 0.50,
            "required_skill_count": 4,
            "matched_skill_count": 2,
            "interest_overlap_count": 1,
            "interest_overlap_ratio": 0.33,
            "domain_match": 1,
            "domain_overlap_count": 1,
            "student_project_count": 2,
            "hackathons_participated": 2,
            "hackathons_won": 1,
            "github_repos": 8,
            "github_commits": 120,
            "github_stars": 5,
            "profile_completion": 90,
            "student_branch": "Computer Science",
            "student_year": "3rd Year",
            "project_technology_count": 4,
            "project_domain": "Artificial Intelligence",
            "project_role": "AI Engineer",
            "project_description_length": 150
        }

        res = engine.predict_pair(sample_features)
        self.assertIn("prob_good_fit", res)
        self.assertIn("pred_compat_score", res)
        self.assertIn("ml_final_score", res)
        self.assertIn("signals", res)
        self.assertIn("model_version", res)

        self.assertGreaterEqual(res["prob_good_fit"], 0.0)
        self.assertLessEqual(res["prob_good_fit"], 1.0)
        self.assertIsInstance(res["ml_final_score"], float)

    def test_02_cluster_prediction(self):
        """Verify K-Means student cluster prediction."""
        engine = get_inference_engine()
        profile = {
            "skills": ["python", "fastapi", "react"],
            "interests": ["ai", "web3"],
            "domains": ["artificial intelligence"],
            "skill_count": 3,
            "interest_count": 2,
            "domain_count": 1,
            "project_count": 2,
            "project_technology_count": 5,
            "hackathons_participated": 3,
            "hackathons_won": 1,
            "github_repos": 10,
            "github_commits": 200,
            "github_stars": 12,
            "github_followers": 5,
            "profile_completion": 95
        }
        res = engine.predict_cluster(profile)
        self.assertIn("cluster_id", res)
        self.assertIn("cluster_segment", res)
        self.assertIn(res["cluster_id"], [0, 1, 2, 3])


class TestMLInferenceService(unittest.TestCase):

    def setUp(self):
        # Mock User 1 (Requesting User)
        self.user = MagicMock()
        self.user.id = "user_001"
        self.user.name = "Aarav Sharma"
        self.user.bio = "Passionate full-stack & AI developer."
        self.user.branch = "Computer Science"
        self.user.year = "3rd Year"
        self.user.domains = ["Artificial Intelligence", "Web Development"]
        self.user.interests = ["AI", "Open Source"]
        self.user.hackathons_participated = 2
        self.user.hackathons_won = 1
        self.user.github_stats = {"repos": 10, "commits": 150, "stars": 8}
        self.user.profile_completion = 90

        s1 = MagicMock(); s1.skill.name = "Python"
        s2 = MagicMock(); s2.skill.name = "React"
        s3 = MagicMock(); s3.skill.name = "FastAPI"
        self.user.user_skills = [s1, s2, s3]

        # Mock Candidate
        self.candidate = MagicMock()
        self.candidate.id = "user_002"
        self.candidate.name = "Ananya Iyer"
        self.candidate.bio = "Backend engineer specializing in Python and PostgreSQL."
        self.candidate.branch = "Computer Science"
        self.candidate.year = "3rd Year"
        self.candidate.domains = ["Backend Systems"]
        self.candidate.interests = ["AI", "Database Design"]
        self.candidate.hackathons_participated = 1
        self.candidate.hackathons_won = 0
        self.candidate.github_stats = {"repos": 6, "commits": 80, "stars": 3}
        self.candidate.profile_completion = 85

        cs1 = MagicMock(); cs1.skill.name = "Python"
        cs2 = MagicMock(); cs2.skill.name = "PostgreSQL"
        self.candidate.user_skills = [cs1, cs2]

    def test_01_backend_service_prediction(self):
        """B. Backend ML Service Test: Predict candidate match using mock User objects."""
        res = MLInferenceService.predict_candidate_match(self.user, self.candidate, "Backend Developer")
        self.assertTrue(res.get("ml_available"))
        self.assertIn("ml_score", res)
        self.assertIn("probability_good_fit", res)
        self.assertIn("predicted_compatibility", res)
        self.assertIn("cluster_segment", res)

    def test_02_missing_optional_info_handling(self):
        """Verify incomplete profile information does not crash prediction."""
        incomplete_user = MagicMock()
        incomplete_user.id = "user_003"
        incomplete_user.name = "Minimal User"
        incomplete_user.bio = None
        incomplete_user.branch = None
        incomplete_user.year = None
        incomplete_user.domains = None
        incomplete_user.interests = None
        incomplete_user.user_skills = []
        incomplete_user.github_stats = None

        res = MLInferenceService.predict_candidate_match(incomplete_user, self.candidate, "Developer")
        self.assertTrue(res.get("ml_available"))
        self.assertIsInstance(res.get("ml_score"), float)


class TestFallbackAndSchema(unittest.TestCase):

    def test_01_candidate_schema_compatibility(self):
        """E. Regression Test: Verify TeamMatchCandidate schema backward compatibility."""
        cand = TeamMatchCandidate(
            user_id="user_123",
            id="user_123",
            name="Test Builder",
            compatibility_score=85,
            reasons=["Shared Python skill"],
            recommended_role="Backend Developer",
            ml_score=82.5,
            probability_good_fit=0.88,
            predicted_compatibility=80.0,
            cluster_segment="Applied Project Specialist",
            model_version="GradientBoosting-v1.0"
        )
        self.assertEqual(cand.compatibility_score, 85)
        self.assertEqual(cand.ml_score, 82.5)

    def test_02_fallback_when_ml_fails(self):
        """D. Fallback Test: Verify system gracefully falls back if ML fails."""
        with patch.object(MLInferenceEngine, "is_available", return_value=False):
            res = MLInferenceService.predict_candidate_match(MagicMock(), MagicMock(), "Developer")
            self.assertFalse(res.get("ml_available"))


if __name__ == "__main__":
    unittest.main()
