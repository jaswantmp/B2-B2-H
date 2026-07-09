# app/services/ai_service.py
import logging
from app.schemas.ai import ProjectIdeaRequest, ProjectIdeaResponse

logger = logging.getLogger(__name__)

class AIService:
    @classmethod
    async def generate_project_idea(cls, request_data: ProjectIdeaRequest) -> ProjectIdeaResponse:
        """
        Generates a project idea based on the input domain and skills.
        Currently returns mock data, but structured to support future Gemini API integration.
        """
        # Template for future Gemini integration:
        # try:
        #     from google import genai
        #     from google.genai import types
        #     
        #     # The SDK automatically uses the GEMINI_API_KEY environment variable if available
        #     client = genai.Client()
        #     
        #     prompt = (
        #         f"Generate a hackathon project idea in the domain: '{request_data.domain}'. "
        #         f"The team's available skills are: {', '.join(request_data.skills)}. "
        #         "Provide a project name, problem statement, solution, recommended tech stack, "
        #         "and required team roles."
        #     )
        #     
        #     response = client.models.generate_content(
        #         model='gemini-2.5-flash',
        #         contents=prompt,
        #         config=types.GenerateContentConfig(
        #             response_mime_type="application/json",
        #             response_schema=ProjectIdeaResponse
        #         )
        #     )
        #     return ProjectIdeaResponse.model_validate_json(response.text)
        # except Exception as e:
        #     logger.warning(f"Error calling Gemini API: {e}. Falling back to mock data.")

        # Return mock data as requested
        return ProjectIdeaResponse(
            project_name="Smart Learning Assistant",
            problem_statement="Students struggle with personalized learning.",
            solution="AI-powered adaptive learning assistant.",
            tech_stack=[
                "React",
                "FastAPI",
                "PostgreSQL",
                "Gemini API"
            ],
            team_roles=[
                "Frontend Developer",
                "Backend Developer",
                "AI Engineer"
            ]
        )
