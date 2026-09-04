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

    def test_03_hackathon_recommender_prediction(self):
        """Verify Hackathon Recommendation ML model loads and scores candidates."""
        engine = get_inference_engine()
        self.assertTrue(engine.is_hackathon_model_available(), "Hackathon recommendation model should be loaded.")

        sample_features = [{
            "tfidf_similarity": 0.35,
            "skill_overlap_count": 3,
            "skill_overlap_ratio": 0.6,
            "required_skill_count": 5,
            "matched_skill_count": 3,
            "verified_skill_count": 2,
            "domain_match": 1,
            "domain_overlap_count": 1,
            "interest_overlap_count": 1,
            "branch_alignment": 1,
            "year_suitability": 1.0,
            "student_branch": "Computer Science",
            "student_year": "3rd Year",
            "student_project_count": 2,
            "hackathons_participated": 2,
            "hackathons_won": 1,
            "github_repos": 5,
            "github_commits": 50,
            "github_stars": 3,
            "profile_completion": 0.85,
            "hackathon_track_count": 3,
            "hackathon_tag_count": 4,
            "hackathon_description_length": 250,
            "hackathon_team_size_max": 4
        }]

        results = engine.predict_hackathon_scores(sample_features)
        self.assertEqual(len(results), 1)
        r = results[0]
        self.assertIn("score", r)
        self.assertIn("ml_score", r)
        self.assertIn("model_version", r)
        self.assertEqual(r["model_version"], "hackathon_recommender_v1")
        self.assertTrue(r["is_ml_powered"])
        self.assertGreaterEqual(r["score"], 0)
        self.assertLessEqual(r["score"], 100)


class TestHackathonRecommendationService(unittest.TestCase):

    def test_01_service_ml_recommendations(self):
        """Verify HackathonRecommendationService integrates with the ML model and returns breakdown."""
        from app.services.hackathon_recommendation_service import HackathonRecommendationService

        mock_user = MagicMock()
        mock_user.id = "test_user_ml"
        mock_user.name = "Test ML User"
        mock_user.bio = "Passionate fullstack and AI developer building cool tools"
        mock_user.branch = "Computer Science"
        mock_user.year = "3rd Year"
        mock_user.domains = ["Artificial Intelligence", "Web Development"]
        mock_user.interests = ["AI", "Open Source"]
        mock_user.hackathons_won = 1

        mock_skill = MagicMock()
        mock_skill.name = "Python"
        mock_user_skill = MagicMock()
        mock_user_skill.skill = mock_skill
        mock_user_skill.is_verified = True
        mock_user.user_skills = [mock_user_skill]
        mock_user.github_profile = None

        mock_hackathon = MagicMock()
        mock_hackathon.id = "hk_ml_1"
        mock_hackathon.title = "AI & Cloud Innovation Hackathon"
        mock_hackathon.description = "Build intelligent AI apps and agents using Python and cloud tools"
        mock_hackathon.tracks = ["Artificial Intelligence", "Cloud"]
        mock_hackathon.tags = ["python", "ai", "cloud"]
        mock_hackathon.date = "2026-10-01"
        mock_hackathon.end_date = "2026-10-03"
        mock_hackathon.team_size = "2-4"
        mock_hackathon.registrations = []

        mock_db = MagicMock()
        mock_query = MagicMock()
        mock_db.query.return_value = mock_query
        mock_query.options.return_value = mock_query
        mock_query.filter.return_value = mock_query
        mock_query.all.return_value = [mock_hackathon]
        mock_query.count.return_value = 2

        result = HackathonRecommendationService.get_recommendations(
            db=mock_db,
            user=mock_user
        )

        self.assertEqual(result["total_hackathons"], 1)
        self.assertEqual(result["recommended_count"], 1)
        rec = result["recommendations"][0]
        self.assertEqual(rec["model_version"], "hackathon_recommender_v1")
        self.assertTrue(rec["is_ml_powered"])
        self.assertGreaterEqual(rec["score"], 0)
        # Verify backward compatibility breakdown keys
        self.assertIn("skills", rec["breakdown"])
        self.assertIn("domains", rec["breakdown"])
        self.assertIn("branch", rec["breakdown"])
        self.assertIn("year", rec["breakdown"])
        self.assertIn("ml_score", rec["breakdown"])
        self.assertIn("rule_baseline_score", rec["breakdown"])


