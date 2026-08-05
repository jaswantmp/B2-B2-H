# app/utils/seed_skills.py
from sqlalchemy.orm import Session
from app.models.user import Skill

DEFAULT_SKILLS = {
    "Programming": [
        "Python", "Java", "C", "C++", "Go", "Rust", "JavaScript", "TypeScript", "Kotlin", "Swift",
        "Scala", "R", "MATLAB", "Julia", "Assembly", "Shell Scripting", "Dart", "Lua", "Perl",
        "Haskell", "Elixir", "PHP", "Ruby", "Erlang", "F#", "Clojure", "Zig", "Nim", "Fortran",
        "COBOL", "Objective-C", "Apex", "Verilog", "VHDL", "SystemVerilog"
    ],
    "Frontend": [
        "React", "Angular", "Vue.js", "Next.js", "Nuxt.js", "Svelte", "SvelteKit", "Tailwind CSS",
        "HTML5", "CSS3", "Bootstrap", "Sass", "Less", "WebComponents", "Vite", "Redux", "Zustand",
        "RxJS", "Solid.js", "Remix", "HTMX", "Alpine.js", "WebGL", "Three.js", "Canvas API",
        "Shadow DOM", "PWA", "Ant Design", "Material UI", "Chakra UI", "Shadcn UI"
    ],
    "Backend": [
        "Node.js", "Express.js", "FastAPI", "Spring Boot", "Django", "Flask", "Laravel", "NestJS",
        "Ruby on Rails", "ASP.NET Core", "Gin", "Fiber", "Actix", "Axum", "Micronaut", "Quarkus",
        "Symfony", "Koa", "Hono", "Bun", "tRPC", "gRPC", "GraphQL", "REST API", "WebSockets",
        "Socket.io", "Celery", "RabbitMQ", "Apache Kafka", "NATS", "BullMQ", "MQTT", "Serverless",
        "Microservices", "Event-Driven Architecture"
    ],
    "Databases": [
        "PostgreSQL", "MySQL", "SQLite", "MongoDB", "Redis", "Firebase", "Supabase",
        "Apache Cassandra", "DynamoDB", "Neo4j", "Elasticsearch", "Meilisearch", "Pinecone",
        "Qdrant", "ChromaDB", "Milvus", "Weaviate", "TimescaleDB", "ClickHouse", "CockroachDB",
        "MariaDB", "CouchDB", "ArangoDB", "Realm", "Prisma", "TypeORM", "Drizzle", "SQLAlchemy",
        "DuckDB", "LevelDB"
    ],
    "AI / ML & Agentic Systems": [
        "TensorFlow", "PyTorch", "OpenCV", "LangChain", "LlamaIndex", "HuggingFace", "Scikit-Learn",
        "Keras", "RAG", "Prompt Engineering", "Agentic AI", "LangGraph", "CrewAI", "AutoGen",
        "MCP (Model Context Protocol)", "Computer Vision", "NLP", "LLMs", "Transformer Models",
        "Fine-tuning", "Vector Embeddings", "Deep Learning", "Reinforcement Learning", "Generative AI",
        "Speech Recognition", "Object Detection", "YOLO", "BERT", "Stable Diffusion", "MLOps",
        "MLflow", "Weights & Biases", "Triton", "ONNX", "TensorRT"
    ],
    "Cloud & DevOps": [
        "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "Jenkins",
        "GitHub Actions", "GitLab CI/CD", "CircleCI", "Helm", "ArgoCD", "Prometheus", "Grafana",
        "OpenTelemetry", "Nginx", "HAProxy", "Cloudflare", "Serverless Framework", "Pulumi",
        "Vagrant", "Linux Administration", "Infrastructure as Code", "Istio", "Linkerd"
    ],
    "Cybersecurity": [
        "Ethical Hacking", "Penetration Testing", "Burp Suite", "Metasploit", "OWASP Top 10",
        "Wireshark", "Nmap", "Kali Linux", "Reverse Engineering", "Cryptography", "Network Security",
        "Cloud Security", "SIEM", "Incident Response", "Malware Analysis", "Identity Management",
        "OAuth 2.0", "Zero Trust", "Vulnerability Scanning", "Snort", "Ghidra", "Splunk"
    ],
    "Mechanical & CAD/CAM": [
        "SolidWorks", "Fusion 360", "CATIA", "Creo", "NX CAD", "ANSYS", "Abaqus", "AutoCAD",
        "CNC Programming", "3D Printing", "GD&T", "Finite Element Analysis (FEA)",
        "Computational Fluid Dynamics (CFD)", "Heat Transfer", "Fluid Mechanics", "Kinematics",
        "Thermodynamics", "Mechatronics Design", "Additive Manufacturing", "Reverse Engineering", "Moldflow"
    ],
    "Electrical & Embedded": [
        "MATLAB", "Simulink", "PLC", "SCADA", "Siemens TIA Portal", "LabVIEW", "Embedded C",
        "PCB Design", "STM32", "ESP32", "Arduino", "Raspberry Pi", "FPGA", "KiCad",
        "Altium Designer", "Circuit Design", "Power Electronics", "Microcontrollers",
        "Control Systems", "Signal Processing", "RTOS", "Electric Drive Systems", "Keil uVision", "Proteus"
    ],
    "Robotics & Automation": [
        "ROS", "ROS2", "Gazebo", "Robotics Kinematics", "Autonomous Navigation", "SLAM",
        "Sensor Fusion", "Motion Planning", "Industrial Robotics", "Path Planning"
    ],
    "Civil & Structural": [
        "STAAD Pro", "ETABS", "SAP2000", "Revit", "AutoCAD Civil 3D", "Surveying",
        "Structural Analysis", "Geotechnical Engineering", "BIM (Building Information Modeling)",
        "Environmental Engineering", "Transportation Engineering", "Hydrology",
        "Construction Management", "GIS", "MX Road", "Primavera P6"
    ],
    "Design & AR/VR": [
        "Figma", "Adobe XD", "Photoshop", "Illustrator", "Canva", "Blender", "Unreal Engine",
        "Unity", "UI Design", "UX Research", "Design Systems", "Wireframing", "Prototyping",
        "Motion Graphics", "User Testing", "Information Architecture", "Interaction Design",
        "3D Modeling", "After Effects", "ARKit", "ARCore", "WebXR"
    ],
    "Enterprise & Analytics": [
        "Salesforce", "SAP", "Oracle", "Power BI", "Tableau", "Excel Advanced", "Business Analysis",
        "Product Management", "Financial Modeling", "Supply Chain Analytics", "Google Analytics",
        "Mixpanel", "Looker", "SAP S/4HANA", "Salesforce Apex", "n8n", "Zapier"
    ],
    "Soft Skills": [
        "Leadership", "Presentation", "Communication", "Problem Solving", "Innovation",
        "Critical Thinking", "Research", "Teamwork", "Time Management", "Negotiation",
        "Emotional Intelligence", "Adaptability", "Public Speaking", "Strategic Thinking", "Conflict Resolution"
    ],
    "Hackathon Skills": [
        "Rapid Prototyping", "Ideation", "MVP Development", "Demo Building",
        "Hackathon Strategy", "Pitching", "Storytelling", "Pitch Deck Creation", "Speed Coding",
        "User Feedback Collection", "Pitch Presentation"
    ]
}


def seed_default_skills(db: Session):
    """Seed the database with standard default skills if they do not exist."""
    print("Seeding default skills into database...")
    existing_skills = {s.name.lower(): s for s in db.query(Skill).all()}
    added_count = 0

    for category, skill_names in DEFAULT_SKILLS.items():
        for name in skill_names:
            if name.lower() not in existing_skills:
                db_skill = Skill(name=name, category=category)
                db.add(db_skill)
                existing_skills[name.lower()] = db_skill
                added_count += 1
    try:
        if added_count > 0:
            db.commit()
            print(f"Added {added_count} new default skills successfully.")
        else:
            print("All default skills are already present in the database.")
    except Exception as e:
        db.rollback()
        print(f"Error seeding default skills: {e}")
