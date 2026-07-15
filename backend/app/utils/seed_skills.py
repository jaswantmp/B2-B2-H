# app/utils/seed_skills.py
from sqlalchemy.orm import Session
from app.models.user import Skill

DEFAULT_SKILLS = {
    "Technical": [
        "Python", "Java", "C++", "C", "JavaScript", "TypeScript", "React", "Angular", "Vue.js",
        "Node.js", "Express.js", "FastAPI", "Django", "Spring Boot", "Flutter", "Android", "iOS",
        "PostgreSQL", "MySQL", "MongoDB", "Firebase", "AWS", "Azure", "Docker", "Kubernetes",
        "DevOps", "Machine Learning", "Deep Learning", "Artificial Intelligence", "Generative AI",
        "Data Science", "Cybersecurity", "Blockchain"
    ],
    "Design": [
        "UI Design", "UX Design", "Figma", "Canva", "Graphic Design", "Wireframing", "Prototyping"
    ],
    "Product": [
        "Product Management", "Business Analysis", "Market Research", "Startup Strategy"
    ],
    "Communication": [
        "Public Speaking", "Presentation", "Pitching", "Technical Writing", "Documentation",
        "Team Leadership", "Project Management"
    ],
    "Hackathon": [
        "Problem Solving", "Innovation", "Ideation", "Pitch Deck Creation", "Demo Building",
        "Research", "Rapid Prototyping"
    ]
}


def seed_default_skills(db: Session):
    """Seed the database with standard default skills if they do not exist."""
    existing_count = db.query(Skill).count()
    if existing_count > 0:
        return

    print("Seeding default skills into database...")
    for category, skill_names in DEFAULT_SKILLS.items():
        for name in skill_names:
            db_skill = Skill(name=name, category=category)
            db.add(db_skill)
    try:
        db.commit()
        print("Default skills seeded successfully.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding default skills: {e}")
