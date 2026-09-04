"""
backend/tests/test_team_health_ml.py

Unit and Integration Tests for Team Health Radar ML Conversion (team_health_v1).

SCIENTIFIC DISCLOSURE:
"This model does not establish real-world team success prediction because reliable
historical team outcome labels are currently unavailable. The current model learns
and generalizes an engineered team-health function. Evaluation metrics measure
fidelity to that derived target and do not establish real-world team success prediction."
"""

import os
import sys
import unittest
from unittest.mock import MagicMock, patch

# Ensure backend and ml paths are accessible
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

project_root = os.path.abspath(os.path.join(backend_path, ".."))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from ml.inference import get_inference_engine, TEAM_HEALTH_FEATURE_COLUMNS
from app.services.team_health_service import TeamHealthService
from app.models.team import Team, TeamMember


class TestTeamHealthML(unittest.TestCase):

    def setUp(self):
        self.engine = get_inference_engine()

    def test_01_model_artifact_loads(self):
        """1. Verify model artifact exists and loads into inference engine."""
        self.assertTrue(self.engine.is_available(), "ML Inference Engine should load successfully.")
        self.assertTrue(
            self.engine.is_team_health_model_available(),
            "Team Health model (team_health_model.pkl) should be loaded and available."
        )
        self.assertEqual(self.engine.team_health_model_version, "team_health_v1")

    def test_02_feature_contract_integrity(self):
        """2. Verify explicit 18-feature contract matches requirements."""
        self.assertEqual(len(TEAM_HEALTH_FEATURE_COLUMNS), 18)
        expected_features = [
            "team_size",
            "role_assigned_ratio",
            "multi_contributor_categories",
            "unique_skill_count",
            "functional_category_entropy",
            "missing_category_count",
            "core_skill_redundancy",
            "avg_skill_level",
            "mean_pairwise_compatibility",
            "min_pairwise_compatibility",
            "compatibility_std_dev",
            "cluster_diversity_count",
            "branch_diversity_count",
            "experience_range_years",
            "domain_interest_jaccard_mean",
            "log_team_total_commits",
            "mean_member_projects",
            "github_profile_active_ratio"
        ]
        self.assertEqual(TEAM_HEALTH_FEATURE_COLUMNS, expected_features)

    def test_03_inference_score_within_expected_range(self):
        """3. Verify ML inference outputs continuous score in valid [35, 99] range."""
        sample_features = {
            "team_size": 4,
            "role_assigned_ratio": 1.0,
            "multi_contributor_categories": 3,
            "unique_skill_count": 14,
            "functional_category_entropy": 0.88,
            "missing_category_count": 0,
            "core_skill_redundancy": 1.6,
            "avg_skill_level": 1.5,
            "mean_pairwise_compatibility": 84.5,
            "min_pairwise_compatibility": 78.0,
            "compatibility_std_dev": 4.2,
            "cluster_diversity_count": 3,
            "branch_diversity_count": 2,
            "experience_range_years": 1,
            "domain_interest_jaccard_mean": 0.40,
            "log_team_total_commits": 6.8,
            "mean_member_projects": 3.5,
            "github_profile_active_ratio": 0.75
        }

        score = self.engine.predict_team_health_score(sample_features)
        self.assertIsInstance(score, float)
        self.assertGreaterEqual(score, 35.0)
        self.assertLessEqual(score, 99.0)

    def test_04_no_pii_in_features(self):
        """4. Verify feature contract contains strictly non-PII attributes."""
        pii_terms = ["name", "email", "id", "student_id", "user_id", "username", "token", "avatar"]
        for col in TEAM_HEALTH_FEATURE_COLUMNS:
            for pii in pii_terms:
                if col == "team_size":
                    continue
                self.assertFalse(col == pii, f"PII term '{pii}' found as feature '{col}'!")

    def test_05_no_target_leakage(self):
        """5. Verify target health score is not an input feature."""
        leakage_terms = ["health_score", "ml_health_score", "overall_health", "score"]
        for col in TEAM_HEALTH_FEATURE_COLUMNS:
            self.assertNotIn(col, leakage_terms, f"Target leakage feature '{col}' detected!")

    def test_06_team_health_service_inference(self):
        """6. Verify TeamHealthService.get_full_team_health produces ML score and details."""
        # Create mock team with members
        mock_team = MagicMock(spec=Team)
        mock_team.id = "team-test-01"

        # Member 1: Frontend
        m1 = MagicMock(spec=TeamMember)
        m1.id = "m1"
        m1.role = "Frontend Engineer"
        u1 = MagicMock()
        u1.id = "u1"
        u1.branch = "Computer Science"
        u1.year = "3rd Year"
        u1.domains = ["web development", "ui design"]
        u1.interests = ["frontend", "react"]
        u1.projects = [MagicMock()]
        u1.github_profile = MagicMock(commits=120, repos=5, stars=2)
        sk1 = MagicMock()
        sk1.skill = MagicMock(name="React")
        sk1.proficiency = "advanced"
        sk1.is_verified = True
        u1.user_skills = [sk1]
        m1.user = u1

        # Member 2: Backend
        m2 = MagicMock(spec=TeamMember)
        m2.id = "m2"
        m2.role = "Backend Engineer"
        u2 = MagicMock()
        u2.id = "u2"
        u2.branch = "Information Technology"
        u2.year = "3rd Year"
        u2.domains = ["backend", "cloud"]
        u2.interests = ["fastapi", "python"]
        u2.projects = [MagicMock(), MagicMock()]
        u2.github_profile = MagicMock(commits=200, repos=8, stars=10)
        sk2 = MagicMock()
        sk2.skill = MagicMock(name="FastAPI")
        sk2.proficiency = "advanced"
        sk2.is_verified = True
        u2.user_skills = [sk2]
        m2.user = u2

        mock_team.members = [m1, m2]

        result = TeamHealthService.get_full_team_health(mock_team)

        self.assertIn("health_scores", result)
        self.assertIn("health_score", result)
        self.assertIn("ml_health_score", result)
        self.assertIn("health_status", result)
        self.assertIn("is_ml_powered", result)
        self.assertIn("model_version", result)
        self.assertIn("missing_roles", result)
        self.assertIn("explainability", result)

        self.assertTrue(result["is_ml_powered"], "Team health should be ML powered when model is available.")
        self.assertEqual(result["model_version"], "team_health_v1")
        self.assertIn(result["health_status"], ["Healthy", "Moderate", "At Risk"])

        # Radar dimensions remain factual
        for cat in ["Frontend", "Backend", "AI/ML", "Design", "Product"]:
            self.assertIn(cat, result["health_scores"])
            self.assertGreaterEqual(result["health_scores"][cat], 0)
            self.assertLessEqual(result["health_scores"][cat], 100)

        # Missing roles flagged for low categories (e.g. Design = 0)
        self.assertIn("UI/UX Designer", result["missing_roles"])

    def test_07_fallback_when_model_unavailable(self):
        """7. Verify graceful deterministic fallback when ML model raises an exception."""
        mock_team = MagicMock(spec=Team)
        mock_team.id = "team-fallback"
        m1 = MagicMock(spec=TeamMember)
        m1.id = "m1"
        m1.role = "Developer"
        u1 = MagicMock()
        u1.id = "u1"
        u1.branch = "CS"
        u1.year = "2"
        u1.domains = ["ai"]
        u1.interests = []
        u1.projects = []
        u1.github_profile = None
        u1.github_stats = {}
        u1.user_skills = []
        m1.user = u1
        mock_team.members = [m1]

        # Patch predict_team_health_score to raise an exception
        with patch.object(self.engine, "predict_team_health_score", side_effect=RuntimeError("Simulated failure")):
            result = TeamHealthService.get_full_team_health(mock_team)

            self.assertFalse(result["is_ml_powered"], "is_ml_powered should be false on failure.")
            self.assertIsInstance(result["health_score"], int)
            self.assertIsNone(result["ml_health_score"])
            self.assertIn("Frontend", result["health_scores"])

    def test_08_empty_team_handling(self):
        """8. Verify empty team returns structured zero-coverage response without error."""
        mock_team = MagicMock(spec=Team)
        mock_team.members = []

        result = TeamHealthService.get_full_team_health(mock_team)
        self.assertEqual(result["health_score"], 0)
        self.assertEqual(result["health_status"], "At Risk")
        self.assertFalse(result["is_ml_powered"])
        self.assertEqual(len(result["missing_roles"]), 5)
        for cat in ["Frontend", "Backend", "AI/ML", "Design", "Product"]:
            self.assertEqual(result["health_scores"][cat], 0)


if __name__ == "__main__":
    unittest.main()