class TestTeamGeneratorML(unittest.TestCase):

    def test_01_team_generator_models_loaded(self):
        """Verify Team Generator pairwise and team quality models are loaded and available."""
        engine = get_inference_engine()
        self.assertTrue(engine.is_team_generator_model_available(), "Team generator models should be loaded.")
        self.assertEqual(engine.team_generator_model_version, "team_generator_v1")

    def test_02_predict_team_pair_and_quality(self):
        """Verify pairwise and team quality predictions return valid continuous scores."""
        engine = get_inference_engine()
        sample_pair = [{
            "skill_overlap_count": 2,
            "skill_overlap_ratio": 0.4,
            "complementary_skill_count": 4,
            "domain_match": 1,
            "domain_overlap_count": 1,
            "interest_overlap_count": 1,
            "tfidf_similarity": 0.35,
            "branch_compatibility": 1.0,
            "year_difference": 0,
            "cluster_synergy": 1.0,
            "github_commits_total": 120,
            "github_repos_total": 10,
            "project_count_total": 4,
            "experience_balance": 1,
            "profile_completion_avg": 0.85
        }]

        pair_scores = engine.predict_team_pair_scores(sample_pair)
        self.assertEqual(len(pair_scores), 1)
        self.assertGreaterEqual(pair_scores[0], 40.0)
        self.assertLessEqual(pair_scores[0], 99.0)

        sample_team = [{
            "team_size": 4,
            "avg_pair_compatibility": 82.5,
            "min_pair_compatibility": 74.0,
            "pair_compatibility_std": 3.2,
            "unique_skills_count": 12,
            "category_coverage_count": 4,
            "category_balance_entropy": 1.85,
            "domain_diversity_count": 3,
            "cluster_diversity_count": 3,
            "branch_diversity_count": 2,
            "year_diversity_count": 2,
            "total_github_commits": 350,
            "total_projects": 8,
            "avg_profile_completion": 0.90,
            "role_specialization_score": 1.0
        }]

        team_scores = engine.predict_team_quality_scores(sample_team)
        self.assertEqual(len(team_scores), 1)
        self.assertGreaterEqual(team_scores[0], 40.0)
        self.assertLessEqual(team_scores[0], 99.0)

    def test_03_team_generator_service_integration(self):
        """Verify TeamGeneratorService performs constrained optimization and dynamic role assignment."""
        from app.database import SessionLocal
        from app.services.team_generator_service import TeamGeneratorService

        db = SessionLocal()
        try:
            res = TeamGeneratorService.generate_team(
                db=db,
                idea="Smart campus security app using facial recognition and IoT sensors",
                team_size=3,
                must_have_skills=["Python", "React"]
            )
            self.assertEqual(res["team_size"], 3)
            self.assertEqual(len(res["suggestedBuilders"]), 3)
            self.assertEqual(len(res["roles"]), 3)
            self.assertEqual(res["model_version"], "team_generator_v1")
            self.assertTrue(res["is_ml_powered"])
            self.assertGreaterEqual(res["team_quality_score"], 40)
            self.assertLessEqual(res["team_quality_score"], 99)
            self.assertGreater(len(res["strengths"]), 0)

            # Verify each builder has an assigned role and score
            for b in res["suggestedBuilders"]:
                self.assertIn("role", b)
                self.assertIn("score", b)
                self.assertGreaterEqual(b["score"], 40)
        finally:
            db.close()


if __name__ == "__main__":
    unittest.main()
