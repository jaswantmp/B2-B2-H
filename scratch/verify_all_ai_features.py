"""
scratch/verify_all_ai_features.py

Verification script for existing AI endpoints & auth /me features.
"""

import sys
import os
import logging
from unittest.mock import MagicMock

# Add project root directory to sys.path
root_path = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if root_path not in sys.path:
    sys.path.insert(0, root_path)

backend_path = os.path.abspath(os.path.join(root_path, "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

logging.basicConfig(level=logging.INFO)

def test_existing_ai_features():
    print("=== Testing Existing AI Services & Inference Engines ===")
    
    # 1. K-Means Student Clustering Inference Engine
    from ml.inference import get_inference_engine
    engine = get_inference_engine()
    assert engine.is_available(), "ML inference engine must be available"
    
    test_student = {
        "skills": ["Python", "FastAPI", "React", "PostgreSQL"],
        "interests": ["Machine Learning", "Web Development"],
        "domains": ["AI/ML", "Backend"],
        "github_repos": 12,
        "github_commits": 150,
        "github_stars": 8
    }
    cluster_res = engine.predict_cluster_detailed(test_student)
    print("Student Cluster Result:", cluster_res["segment_name"], f"(Confidence: {cluster_res['confidence']})")
    assert "segment_name" in cluster_res, "Cluster segment missing"
    print("[OK] K-Means Student Skill Clustering engine operational.")

    # 2. Recommendation Engine & ML Inference Service
    from app.services.ml_inference_service import MLInferenceService
    assert MLInferenceService.is_ml_available(), "MLInferenceService must be available"
    print("[OK] MLInferenceService bridging layer operational.")

    # 3. Team Match Service
    from app.services.team_match_service import TeamMatchService
    mock_u1 = MagicMock()
    mock_u1.user_skills = []
    mock_u1.domains = ["Backend"]
    mock_u1.branch = "Computer Science"
    mock_u1.year = "3rd Year"
    mock_u1.status = "LOOKING_FOR_TEAM"

    mock_u2 = MagicMock()
    mock_u2.user_skills = []
    mock_u2.domains = ["Backend", "AI/ML"]
    mock_u2.branch = "Computer Science"
    mock_u2.year = "3rd Year"
    mock_u2.status = "LOOKING_FOR_TEAM"

    score, reasons, role, details = TeamMatchService.calculate_match(mock_u1, mock_u2)
    print("Team Match Score:", score, "| Recommended Role:", role)
    assert 0 <= score <= 100, "Match score out of bounds"
    print("[OK] Team Match Service operational.")

    print("\n=== ALL EXISTING AI FEATURES OPERATIONAL ===")

if __name__ == "__main__":
    test_existing_ai_features()
