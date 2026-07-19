# app/utils/seed_demo_data.py
import json
import os
import random
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.database import SessionLocal, engine
from app.models.user import User, Skill, UserSkill, AvailabilityStatus
from app.models.hackathon import Hackathon
from app.models.project import Project, ProjectMember
from app.models.team import Team, TeamMember
from app.utils.security import get_password_hash

# Relative path helper
DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

DEMO_USERS = [
    {
        "name": "Jaswant MP",
        "username": "jaswant",
        "email": "jaswant@b2b2h.com",
        "bio": "Computer Science student at SKCET passionate about AI/ML, Full Stack Development, Hackathons, and Open Source.",
        "location": "Coimbatore, Tamil Nadu",
        "university": "Sri Krishna College of Engineering and Technology",
        "college": "SKCET",
        "district": "Coimbatore",
        "city": "Coimbatore",
        "state": "Tamil Nadu",
        "year": "3rd Year",
        "branch": "Computer Science and Engineering",
        "status": AvailabilityStatus.LOOKING_FOR_TEAM,
        "skills": ["Python", "FastAPI", "React", "JavaScript", "Generative AI", "Docker"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=jaswant"
    },
    {
        "name": "Aarav Sharma",
        "username": "aarav",
        "email": "aarav.sharma@b2b2h.com",
        "bio": "Machine Learning researcher with focus on computer vision and neural networks.",
        "location": "Bengaluru, Karnataka",
        "university": "Indian Institute of Science",
        "college": "IISc",
        "district": "Bengaluru",
        "city": "Bengaluru",
        "state": "Karnataka",
        "year": "4th Year",
        "branch": "Data Science",
        "status": AvailabilityStatus.OPEN_TO_INVITES,
        "skills": ["Python", "PyTorch", "Machine Learning", "Deep Learning", "Artificial Intelligence", "Generative AI"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=aarav"
    },
    {
        "name": "Ananya Iyer",
        "username": "ananya",
        "email": "ananya.iyer@b2b2h.com",
        "bio": "Frontend developer specializing in sleek user experiences and responsive designs.",
        "location": "Chennai, Tamil Nadu",
        "university": "Anna University",
        "college": "CEG Anna University",
        "district": "Chennai",
        "city": "Chennai",
        "state": "Tamil Nadu",
        "year": "3rd Year",
        "branch": "Information Technology",
        "status": AvailabilityStatus.LOOKING_FOR_TEAM,
        "skills": ["JavaScript", "TypeScript", "React", "Vue.js", "Figma", "UI Design", "UX Design"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ananya"
    },
    {
        "name": "Aditya Patel",
        "username": "aditya",
        "email": "aditya.patel@b2b2h.com",
        "bio": "Full-stack developer and cloud architect. Enthusiastic about micro-services and serverless infrastructure.",
        "location": "Ahmedabad, Gujarat",
        "university": "Nirma University",
        "college": "Nirma",
        "district": "Ahmedabad",
        "city": "Ahmedabad",
        "state": "Gujarat",
        "year": "4th Year",
        "branch": "Computer Engineering",
        "status": AvailabilityStatus.LOOKING_FOR_MEMBERS,
        "skills": ["Java", "Spring Boot", "AWS", "Docker", "Kubernetes", "DevOps", "Node.js"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=aditya"
    },
    {
        "name": "Diya Sen",
        "username": "diya",
        "email": "diya.sen@b2b2h.com",
        "bio": "Product manager who loves pitching startup concepts and sketching interactive wireframes.",
        "location": "Kolkata, West Bengal",
        "university": "Jadavpur University",
        "college": "JU",
        "district": "Kolkata",
        "city": "Kolkata",
        "state": "West Bengal",
        "year": "2nd Year",
        "branch": "Electronics and Telecommunication",
        "status": AvailabilityStatus.OPEN_TO_INVITES,
        "skills": ["Product Management", "Business Analysis", "Market Research", "Startup Strategy", "Pitch Deck Creation", "Public Speaking"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=diya"
    },
    {
        "name": "Rohan Deshmukh",
        "username": "rohan",
        "email": "rohan.deshmukh@b2b2h.com",
        "bio": "Security enthusiast, pentester, and capture-the-flag (CTF) competitor.",
        "location": "Pune, Maharashtra",
        "university": "COEP Technological University",
        "college": "COEP",
        "district": "Pune",
        "city": "Pune",
        "state": "Maharashtra",
        "year": "3rd Year",
        "branch": "Computer Science",
        "status": AvailabilityStatus.LOOKING_FOR_TEAM,
        "skills": ["Cybersecurity", "Python", "Docker", "Problem Solving", "C++", "C"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=rohan"
    },
    {
        "name": "Kavya Nair",
        "username": "kavya",
        "email": "kavya.nair@b2b2h.com",
        "bio": "Mobile developer. Build apps that solve real agricultural and sustainability issues.",
        "location": "Kochi, Kerala",
        "university": "CUSAT",
        "college": "SOE CUSAT",
        "district": "Ernakulam",
        "city": "Kochi",
        "state": "Kerala",
        "year": "4th Year",
        "branch": "Computer Science",
        "status": AvailabilityStatus.LOOKING_FOR_MEMBERS,
        "skills": ["Flutter", "Android", "iOS", "Firebase", "Node.js", "MongoDB"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=kavya"
    },
    {
        "name": "Kabir Mehta",
        "username": "kabir",
        "email": "kabir.mehta@b2b2h.com",
        "bio": "Embedded systems developer. Experimenting with wireless sensor networks and smart grids.",
        "location": "New Delhi",
        "university": "Delhi Technological University",
        "college": "DTU",
        "district": "North West Delhi",
        "city": "New Delhi",
        "state": "Delhi",
        "year": "3rd Year",
        "branch": "Electrical Engineering",
        "status": AvailabilityStatus.LOOKING_FOR_TEAM,
        "skills": ["C++", "C", "IoT", "Raspberry Pi", "Python", "Problem Solving"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=kabir"
    },
    {
        "name": "Meera Joshi",
        "username": "meera",
        "email": "meera.joshi@b2b2h.com",
        "bio": "UI/UX designer. Believer in minimal interfaces, typography, and human-centric design.",
        "location": "Mumbai, Maharashtra",
        "university": "IIT Bombay",
        "college": "IITB",
        "district": "Mumbai City",
        "city": "Mumbai",
        "state": "Maharashtra",
        "year": "2nd Year",
        "branch": "Design",
        "status": AvailabilityStatus.LOOKING_FOR_TEAM,
        "skills": ["UI Design", "UX Design", "Figma", "Canva", "Graphic Design", "Wireframing", "Prototyping"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=meera"
    },
    {
        "name": "Vikram Singh",
        "username": "vikram",
        "email": "vikram.singh@b2b2h.com",
        "bio": "Backend dev and database tuner. Interested in high-throughput query structures.",
        "location": "Jaipur, Rajasthan",
        "university": "MNIT Jaipur",
        "college": "MNIT",
        "district": "Jaipur",
        "city": "Jaipur",
        "state": "Rajasthan",
        "year": "4th Year",
        "branch": "Computer Science",
        "status": AvailabilityStatus.IN_TEAM,
        "skills": ["PostgreSQL", "MySQL", "MongoDB", "Express.js", "Django", "FastAPI", "Python"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=vikram"
    },
    {
        "name": "Ishaan Verma",
        "username": "ishaan",
        "email": "ishaan.verma@b2b2h.com",
        "bio": "DevOps engineer. Automating continuous integration and monitoring distributed systems.",
        "location": "Hyderabad, Telangana",
        "university": "IIIT Hyderabad",
        "college": "IIITH",
        "district": "Hyderabad",
        "city": "Hyderabad",
        "state": "Telangana",
        "year": "3rd Year",
        "branch": "Computer Science",
        "status": AvailabilityStatus.LOOKING_FOR_MEMBERS,
        "skills": ["Docker", "Kubernetes", "DevOps", "AWS", "Azure", "Python", "Linux"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ishaan"
    },
    {
        "name": "Siddharth Rao",
        "username": "siddharth",
        "email": "siddharth.rao@b2b2h.com",
        "bio": "AI engineering student and competitive coder. Exploring vector databases and model optimization.",
        "location": "Bengaluru, Karnataka",
        "university": "PES University",
        "college": "PESU",
        "district": "Bengaluru",
        "city": "Bengaluru",
        "state": "Karnataka",
        "year": "3rd Year",
        "branch": "Computer Science",
        "status": AvailabilityStatus.LOOKING_FOR_TEAM,
        "skills": ["Python", "C++", "Generative AI", "Machine Learning", "Problem Solving", "Rapid Prototyping"],
        "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=siddharth"
    }
]


def seed_demo_users(db: Session):
    print("Seeding Demo Users...")
    users_seeded = []
    
    # Pre-fetch all available skills in the DB
    skills_db = db.query(Skill).all()
    skills_map = {s.name.lower(): s for s in skills_db}

    for user_data in DEMO_USERS:
        # Check duplicate
        db_user = db.query(User).filter(User.username == user_data["username"]).first()
        if not db_user:
            db_user = User(
                name=user_data["name"],
                username=user_data["username"],
                email=user_data["email"],
                hashed_password=get_password_hash("password123"), # Default secure password
                bio=user_data["bio"],
                location=user_data["location"],
                university=user_data["university"],
                college=user_data["college"],
                district=user_data["district"],
                city=user_data["city"],
                state=user_data["state"],
                year=user_data["year"],
                branch=user_data["branch"],
                status=user_data["status"],
                avatar=user_data["avatar"],
                onboarding_completed=True,
                is_active=True,
                is_verified=True
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)

            # Associate skills
            for skill_name in user_data["skills"]:
                sk = skills_map.get(skill_name.lower())
                if sk:
                    user_sk = UserSkill(
                        user_id=db_user.id,
                        skill_id=sk.id,
                        is_verified=random.choice([True, False]),
                        proficiency=random.choice(["Beginner", "Intermediate", "Advanced"])
                    )
                    db.add(user_sk)
            db.commit()
            db.refresh(db_user)
            print(f"Created User: {db_user.username}")
        else:
            print(f"User {db_user.username} already exists, skipping creation.")
        users_seeded.append(db_user)
        
    return users_seeded


def seed_hackathons(db: Session):
    print("Seeding Hackathons...")
    hackathons_seeded = []
    
    # Load JSON file
    json_path = os.path.join(DATA_DIR, "hackathons.json")
    with open(json_path, "r", encoding="utf-8") as f:
        hackathons_data = json.load(f)

    now = datetime.utcnow()
    
    for h_data in hackathons_data:
        # Check duplicate
        db_h = db.query(Hackathon).filter(Hackathon.title == h_data["title"]).first()
        
        # Calculate dates based on status
        status = h_data["status"]
        if status == "Open Registration":
            start_date = now + timedelta(days=30)
            end_date = now + timedelta(days=32)
            reg_deadline = now + timedelta(days=25)
        elif status == "Upcoming":
            start_date = now + timedelta(days=5)
            end_date = now + timedelta(days=7)
            reg_deadline = now + timedelta(days=2)
        else:  # Ongoing
            start_date = now - timedelta(days=1)
            end_date = now + timedelta(days=1)
            reg_deadline = now - timedelta(days=3)

        # Include registration deadline in the description
        deadline_str = reg_deadline.strftime("%d %b %Y")
        description_with_deadline = f"Registration Deadline: {deadline_str}. {h_data['description']}"
        if len(description_with_deadline) > 1000:
            description_with_deadline = description_with_deadline[:997] + "..."

        if not db_h:
            db_h = Hackathon(
                title=h_data["title"],
                description=description_with_deadline,
                organizer=h_data["organizer"],
                date=start_date,
                end_date=end_date,
                location=h_data["location"],
                prize=h_data["prize_pool"],
                team_size=f"1-{h_data['max_team_size']}",
                tracks=h_data["tracks"],
                tags=h_data["tags"],
                created_at=now - timedelta(days=10)
            )
            db.add(db_h)
            db.commit()
            db.refresh(db_h)
            print(f"Created Hackathon: {db_h.title}")
        else:
            print(f"Hackathon '{db_h.title}' already exists, updating properties.")
            db_h.description = description_with_deadline
            db_h.date = start_date
            db_h.end_date = end_date
            db_h.location = h_data["location"]
            db_h.prize = h_data["prize_pool"]
            db_h.team_size = f"1-{h_data['max_team_size']}"
            db_h.tracks = h_data["tracks"]
            db_h.tags = h_data["tags"]
            db.commit()
            db.refresh(db_h)
            
        hackathons_seeded.append(db_h)

    return hackathons_seeded


def seed_projects(db: Session, users: list[User]):
    print("Seeding Projects...")
    projects_seeded = []
    
    # Load JSON file
    json_path = os.path.join(DATA_DIR, "projects.json")
    with open(json_path, "r", encoding="utf-8") as f:
        projects_data = json.load(f)

    now = datetime.utcnow()
    
    # Determine project mapping status
    status_map = {
        "Recruiting": "recruiting",
        "In Progress": "active",
        "Completed": "completed"
    }

    for p_data in projects_data:
        # Check duplicate
        db_p = db.query(Project).filter(Project.title == p_data["title"]).first()
        
        # Format description to include metadata (domain, difficulty, team size)
        full_description = (
            f"Domain: {p_data['domain']} | Difficulty: {p_data['difficulty']} | "
            f"Target Team Size: {p_data['team_size']}\n\n{p_data['description']}"
        )
        if len(full_description) > 1000:
            full_description = full_description[:997] + "..."

        tech_stack = list(
            dict.fromkeys(
                [p_data["domain"]] + p_data["required_skills"]
            )
        )

        # Formulate open roles based on required skills
        open_roles = []
        for skill in p_data["required_skills"][:3]:
            if skill in ["Python", "PyTorch", "Generative AI", "Deep Learning", "Artificial Intelligence"]:
                role = "AI Engineer"
            elif skill in ["React", "JavaScript", "TypeScript", "Vue.js", "Figma", "UI Design", "UX Design"]:
                role = random.choice(["Frontend Developer", "UI/UX Designer"])
            elif skill in ["Node.js", "Express.js", "FastAPI", "Go", "C++", "C", "PostgreSQL", "MongoDB", "Spring Boot"]:
                role = "Backend Developer"
            elif skill in ["AWS", "Azure", "Docker", "Kubernetes", "DevOps"]:
                role = "DevOps Engineer"
            elif skill in ["Flutter", "Android", "iOS", "Firebase"]:
                role = "Mobile Developer"
            else:
                role = "Collaborator"
            if role not in open_roles:
                open_roles.append(role)

        creator = random.choice(users)
        
        status_value = status_map.get(p_data["status"], "recruiting")

        if not db_p:
            db_p = Project(
                title=p_data["title"],
                description=full_description,
                category=p_data["category"],
                university=creator.university,
                status=status_value,
                deadline=now + timedelta(days=20),
                tech=tech_stack,
                open_roles=open_roles,
                creator_id=creator.id,
                created_at=now - timedelta(days=5)
            )
            db.add(db_p)
            db.commit()
            db.refresh(db_p)
            
            # Automatically add creator as a member
            creator_member = ProjectMember(
                project_id=db_p.id,
                user_id=creator.id,
                role="Creator"
            )
            db.add(creator_member)
            db.commit()
            
            # Add other members realistically
            target_members_count = min(p_data["team_size"], len(users)) - 1
            available_members = [u for u in users if u.id != creator.id]
            selected_members = random.sample(available_members, k=target_members_count)
            for m in selected_members:
                # Deduplicate member check
                existing_member = db.query(ProjectMember).filter(
                    ProjectMember.project_id == db_p.id,
                    ProjectMember.user_id == m.id
                ).first()
                if not existing_member:
                    proj_member = ProjectMember(
                        project_id=db_p.id,
                        user_id=m.id,
                        role=random.choice(open_roles) if open_roles else "Collaborator"
                    )
                    db.add(proj_member)
            db.commit()
            db.refresh(db_p)
            print(f"Created Project: {db_p.title}")
        else:
            print(f"Project '{db_p.title}' already exists, updating properties.")
            db_p.description = full_description
            db_p.category = p_data["category"]
            db_p.status = status_value
            db_p.tech = tech_stack
            db_p.open_roles = open_roles
            db.commit()
            db.refresh(db_p)

        projects_seeded.append(db_p)

    return projects_seeded


def seed_teams(db: Session, users: list[User], hackathons: list[Hackathon]):
    print("Seeding Teams...")
    teams_seeded = []
    
    TEAM_NAMES = [
        ("DevDynasty", "Building optimized workflow agents for hackathons."),
        ("NeuralForce", "Deploying visual semantic classification architectures on edge nodes."),
        ("SovereignSecurity", "Developing continuous intrusion defense systems."),
        ("GreenByte", "Decentralized tracking for smart grid systems."),
        ("QuantAlgos", "Frictionless micro-ledgers and arbitrage solvers."),
        ("ApexCoders", "Edge compute runners for serverless orchestration."),
        ("EduInnovators", "Personalized adaptive graders for rural learners."),
        ("MedTech Pioneers", "Real-time stream aggregation for wearable sensors."),
        ("IoT Wizards", "Intelligent sensor mapping for automation routers."),
        ("CloudCommanders", "Scalable orchestrators and cloud IAM policy parsers.")
    ]

    now = datetime.utcnow()

    for index, (name, desc) in enumerate(TEAM_NAMES):
        # Check duplicate
        db_team = db.query(Team).filter(Team.name == name).first()

        leader = users[index % len(users)]
        hackathon = hackathons[index % len(hackathons)]

        if not db_team:
            db_team = Team(
                name=name,
                description=desc,
                hackathon_id=hackathon.id,
                status=random.choice(["recruiting", "active"]),
                max_members=random.choice([4, 5]),
                leader_id=leader.id,
                created_at=now - timedelta(days=2)
            )
            db.add(db_team)
            db.commit()
            db.refresh(db_team)

            # Add leader as team member
            leader_member = TeamMember(
                team_id=db_team.id,
                user_id=leader.id,
                role="Team Lead"
            )
            db.add(leader_member)
            db.commit()

            # Add 1-3 extra members realistically
            possible_members = [u for u in users if u.id != leader.id]
            selected_count = random.randint(1, 3)
            selected_members = random.sample(possible_members, k=selected_count)

            roles = ["Frontend Developer", "Backend Developer", "AI Engineer", "UI/UX Designer", "Product Lead"]
            for m in selected_members:
                existing_member = db.query(TeamMember).filter(
                    TeamMember.team_id == db_team.id,
                    TeamMember.user_id == m.id
                ).first()
                if not existing_member:
                    member_role = roles[random.randint(0, len(roles) - 1)]
                    team_member = TeamMember(
                        team_id=db_team.id,
                        user_id=m.id,
                        role=member_role
                    )
                    db.add(team_member)
            db.commit()
            db.refresh(db_team)
            print(f"Created Team: {db_team.name}")
        else:
            print(f"Team '{db_team.name}' already exists, skipping creation.")

        teams_seeded.append(db_team)

    return teams_seeded


def main():
    print("Starting B2B2H Database Seeding Script...")
    db = SessionLocal()
    try:
        # Seed users (first ensures skills exist via startup or utility)
        users = seed_demo_users(db)
        
        # Seed Hackathons
        hackathons = seed_hackathons(db)
        
        # Seed Projects
        projects = seed_projects(db, users)
        
        # Seed Teams
        teams = seed_teams(db, users, hackathons)

        print("\n" + "="*40)
        print("SEEDING SUMMARY & FINAL COUNTS:")
        print(f"Users Count      : {db.query(User).count()}")
        print(f"Teams Count      : {db.query(Team).count()}")
        print(f"Projects Count   : {db.query(Project).count()}")
        print(f"Hackathons Count : {db.query(Hackathon).count()}")
        print("="*40 + "\n")

    except Exception as e:
        print(f"CRITICAL ERROR during database seeding: {e}")
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    main()
