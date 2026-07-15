# app/services/ai_service.py
import logging
from app.schemas.ai import ProjectIdeaRequest, ProjectIdeaResponse

logger = logging.getLogger(__name__)

class AIService:
    @classmethod
    async def generate_project_idea(cls, request_data: ProjectIdeaRequest) -> ProjectIdeaResponse:
        """
        Generates a project idea based on the input domain and skills.
        Uses a rich, context-aware mapping for key domains and falls back dynamically.
        """
        domain_lower = request_data.domain.strip().lower()
        skills_upper = [s.strip().upper() for s in request_data.skills]
        
        # Comprehensive catalog of context-aware projects
        catalog = {
            "education": ProjectIdeaResponse(
                project_name="EduSphere VR Classroom",
                problem_statement="Traditional remote learning lacks immersive interaction, leading to low student engagement.",
                solution="An interactive VR platform using Three.js and Gemini API to generate dynamic 3D learning rooms and real-time quizzes.",
                tech_stack=["React", "Three.js", "FastAPI", "Gemini API", "PostgreSQL"] + request_data.skills[:2],
                team_roles=["Frontend Dev", "3D Graphics Developer", "Backend Developer", "Product Manager"]
            ),
            "healthcare": ProjectIdeaResponse(
                project_name="AuraHealth Vitals Monitor",
                problem_statement="Post-operative patients lack accessible vitals monitoring outside of hospital ICU wards.",
                solution="An AI-powered vitals monitoring application using computer vision and edge ML to track distress signals and alert nurses.",
                tech_stack=["Python", "FastAPI", "OpenCV", "React Native", "PostgreSQL"] + request_data.skills[:2],
                team_roles=["AI Engineer", "Mobile Dev", "Backend Developer", "UX Designer"]
            ),
            "agriculture": ProjectIdeaResponse(
                project_name="AgriPulse Crop Predictor",
                problem_statement="Small-scale farmers struggle to anticipate crop diseases and local soil degradation early.",
                solution="An offline-first mobile application utilizing Tensorflow Lite image classification to identify crop disease.",
                tech_stack=["React Native", "TensorFlow Lite", "FastAPI", "PostgreSQL"] + request_data.skills[:2],
                team_roles=["Mobile Developer", "ML Engineer", "GIS Analyst", "Backend Developer"]
            ),
            "finance": ProjectIdeaResponse(
                project_name="FinFlow Gig Ledger",
                problem_statement="Gig workers face highly volatile monthly income streams and struggle to budget or save.",
                solution="An automated micro-saving manager that analyzes transaction flows and dynamically invests spare change.",
                tech_stack=["React", "FastAPI", "Plaid API", "PostgreSQL", "Tailwind CSS"] + request_data.skills[:2],
                team_roles=["Frontend Developer", "Fintech Analyst", "Backend Developer", "Security Auditor"]
            ),
            "environment": ProjectIdeaResponse(
                project_name="EcoTrack Carbon Ledger",
                problem_statement="Small and medium businesses struggle to audit their supply-chain carbon emissions accurately.",
                solution="A ledger tracking supply-chain endpoints and computing real-time carbon offsets utilizing public logistics APIs.",
                tech_stack=["Next.js", "FastAPI", "PostgreSQL", "Docker"] + request_data.skills[:2],
                team_roles=["Frontend Developer", "Backend Developer", "Sustainability Analyst", "Data Engineer"]
            ),
            "cybersecurity": ProjectIdeaResponse(
                project_name="Sentinel-Auth Hook",
                problem_statement="Developer credentials are frequently leaked in local git repositories during commit staging.",
                solution="A local pre-commit hook utility powered by machine learning that intercepts and blocks credential commits in real-time.",
                tech_stack=["Python", "Go", "FastAPI", "SQLite"] + request_data.skills[:2],
                team_roles=["System Utility Developer", "Security Researcher", "Backend Developer", "DevOps Engineer"]
            ),
            "ai/ml": ProjectIdeaResponse(
                project_name="Synthetix Voice Generator",
                problem_statement="Speech-impaired users require natural, personalized text-to-speech synthesizers that mimic their historical voice.",
                solution="A deep learning voice cloning assistant running locally on user devices for real-time speech synthesis.",
                tech_stack=["Python", "PyTorch", "FastAPI", "React"] + request_data.skills[:2],
                team_roles=["AI Research Scientist", "Frontend Developer", "Backend Developer", "UX Specialist"]
            ),
            "smart cities": ProjectIdeaResponse(
                project_name="GridSense Traffic Coordinator",
                problem_statement="Urban traffic congestion peaks unpredictably, slowing emergency response vehicles.",
                solution="An intelligent street camera routing system that preemptively turns traffic lights green for emergency services.",
                tech_stack=["Python", "OpenCV", "FastAPI", "PostgreSQL", "Kafka"] + request_data.skills[:2],
                team_roles=["Computer Vision Developer", "Data Engineer", "Backend Developer", "Product Manager"]
            ),
            "accessibility": ProjectIdeaResponse(
                project_name="SightRead tactile screen reader",
                problem_statement="Visually impaired students struggle to navigate complex engineering diagrams and textbook PDFs.",
                solution="An AI screen reader that reconstructs visual layout hierarchies and charts into interactive tactile audio maps.",
                tech_stack=["React", "FastAPI", "Gemini API", "Python", "Web Audio API"] + request_data.skills[:2],
                team_roles=["Accessibility Expert", "Frontend Developer", "Backend Developer", "AI Engineer"]
            ),
            "e-commerce": ProjectIdeaResponse(
                project_name="ShopSync Shopping Assistant",
                problem_statement="Online shoppers spend hours comparing product reviews across multiple retail platforms.",
                solution="An autonomous shopping agent that scrapes reviews, filters sponsored content, and ranks items based on sentiment analysis.",
                tech_stack=["React", "Node.js", "Puppeteer", "FastAPI", "PostgreSQL"] + request_data.skills[:2],
                team_roles=["Frontend Developer", "Web Scraping Expert", "Backend Developer", "Product Designer"]
            )
        }

        # Try to find a matching catalog item
        matched_response = None
        for key, response in catalog.items():
            if key in domain_lower or domain_lower in key:
                matched_response = response
                break

        if not matched_response:
            # Catch-all fallback that constructs a custom project based on input domain
            capitalized_domain = request_data.domain.strip().capitalize()
            suggested_roles = ["Frontend Developer", "Backend Developer", "System Architect"]
            if any(s in ["AI", "PYTHON", "TENSORFLOW", "PYTORCH"] for s in skills_upper):
                suggested_roles.append("AI Engineer")
            
            matched_response = ProjectIdeaResponse(
                project_name=f"{capitalized_domain} SmartHub",
                problem_statement=f"Modern workflows in the {capitalized_domain} domain are inefficient and lack integrated data tracking.",
                solution=f"A smart collaboration platform utilizing automated AI workflows to optimize operations in {capitalized_domain}.",
                tech_stack=["React", "FastAPI", "PostgreSQL"] + request_data.skills[:2],
                team_roles=suggested_roles
            )

        # Adjust matching response dynamically using all inputs (theme, difficulty, team_size)
        project_name = matched_response.project_name
        problem_statement = matched_response.problem_statement
        solution = matched_response.solution
        tech_stack = list(dict.fromkeys(matched_response.tech_stack))
        team_roles = list(matched_response.team_roles)

        if request_data.theme:
            # Customize name and solution based on theme
            project_name = f"{project_name} - {request_data.theme.strip()}"
            solution = f"{solution} Engineered specifically for the theme: '{request_data.theme.strip()}'."

        if request_data.difficulty:
            diff = request_data.difficulty.strip().lower()
            if "advanced" in diff or "hard" in diff:
                problem_statement = f"[Advanced Architecture] {problem_statement}"
                # Add advanced tech
                tech_stack.extend(["Docker", "Kubernetes", "Redis", "gRPC"])
                tech_stack = list(dict.fromkeys(tech_stack))
            elif "beginner" in diff or "easy" in diff:
                problem_statement = f"[Beginner Friendly] {problem_statement}"

        if request_data.team_size and request_data.team_size > 0:
            if request_data.team_size < len(team_roles):
                team_roles = team_roles[:request_data.team_size]
            elif request_data.team_size > len(team_roles):
                extras = ["System Engineer", "QA Specialist", "Data Engineer", "Operations Lead"]
                needed = request_data.team_size - len(team_roles)
                team_roles.extend(extras[:needed])

        return ProjectIdeaResponse(
            project_name=project_name,
            problem_statement=problem_statement,
            solution=solution,
            tech_stack=tech_stack,
            team_roles=team_roles
        )
