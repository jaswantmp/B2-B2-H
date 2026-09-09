B2B2H — AI-Powered Student Collaboration & Hackathon Intelligence Platform
> **B2B2H** is an AI-powered student collaboration platform that helps students discover relevant projects and hackathons, find compatible teammates, generate balanced teams, and analyze team health so they can turn ideas into executable solutions.
🚀 Live Demo
Frontend: https://b2-b2-h.vercel.app
Backend API: https://b2-b2-h-api.onrender.com
API Documentation: https://b2-b2-h-api.onrender.com/docs
> **Demo Environment:** The deployed demonstration uses seeded sample data for demonstration purposes. Student profiles, projects, teams, hackathons, registrations, and activity shown in the demo are not real-world users or events.
---
🎯 Problem Statement
Students participating in projects and hackathons often face several collaboration challenges:
Finding teammates with complementary technical skills
Identifying projects that match their interests and abilities
Discovering hackathons that are relevant to their profile
Building balanced teams rather than simply selecting available students
Understanding whether an existing team has important skill or role gaps
B2B2H addresses these problems through a combination of machine learning, recommendation systems, clustering, rule-based constraints, and AI-assisted workflows.
---
💡 What B2B2H Does
B2B2H follows the student collaboration lifecycle:
```text
Student
   ↓
Student Clustering
   ↓
Personalized Recommendations
   ├── Project Recommendations
   └── Hackathon Recommendations
   ↓
AI Team Matcher
   ↓
AI Team Generator
   ↓
Team Health Analysis
```
Core capabilities
Feature	Purpose
AI Team Matcher	Finds compatible teammates using ML-based compatibility scoring
Project Recommendations	Recommends projects based on student/project features
Hackathon Recommendations	Ranks relevant upcoming hackathons for a student
Team Generator	Generates balanced teams subject to team size and skill requirements
Team Health	Evaluates current team health and highlights strengths and gaps
Student Clustering	Groups students into ML-derived student segments
AI Project Generator	Uses Gemini to help turn ideas into structured project concepts
Team Match Explanation	Uses Gemini for natural-language explanations of match results
---
🤖 AI / ML Architecture
B2B2H uses multiple models rather than relying on one generic AI model.
1. AI Team Matcher
The team matcher combines:
Supervised ML predictions
TF-IDF similarity
Skill overlap
Domain alignment
Rule-based compatibility
The final compatibility score combines ML and deterministic signals.
```text
Student A + Student B
        ↓
Feature Engineering
        ↓
ML Classifier + Regressor
        ↓
Similarity / Skill / Domain Signals
        ↓
Hybrid Compatibility Score
```
Model version used in production:
`GradientBoosting-v1.0`
---
2. Project Recommendations
Project recommendations use:
TF-IDF similarity
Engineered student/project features
Classification
Regression-based scoring
Batch ML inference
The result is a ranked list of projects relevant to the student.
---
3. Hackathon Recommendations
The hackathon recommender combines eligibility/deadline filtering with ML ranking.
Production model:
`hackathon_recommender_v1`
The model uses engineered features including signals such as:
Domain match
Verified skill count
TF-IDF similarity
Student project history
Skill overlap
GitHub activity
Hackathon tracks/tags
---
4. AI Team Generator
The team generator is a multi-stage ML workflow:
```text
Project Idea + Team Size + Required Skills
                  ↓
         Candidate Filtering
                  ↓
       Pairwise Compatibility
                  ↓
             Beam Search
                  ↓
          Team Quality Model
                  ↓
        Constraint Optimization
                  ↓
            Role Assignment
```
Production model version:
`team_generator_v1`
The system uses separate models for pairwise compatibility and overall team quality.
---
5. Team Health
Team Health evaluates an existing team's structure using non-PII team features.
The system combines:
Pairwise member compatibility
Functional coverage
Team experience/project activity
GitHub activity
Skill/category gaps
ML-based team health prediction
Health categories:
```text
75–100   → Healthy
50–74    → Moderate
0–49     → At Risk
```
Production model version:
`team_health_v1`
---
6. Student Clustering
Students are grouped using K-Means clustering based on engineered student-level features.
Production model version:
`kmeans_student_segmentation_v1`
Student clustering is currently a model capability rather than an operationally tracked usage feature in the admin analytics dashboard.
---
✨ Generative AI
B2B2H also uses Google's Gemini API for selected natural-language tasks.
Current uses include:
AI-assisted project idea generation
Natural-language team-match explanations
These functions complement the ML recommendation and prediction systems rather than replacing them.
---
🏗️ System Architecture
```text
                    ┌───────────────────────┐
                    │      React + Vite     │
                    │  Tailwind Frontend    │
                    └───────────┬───────────┘
                                │
                         REST / WebSockets
                                │
                    ┌───────────▼───────────┐
                    │       FastAPI         │
                    │       Backend         │
                    └───────────┬───────────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
            ▼                   ▼                   ▼
     PostgreSQL / Neon      ML Inference       Gemini API
                               │
                               ▼
                         ML Model Artifacts
                               │
       ┌──────────────┬────────┼────────┬──────────────┐
       ▼              ▼        ▼        ▼              ▼
   Team Matcher   Projects  Hackathons Team Generator Team Health
                               │
                               ▼
                         Student Clustering
```
---
🛠️ Technology Stack
Frontend
React
Vite
Tailwind CSS
JavaScript / JSX
Backend
FastAPI
SQLAlchemy
Alembic
Python
JWT authentication
WebSockets
Database
PostgreSQL
Neon
Machine Learning
scikit-learn
Pandas
NumPy
TF-IDF
K-Means clustering
Gradient boosting models
Feature engineering
Model evaluation
Production inference
Generative AI
Google Gemini API
Deployment
Vercel — frontend
Render — backend
Neon — PostgreSQL
---
🔐 Authentication & Security
B2B2H includes:
JWT-based authentication
Database-backed admin authorization
Protected admin routes
Password hashing with bcrypt
Password-reset token hashing
Expiring and single-use password-reset tokens
Admin-only management APIs
Production environment configuration validation
Separation of production secrets from source control
The frontend admin check is only a UX guard. Backend authorization is enforced using a live database check.
---
👑 Admin Platform
B2B2H includes a production admin system for platform operations.
Admin capabilities
Student management
Student verification and activation control
Hackathon management
Project moderation
Team management
Team Health inspection
Platform statistics
ML / AI operational usage analytics
ML / AI Analytics
The admin analytics dashboard provides:
Total ML/AI requests
Successful requests
Success rate
Unique users
Average response time
Usage by ML feature
Today / 7-day / 30-day activity
Observed model versions
Current Team Health distribution
Active model registry
The analytics dashboard intentionally reports operational usage, not unsupported real-world model accuracy claims.
---
📊 ML Data & Evaluation
The production ML pipeline uses feature-engineered datasets and lightweight model artifacts for runtime inference.
Large offline training/evaluation artifacts are intentionally kept outside the Git repository.
The production architecture separates:
```text
Offline Training / Evaluation
            ↓
      Model Artifacts
            ↓
     Runtime Inference
            ↓
        API Services
```
Important evaluation note
Some ML targets in the current project are engineered/derived targets because sufficiently large real-world historical outcomes were not available.
Therefore:
> Reported evaluation metrics demonstrate model generalization to the engineered target functions and should not be interpreted as real-world team-success or user-preference accuracy.
This distinction is intentionally documented to avoid overstating the current ML results.
---
📈 Production ML Systems
System	Production Version
AI Team Matcher	`GradientBoosting-v1.0`
Project Recommendations	`GradientBoosting-v1.0`
Hackathon Recommendations	`hackathon_recommender_v1`
Team Generator	`team_generator_v1`
Team Health	`team_health_v1`
Student Clustering	`kmeans_student_segmentation_v1`
---
🧪 Testing
The backend has automated tests covering:
Authentication and authorization
Admin security
Student management
Hackathon management
Project management
Team management
ML usage tracking
ML instrumentation
ML analytics
Team Health
Password reset
API behavior
The final pre-submission verification completed with:
```text
127 passed, 0 failed
```
The frontend production build also completed successfully.
---
📁 Project Structure
```text
B2B2H/
│
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── dependencies.py
│   │   ├── config.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── ml/
│   │   ├── models/
│   │   ├── data/
│   │   ├── inference.py
│   │   └── training scripts
│   │
│   ├── tests/
│   └── requirements.txt
│
├── src/
│   ├── components/
│   ├── context/
│   ├── layouts/
│   ├── pages/
│   │   ├── admin/
│   │   └── auth/
│   ├── services/
│   └── App.jsx
│
├── public/
├── package.json
└── README.md
```
---
⚙️ Local Development
Prerequisites
Python 3.11+ recommended
Node.js
PostgreSQL database or Neon database
Gemini API key for generative-AI features
Backend
```bash
cd backend
python -m venv .venv
```
Activate the environment:
Windows
```powershell
.venv\Scripts\Activate.ps1
```
macOS/Linux
```bash
source .venv/bin/activate
```
Install dependencies:
```bash
pip install -r requirements.txt
```
Create/configure the backend environment variables using:
```text
backend/.env.example
```
Run migrations:
```bash
alembic upgrade head
```
Start the API:
```bash
uvicorn app.main:app --reload
```
The local API will normally be available at:
```text
http://127.0.0.1:8000
```
Swagger/OpenAPI:
```text
http://127.0.0.1:8000/docs
```
Frontend
From the project root:
```bash
npm install
npm run dev
```
The Vite development server will provide the local frontend URL shown in the terminal.
---
🧪 Running Tests
From the `backend` directory:
```bash
python -m pytest -q
```
---
🔄 Database Migrations
Alembic is used for schema migrations.
Example:
```bash
alembic upgrade head
```
The current migration history includes the production features added for admin management, ML usage analytics, and password reset.
---
🌱 Demo Data
The application includes deterministic seeded demo data for presentation and testing.
The demo dataset is designed to make important workflows visible, including:
Students
Skills
Projects
Teams
Hackathons
Registrations
Team activity
Hackathon demo dates are intentionally scheduled as future dates so upcoming-event workflows can be demonstrated.
---
🧭 Product Workflow
A typical B2B2H workflow looks like:
```text
1. Student signs in
        ↓
2. Student discovers projects/hackathons
        ↓
3. AI recommends relevant opportunities
        ↓
4. AI Team Matcher finds compatible students
        ↓
5. Team Generator builds a balanced team
        ↓
6. Team Health identifies strengths and gaps
        ↓
7. Students collaborate and execute the project
```
---
🎓 Course / Capstone Context
B2B2H was developed as a capstone project for the LaunchED Global AI course / internship program.
The project focuses on applying practical AI and machine-learning concepts to a complete production-style application rather than building an isolated ML notebook.
Concepts demonstrated include:
Supervised learning
Recommendation systems
Clustering
Feature engineering
Preprocessing
Model evaluation
Predictive scoring
ML inference services
AI-assisted workflows
Full-stack AI system integration
---
⚠️ Current Limitations
B2B2H is a functional capstone/prototype system and has several intentional limitations:
The deployed demonstration uses seeded sample data.
Several ML training targets are engineered/derived because reliable historical user-outcome data is limited.
Operational ML analytics currently tracks selected production features; Student Clustering is not tracked as a usage event.
Recommendation and team-health scores should be interpreted as decision-support signals rather than guarantees of real-world outcomes.
Production-scale concerns such as very large traffic volumes, distributed caching, and advanced global rate limiting are outside the current capstone scope.
---
🔭 Future Improvements
Potential future work includes:
Learning from real user feedback and historical outcomes
Online recommendation feedback loops
More advanced team-success prediction using real outcome labels
Better cold-start recommendations
Real-time collaboration analytics
Distributed caching
Larger-scale observability
More sophisticated ranking and optimization strategies
---
👨‍💻 Project
B2B2H — Build to Build Hack
An AI-powered collaboration platform designed to help student builders find the right opportunities, form stronger teams, and turn ideas into executable solutions.