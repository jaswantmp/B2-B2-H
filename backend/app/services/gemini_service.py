#backend/app/services/gemini_service.py

from google import genai
from google.genai import types
from dotenv import load_dotenv
import os
from app.schemas.ai import ProjectIdeaResponse

load_dotenv()

client = genai.Client(
    api_key=os.getenv("GEMINI_API_KEY")
)

def generate_project_idea(domain: str, difficulty: str) -> ProjectIdeaResponse:
    prompt = f"""
    Generate a hackathon project idea.

    Domain: {domain}
    Difficulty: {difficulty}
    """

    response = client.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=ProjectIdeaResponse,
        )
    )

    return ProjectIdeaResponse.model_validate_json(response.text)