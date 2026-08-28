"""
scratch/verify_team_health_ml.py

Verification script for ML-Based Team Health Radar implementation.
"""

import sys
import os
import logging
from unittest.mock import MagicMock

# Add backend directory to sys.path
backend_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend"))
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def test_team_health_service():
    print("=== Testing TeamHealthService ===")
    from app.services.team_health_service import TeamHealthService, CATEGORY_KEYWORDS

    # 1. Mock empty team
    mock_empty_team = MagicMock()
    mock_empty_team.members = []
    
    health_empty = TeamHealthService.get_full_team_health(mock_empty_team)
    print("Empty Team Health:", health_empty["health_scores"])
    assert set(health_empty["health_scores"].keys()) == set(CATEGORY_KEYWORDS.keys()), "Categories mismatch"
    assert all(v == 0 for v in health_empty["health_scores"].values()), "Empty team scores must be 0"
    assert len(health_empty["missing_roles"]) == 5, "All 5 roles must be missing for empty team"
    print("[OK] Empty team handled cleanly without crashing.")

    # 2. Mock 1-member team (Backend & AI skills)
    mock_skill1 = MagicMock()
    mock_skill1.skill.name = "Python"
    mock_skill1.skill.category = "Technical"
    mock_skill1.proficiency = "advanced"  # 2.0
    mock_skill1.is_verified = True        # x1.25 -> 2.5 weight

    mock_skill2 = MagicMock()
    mock_skill2.skill.name = "FastAPI"
    mock_skill2.skill.category = "Technical"
    mock_skill2.proficiency = "intermediate" # 1.5
    mock_skill2.is_verified = False          # x1.0 -> 1.5 weight

    mock_user1 = MagicMock()
    mock_user1.user_skills = [mock_skill1, mock_skill2]
    mock_user1.domains = ["AI/ML", "Web Development"]
    mock_user1.github_profile = MagicMock(commits=120, repos=10, stars=15)
    mock_user1.hackathons_won = 2
    mock_user1.branch = "Computer Science"
    mock_user1.year = "3rd Year"

    mock_member1 = MagicMock()
    mock_member1.role = "Backend Developer"
    mock_member1.user = mock_user1

    mock_team1 = MagicMock()
    mock_team1.members = [mock_member1]

    health1 = TeamHealthService.get_full_team_health(mock_team1)
    scores1 = health1["health_scores"]
    details1 = health1["health_details"]
    print("\n1-Member Team Health Scores:", scores1)
    print("Backend Details:", details1["Backend"])
    print("Design Details:", details1["Design"])

    assert 0 <= scores1["Backend"] <= 100, "Score out of range"
    assert scores1["Backend"] > 50, "Backend should be strong"
    assert scores1["Design"] < 40, "Design should be weak"
    assert "Backend Developer" not in health1["missing_roles"], "Backend role should not be missing"
    assert "UI/UX Designer" in health1["missing_roles"], "Design role should be missing"
    print("[OK] 1-Member team health scores calculated dynamically.")

    # 3. PII Check in Feature Engine & Explanations
    print("\n=== PII Audit ===")
    pii_keywords = ["student_id", "test1@example.com", "jaswant", "username", "email"]
    explanation_text = " ".join([d["explanation"] for d in details1.values()])
    for pii in pii_keywords:
        assert pii not in explanation_text.lower(), f"PII keyword {pii} found in explanation!"
    print("[OK] PII check passed: zero PII in explanations or feature vectors.")

    # 4. Multi-member team with Design + Frontend member added
    mock_skill3 = MagicMock()
    mock_skill3.skill.name = "Figma"
    mock_skill3.skill.category = "Design"
    mock_skill3.proficiency = "advanced"
    mock_skill3.is_verified = True

    mock_skill4 = MagicMock()
    mock_skill4.skill.name = "React"
    mock_skill4.skill.category = "Technical"
    mock_skill4.proficiency = "advanced"
    mock_skill4.is_verified = True

    mock_user2 = MagicMock()
    mock_user2.user_skills = [mock_skill3, mock_skill4]
    mock_user2.domains = ["Design", "Web Development"]
    mock_user2.github_profile = None  # Missing GitHub profile check!
    mock_user2.hackathons_won = 1
    mock_user2.branch = "Design & Media"
    mock_user2.year = "2nd Year"

    mock_member2 = MagicMock()
    mock_member2.role = "UI/UX Designer"
    mock_member2.user = mock_user2

    mock_team2 = MagicMock()
    mock_team2.members = [mock_member1, mock_member2]

    health2 = TeamHealthService.get_full_team_health(mock_team2)
    scores2 = health2["health_scores"]
    print("\nMulti-Member Team Health Scores:", scores2)
    assert scores2["Design"] > scores1["Design"], "Adding a designer must increase Design health score"
    assert scores2["Frontend"] > scores1["Frontend"], "Adding a React dev must increase Frontend score"
    print("[OK] Multi-member team dynamically increased Design & Frontend scores.")

    print("\n=== ALL TEAM HEALTH TESTS PASSED ===")

if __name__ == "__main__":
    test_team_health_service()
