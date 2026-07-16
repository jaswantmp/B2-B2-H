#backend/app/services/gemini_service.py

from google import genai
from google.genai import types
from google.genai.errors import ClientError
from dotenv import load_dotenv
import os
import logging
from app.schemas.ai import ProjectIdeaResponse

load_dotenv()

logger = logging.getLogger(__name__)

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

class GeminiQuotaExceededException(Exception):
    pass

def generate_project_idea(domain: str, difficulty: str) -> ProjectIdeaResponse:
    prompt = f"""
    Generate a hackathon project idea.

    Domain: {domain}
    Difficulty: {difficulty}
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                response_schema=ProjectIdeaResponse,
            )
        )
        return ProjectIdeaResponse.model_validate_json(response.text)
    except ClientError as e:
        if e.code == 429:
            logger.error(f"Gemini API quota exceeded (HTTP 429): {str(e)}")
            raise GeminiQuotaExceededException("Gemini API quota exceeded.") from e
        logger.error(f"Gemini API client error: {str(e)}")
        raise e
    except Exception as e:
        logger.error(f"Gemini API general error: {str(e)}")
        raise e



import logging
from typing import Optional

logger = logging.getLogger(__name__)

def generate_match_explanation(
    user_name: str,
    user_skills: list[str],
    candidate_name: str,
    candidate_skills: list[str],
    compatibility_score: int
) -> Optional[str]:
    """
    Use Gemini to generate a concise team matching explanation.
    """
    prompt = f"""
    Explain why these two builders are a good hackathon match.

    User: {user_name}
    Skills: {user_skills}

    Candidate: {candidate_name}
    Skills: {candidate_skills}

    Compatibility Score: {compatibility_score}%

    Describe:
    1. Strengths
    2. Collaboration advantages
    3. Possible skill gaps

    Keep the response under 100 words.
    """

    try:
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt
        )
        explanation = response.text.strip()
        logger.info(f"Successfully generated match explanation for user {user_name} and candidate {candidate_name}")
        return explanation
    except Exception as e:
        logger.error(f"Failed to generate match explanation for user {user_name} and candidate {candidate_name}: {str(e)}", exc_info=True)
        return None
