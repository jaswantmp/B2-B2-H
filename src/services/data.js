// src/services/data.js — B2B2H expanded sample data (cleaned of demo fallbacks)
export const STATUSES = {
  LOOKING_FOR_TEAM:    { label: 'Looking For Team',    color: 'green',  ring: '#10B981' },
  OPEN_TO_INVITES:     { label: 'Open To Invitations', color: 'yellow', ring: '#F59E0B' },
  LOOKING_FOR_MEMBERS: { label: 'Looking For Members', color: 'blue',   ring: '#06B6D4' },
  IN_TEAM:             { label: 'Already In Team',     color: 'red',    ring: '#EF4444' },
  OFFLINE:             { label: 'Offline',             color: 'gray',   ring: '#6B7280' },
}

export const users = [
  {
    "id": "b4c077d2-148e-42f9-bc80-1515091459a8",
    "name": "Arjun Sharma",
    "username": "arjun_sharma_91",
    "email": "arjun.sharma@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=arjun_sharma_91",
    "university": "Government College of Technology",
    "college": "GCT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Computer Science Engineering",
    "bio": "Computer Science Engineering student at GCT passionate about Thermal Systems and Synthetic Biology.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "JavaScript",
      "Git",
      "C++",
      "Java",
      "PostgreSQL",
      "TypeScript",
      "Kubernetes",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "Java"
    ],
    "github": "arjunsharma",
    "linkedin": "arjunsharma",
    "website": "",
    "social": {
      "github": "arjunsharma",
      "linkedin": "arjunsharma",
      "website": ""
    },
    "interests": [
      "Thermal Systems",
      "Synthetic Biology",
      "Robotics",
      "Hydroponics"
    ],
    "domains": [
      "Logistics",
      "Mechanical"
    ],
    "projects": [
      {
        "name": "Microservice Telemetry Mesh",
        "desc": "Observability suite with metrics tracing and fault injection for web microservices.",
        "tech": [
          "Go",
          "Docker",
          "PostgreSQL",
          "Prometheus"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Realtime Collaborative IDE",
        "desc": "In-browser multi-user IDE supporting live operational transformation.",
        "tech": [
          "TypeScript",
          "Node.js",
          "WebSockets",
          "React"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Cloud Native Compiler Platform",
        "desc": "Distributed remote code execution engine with container sandbox isolation.",
        "tech": [
          "Python",
          "Docker",
          "Kubernetes",
          "React"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Low-Latency Micro-Ledger",
        "desc": "High-throughput audit transaction engine with cryptographic proofs.",
        "tech": [
          "Rust",
          "PostgreSQL",
          "Docker"
        ],
        "role": "Software Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 11,
      "commits": 434,
      "stars": 0,
      "followers": 22,
      "following": 49
    },
    "github_stats": {
      "repos": 11,
      "commits": 434,
      "stars": 0,
      "followers": 22,
      "following": 49
    },
    "profileCompletion": 72
  },
  {
    "id": "389062fe-a5c8-4f8d-ab5a-72f522fa00fa",
    "name": "Priya Reddy",
    "username": "priya_reddy_58",
    "email": "priya.reddy@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=priya_reddy_58",
    "university": "Government College of Technology",
    "college": "GCT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "4th Year",
    "branch": "Computer Science Engineering",
    "bio": "Building sustainable and scalable solutions in FinTech. 4th Year at GCT.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Docker",
      "TypeScript",
      "Python",
      "FastAPI",
      "Java",
      "JavaScript",
      "Git",
      "Kubernetes",
      "Communication",
      "Ideation"
    ],
    "verifiedSkills": [
      "Ideation",
      "FastAPI",
      "TypeScript",
      "Docker",
      "JavaScript",
      "Kubernetes"
    ],
    "github": "priyareddy",
    "linkedin": "priyareddy",
    "website": "",
    "social": {
      "github": "priyareddy",
      "linkedin": "priyareddy",
      "website": ""
    },
    "interests": [
      "FinTech",
      "Automation",
      "Defence",
      "Bioinformatics",
      "Quantum Computing"
    ],
    "domains": [
      "Aerospace",
      "Cybersecurity",
      "Logistics"
    ],
    "projects": [
      {
        "name": "Realtime Collaborative IDE",
        "desc": "In-browser multi-user IDE supporting live operational transformation.",
        "tech": [
          "TypeScript",
          "Node.js",
          "WebSockets",
          "React"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Cloud Native Compiler Platform",
        "desc": "Distributed remote code execution engine with container sandbox isolation.",
        "tech": [
          "Python",
          "Docker",
          "Kubernetes",
          "React"
        ],
        "role": "Software Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 11,
      "commits": 379,
      "stars": 43,
      "followers": 11,
      "following": 43
    },
    "github_stats": {
      "repos": 11,
      "commits": 379,
      "stars": 43,
      "followers": 11,
      "following": 43
    },
    "profileCompletion": 78
  },
  {
    "id": "8d64530c-b109-44d6-898f-58a15a3429d0",
    "name": "Tarun Sengupta",
    "username": "tarun_sengupta_91",
    "email": "tarun.sengupta@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=tarun_sengupta_91",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Computer Science Engineering",
    "bio": "Interested in Precision Agriculture, Wearable Tech, and Nanotechnology. Active hackathon builder.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Python",
      "JavaScript",
      "Git",
      "React",
      "Node.js",
      "C++",
      "Docker",
      "Java",
      "Team Leadership",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Java",
      "Git",
      "Node.js",
      "JavaScript",
      "Docker",
      "Rapid Prototyping",
      "Team Leadership"
    ],
    "github": "tarunsengupta",
    "linkedin": "",
    "website": "tarunsengupta.dev",
    "social": {
      "github": "tarunsengupta",
      "linkedin": "",
      "website": "tarunsengupta.dev"
    },
    "interests": [
      "Precision Agriculture",
      "Wearable Tech",
      "Nanotechnology",
      "Manufacturing",
      "Gaming",
      "Hydrology"
    ],
    "domains": [
      "EdTech",
      "AI/ML",
      "FinTech"
    ],
    "projects": [
      {
        "name": "Low-Latency Micro-Ledger",
        "desc": "High-throughput audit transaction engine with cryptographic proofs.",
        "tech": [
          "Rust",
          "PostgreSQL",
          "Docker"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Microservice Telemetry Mesh",
        "desc": "Observability suite with metrics tracing and fault injection for web microservices.",
        "tech": [
          "Go",
          "Docker",
          "PostgreSQL",
          "Prometheus"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Realtime Collaborative IDE",
        "desc": "In-browser multi-user IDE supporting live operational transformation.",
        "tech": [
          "TypeScript",
          "Node.js",
          "WebSockets",
          "React"
        ],
        "role": "Software Engineer"
      },
      {
        "name": "Cloud Native Compiler Platform",
        "desc": "Distributed remote code execution engine with container sandbox isolation.",
        "tech": [
          "Python",
          "Docker",
          "Kubernetes",
          "React"
        ],
        "role": "Software Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 28,
      "commits": 368,
      "stars": 27,
      "followers": 78,
      "following": 9
    },
    "github_stats": {
      "repos": 28,
      "commits": 368,
      "stars": 27,
      "followers": 78,
      "following": 9
    },
    "profileCompletion": 91
  },
  {
    "id": "dd0434a4-56fe-447b-b4a9-5d07504606b3",
    "name": "Meenakshi Sundaram",
    "username": "meenakshi_sundaram_24",
    "email": "meenakshi.sundaram@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=meenakshi_sundaram_24",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "1st Year",
    "branch": "Information Technology",
    "bio": "Information Technology student at NIT Trichy passionate about NLP and Embedded Systems.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Python",
      "Vue.js",
      "MySQL",
      "React",
      "Angular",
      "Java",
      "MongoDB",
      "Tailwind CSS",
      "Communication"
    ],
    "verifiedSkills": [
      "Communication",
      "React",
      "Vue.js"
    ],
    "github": "meenakshisundaram",
    "linkedin": "meenakshisundaram",
    "website": "meenakshisundaram.dev",
    "social": {
      "github": "meenakshisundaram",
      "linkedin": "meenakshisundaram",
      "website": "meenakshisundaram.dev"
    },
    "interests": [
      "NLP",
      "Embedded Systems",
      "Avionics",
      "Artificial Intelligence",
      "High Performance Computing"
    ],
    "domains": [
      "Design",
      "Web",
      "FinTech"
    ],
    "projects": [
      {
        "name": "Peer-to-Peer Notes Sharing Network",
        "desc": "Decentralized file-sharing network for academic study materials.",
        "tech": [
          "Node.js",
          "MongoDB",
          "React"
        ],
        "role": "Full Stack Developer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 4,
      "commits": 143,
      "stars": 36,
      "followers": 12,
      "following": 10
    },
    "github_stats": {
      "repos": 4,
      "commits": 143,
      "stars": 36,
      "followers": 12,
      "following": 10
    },
    "profileCompletion": 91
  },
  {
    "id": "075a80d5-043a-4b43-bdea-b48fad26e8ff",
    "name": "Devendra Pillai",
    "username": "devendra_pillai_70",
    "email": "devendra.pillai@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=devendra_pillai_70",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Information Technology",
    "bio": "Building sustainable and scalable solutions in Agritech. 3rd Year at NIT Trichy.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "AWS",
      "REST API",
      "MySQL",
      "Angular",
      "Vue.js",
      "Express.js",
      "Python",
      "Rapid Prototyping",
      "Presentation"
    ],
    "verifiedSkills": [
      "Presentation",
      "Rapid Prototyping",
      "AWS",
      "REST API"
    ],
    "github": "",
    "linkedin": "",
    "website": "devendrapillai.dev",
    "social": {
      "github": "",
      "linkedin": "",
      "website": "devendrapillai.dev"
    },
    "interests": [
      "Agritech",
      "Microelectronics",
      "Generative AI",
      "Digital Twins"
    ],
    "domains": [
      "IoT",
      "Logistics",
      "Web",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "Campus Smart Resource Portal",
        "desc": "Centralized platform for equipment booking, library tracking, and hall scheduling.",
        "tech": [
          "React",
          "Express.js",
          "MongoDB",
          "Node.js"
        ],
        "role": "Full Stack Developer"
      },
      {
        "name": "Peer-to-Peer Notes Sharing Network",
        "desc": "Decentralized file-sharing network for academic study materials.",
        "tech": [
          "Node.js",
          "MongoDB",
          "React"
        ],
        "role": "Full Stack Developer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 86
  },
  {
    "id": "2434dd7a-db32-4b60-8025-8a694d181b79",
    "name": "Pooja Rao",
    "username": "pooja_rao_40",
    "email": "pooja.rao@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=pooja_rao_40",
    "university": "Anna University Regional Campus",
    "college": "Anna University",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Information Technology",
    "bio": "Interested in Supply Chain, Assistive Tech, and Sustainable Materials. Active hackathon builder.",
    "status": "IN_TEAM",
    "skills": [
      "AWS",
      "React",
      "MongoDB",
      "Angular",
      "MySQL",
      "Tailwind CSS",
      "Team Leadership",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "Team Leadership"
    ],
    "github": "poojarao",
    "linkedin": "poojarao",
    "website": "poojarao.dev",
    "social": {
      "github": "poojarao",
      "linkedin": "poojarao",
      "website": "poojarao.dev"
    },
    "interests": [
      "Supply Chain",
      "Assistive Tech",
      "Sustainable Materials",
      "Blockchain",
      "Autonomous Driving"
    ],
    "domains": [
      "FinTech",
      "AI/ML",
      "Civil",
      "Aerospace"
    ],
    "projects": [],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 9,
      "commits": 117,
      "stars": 34,
      "followers": 59,
      "following": 13
    },
    "github_stats": {
      "repos": 9,
      "commits": 117,
      "stars": 34,
      "followers": 59,
      "following": 13
    },
    "profileCompletion": 77
  },
  {
    "id": "c2340382-6c27-4270-9883-0b8b961fe8c0",
    "name": "Pranav Bhattacharya",
    "username": "pranav_bhattacharya_19",
    "email": "pranav.bhattacharya@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=pranav_bhattacharya_19",
    "university": "SASTRA Deemed University",
    "college": "SASTRA",
    "city": "Thanjavur",
    "district": "Thanjavur",
    "state": "Tamil Nadu",
    "location": "Thanjavur, Tamil Nadu",
    "year": "4th Year",
    "branch": "Artificial Intelligence & Data Science",
    "bio": "Artificial Intelligence & Data Science student at SASTRA passionate about Wearable Tech and Healthcare.",
    "status": "OFFLINE",
    "skills": [
      "Python",
      "Prompt Engineering",
      "Tableau",
      "R",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "R",
      "Team Leadership"
    ],
    "github": "pranavbhattacharya",
    "linkedin": "pranavbhattacharya",
    "website": "",
    "social": {
      "github": "pranavbhattacharya",
      "linkedin": "pranavbhattacharya",
      "website": ""
    },
    "interests": [
      "Wearable Tech",
      "Healthcare",
      "Cloud Computing",
      "Bioinformatics"
    ],
    "domains": [
      "Civil",
      "CleanTech"
    ],
    "projects": [
      {
        "name": "Financial Fraud Detector",
        "desc": "Real-time stream transaction anomaly classification using ensemble models.",
        "tech": [
          "Python",
          "Scikit-Learn",
          "SQL",
          "Pandas"
        ],
        "role": "Data Scientist"
      },
      {
        "name": "Automated Medical Image Classifier",
        "desc": "Diagnostic assistant for chest X-ray abnormalities using deep convolutional nets.",
        "tech": [
          "Python",
          "PyTorch",
          "OpenCV",
          "FastAPI"
        ],
        "role": "Data Scientist"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 25,
      "commits": 394,
      "stars": 35,
      "followers": 64,
      "following": 14
    },
    "github_stats": {
      "repos": 25,
      "commits": 394,
      "stars": 35,
      "followers": 64,
      "following": 14
    },
    "profileCompletion": 93
  },
  {
    "id": "a9e6c11c-3ef9-49c5-89a2-63fe46ab235c",
    "name": "Shreya Varma",
    "username": "shreya_varma_79",
    "email": "shreya.varma@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=shreya_varma_79",
    "university": "PSG College of Technology",
    "college": "PSG Tech",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Artificial Intelligence & Data Science",
    "bio": "Building sustainable and scalable solutions in High Performance Computing. 2nd Year at PSG Tech.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Python",
      "SQL",
      "NLP",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "SQL"
    ],
    "github": "",
    "linkedin": "shreyavarma",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "shreyavarma",
      "website": ""
    },
    "interests": [
      "High Performance Computing",
      "Agritech",
      "Web3"
    ],
    "domains": [
      "FinTech",
      "IoT",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "Financial Fraud Detector",
        "desc": "Real-time stream transaction anomaly classification using ensemble models.",
        "tech": [
          "Python",
          "Scikit-Learn",
          "SQL",
          "Pandas"
        ],
        "role": "Data Scientist"
      },
      {
        "name": "Automated Medical Image Classifier",
        "desc": "Diagnostic assistant for chest X-ray abnormalities using deep convolutional nets.",
        "tech": [
          "Python",
          "PyTorch",
          "OpenCV",
          "FastAPI"
        ],
        "role": "Data Scientist"
      },
      {
        "name": "Customer Churn Predictive Pipeline",
        "desc": "End-to-end data pipeline feeding retention forecasters.",
        "tech": [
          "Python",
          "Tableau",
          "SQL",
          "R"
        ],
        "role": "Data Scientist"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 82
  },
  {
    "id": "e74cd5e6-4aad-460f-9ec1-a6eac48a4a58",
    "name": "Aditya Kulkarni",
    "username": "aditya_kulkarni_26",
    "email": "aditya.kulkarni@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=aditya_kulkarni_26",
    "university": "Manipal Institute of Technology",
    "college": "Manipal",
    "city": "Manipal",
    "district": "Udupi",
    "state": "Karnataka",
    "location": "Manipal, Karnataka",
    "year": "4th Year",
    "branch": "Artificial Intelligence & Data Science",
    "bio": "Interested in NLP, Social Impact, and Embedded Systems. Active hackathon builder.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Scikit-Learn",
      "R",
      "Python",
      "NLP",
      "Pandas",
      "OpenCV",
      "Prompt Engineering",
      "Tableau",
      "PyTorch",
      "TensorFlow",
      "Team Leadership",
      "Presentation"
    ],
    "verifiedSkills": [
      "NLP",
      "OpenCV"
    ],
    "github": "",
    "linkedin": "adityakulkarni",
    "website": "adityakulkarni.dev",
    "social": {
      "github": "",
      "linkedin": "adityakulkarni",
      "website": "adityakulkarni.dev"
    },
    "interests": [
      "NLP",
      "Social Impact",
      "Embedded Systems",
      "Logistics",
      "Telemedicine"
    ],
    "domains": [
      "Product",
      "Web",
      "EV",
      "Biotech"
    ],
    "projects": [
      {
        "name": "Automated Medical Image Classifier",
        "desc": "Diagnostic assistant for chest X-ray abnormalities using deep convolutional nets.",
        "tech": [
          "Python",
          "PyTorch",
          "OpenCV",
          "FastAPI"
        ],
        "role": "Data Scientist"
      },
      {
        "name": "Customer Churn Predictive Pipeline",
        "desc": "End-to-end data pipeline feeding retention forecasters.",
        "tech": [
          "Python",
          "Tableau",
          "SQL",
          "R"
        ],
        "role": "Data Scientist"
      },
      {
        "name": "Financial Fraud Detector",
        "desc": "Real-time stream transaction anomaly classification using ensemble models.",
        "tech": [
          "Python",
          "Scikit-Learn",
          "SQL",
          "Pandas"
        ],
        "role": "Data Scientist"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 89
  },
  {
    "id": "88b163f6-0154-462a-85b1-8dccb2071ff2",
    "name": "Ritu Choudhury",
    "username": "ritu_choudhury_36",
    "email": "ritu.choudhury@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ritu_choudhury_36",
    "university": "Madras Institute of Technology",
    "college": "MIT Chennai",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Artificial Intelligence & Machine Learning",
    "bio": "Artificial Intelligence & Machine Learning student at MIT Chennai passionate about Micro-Mobility and Supply Chain.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "LlamaIndex",
      "HuggingFace",
      "LangChain",
      "Python",
      "CrewAI",
      "RAG",
      "Deep Learning",
      "Problem Solving",
      "Communication"
    ],
    "verifiedSkills": [
      "LangChain",
      "CrewAI",
      "HuggingFace"
    ],
    "github": "",
    "linkedin": "rituchoudhury",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "rituchoudhury",
      "website": ""
    },
    "interests": [
      "Micro-Mobility",
      "Supply Chain",
      "Hydroponics",
      "Machine Learning",
      "ClimateTech",
      "EdTech"
    ],
    "domains": [
      "Healthcare",
      "AI/ML",
      "Aerospace",
      "EV"
    ],
    "projects": [
      {
        "name": "Agentic Research Assistant",
        "desc": "Autonomous multi-agent system summarizing research papers into structured graphs.",
        "tech": [
          "Python",
          "LangChain",
          "Agentic AI",
          "RAG",
          "CrewAI"
        ],
        "role": "AI Engineer"
      },
      {
        "name": "Local Multi-Modal RAG Engine",
        "desc": "Privacy-focused document Q&A runner using local quantized LLMs.",
        "tech": [
          "Python",
          "LlamaIndex",
          "Vector Embeddings",
          "HuggingFace"
        ],
        "role": "AI Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 98
  },
  {
    "id": "f65e9bc5-57b3-4f96-ab99-5e425d46456e",
    "name": "Akash Deshmukh",
    "username": "akash_deshmukh_55",
    "email": "akash.deshmukh@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=akash_deshmukh_55",
    "university": "Kongu Engineering College",
    "college": "Kongu",
    "city": "Erode",
    "district": "Erode",
    "state": "Tamil Nadu",
    "location": "Erode, Tamil Nadu",
    "year": "1st Year",
    "branch": "Artificial Intelligence & Machine Learning",
    "bio": "Building sustainable and scalable solutions in DevOps. 1st Year at Kongu.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "RAG",
      "LlamaIndex",
      "Agentic AI",
      "TensorFlow",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "TensorFlow"
    ],
    "github": "",
    "linkedin": "akashdeshmukh",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "akashdeshmukh",
      "website": ""
    },
    "interests": [
      "DevOps",
      "Satellite Communication",
      "Assistive Tech"
    ],
    "domains": [
      "IoT",
      "CleanTech",
      "Cybersecurity",
      "Civil"
    ],
    "projects": [
      {
        "name": "Agentic Research Assistant",
        "desc": "Autonomous multi-agent system summarizing research papers into structured graphs.",
        "tech": [
          "Python",
          "LangChain",
          "Agentic AI",
          "RAG",
          "CrewAI"
        ],
        "role": "AI Engineer"
      },
      {
        "name": "Neural Code Refactoring Agent",
        "desc": "Autonomous code cleanup tool using fine-tuned transformer architectures.",
        "tech": [
          "Python",
          "PyTorch",
          "Prompt Engineering",
          "FastAPI"
        ],
        "role": "AI Engineer"
      },
      {
        "name": "Local Multi-Modal RAG Engine",
        "desc": "Privacy-focused document Q&A runner using local quantized LLMs.",
        "tech": [
          "Python",
          "LlamaIndex",
          "Vector Embeddings",
          "HuggingFace"
        ],
        "role": "AI Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 96
  },
  {
    "id": "68850a10-ff2d-4844-b456-e19c970488a0",
    "name": "Sneha Mehta",
    "username": "sneha_mehta_39",
    "email": "sneha.mehta@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sneha_mehta_39",
    "university": "Thiagarajar College of Engineering",
    "college": "Thiagarajar",
    "city": "Madurai",
    "district": "Madurai",
    "state": "Tamil Nadu",
    "location": "Madurai, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Artificial Intelligence & Machine Learning",
    "bio": "Interested in Precision Agriculture, Drone Technology, and IoT. Active hackathon builder.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Agentic AI",
      "RAG",
      "LangChain",
      "PyTorch",
      "Vector Embeddings",
      "TensorFlow",
      "Communication",
      "Ideation"
    ],
    "verifiedSkills": [
      "TensorFlow",
      "Agentic AI",
      "Communication",
      "LangChain"
    ],
    "github": "",
    "linkedin": "",
    "website": "snehamehta.dev",
    "social": {
      "github": "",
      "linkedin": "",
      "website": "snehamehta.dev"
    },
    "interests": [
      "Precision Agriculture",
      "Drone Technology",
      "IoT",
      "Sustainability"
    ],
    "domains": [
      "Mechanical",
      "Aerospace",
      "Agritech",
      "Robotics"
    ],
    "projects": [
      {
        "name": "Neural Code Refactoring Agent",
        "desc": "Autonomous code cleanup tool using fine-tuned transformer architectures.",
        "tech": [
          "Python",
          "PyTorch",
          "Prompt Engineering",
          "FastAPI"
        ],
        "role": "AI Engineer"
      },
      {
        "name": "Agentic Research Assistant",
        "desc": "Autonomous multi-agent system summarizing research papers into structured graphs.",
        "tech": [
          "Python",
          "LangChain",
          "Agentic AI",
          "RAG",
          "CrewAI"
        ],
        "role": "AI Engineer"
      },
      {
        "name": "Local Multi-Modal RAG Engine",
        "desc": "Privacy-focused document Q&A runner using local quantized LLMs.",
        "tech": [
          "Python",
          "LlamaIndex",
          "Vector Embeddings",
          "HuggingFace"
        ],
        "role": "AI Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 83
  },
  {
    "id": "8b45903d-f859-457f-8517-b7b0cb85a48a",
    "name": "Siddharth Banerjee",
    "username": "siddharth_banerjee_10",
    "email": "siddharth.banerjee@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=siddharth_banerjee_10",
    "university": "Karunya Institute of Technology and Sciences",
    "college": "Karunya",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Electronics & Communication Engineering",
    "bio": "Electronics & Communication Engineering student at Karunya passionate about Wearable Tech and E-Commerce.",
    "status": "OFFLINE",
    "skills": [
      "STM32",
      "ESP32",
      "C++",
      "Signal Processing",
      "Verilog",
      "Arduino",
      "Communication"
    ],
    "verifiedSkills": [
      "Verilog",
      "C++",
      "Signal Processing"
    ],
    "github": "siddharthbanerjee",
    "linkedin": "",
    "website": "siddharthbanerjee.dev",
    "social": {
      "github": "siddharthbanerjee",
      "linkedin": "",
      "website": "siddharthbanerjee.dev"
    },
    "interests": [
      "Wearable Tech",
      "E-Commerce",
      "Micro-Mobility",
      "Electric Vehicles",
      "Research"
    ],
    "domains": [
      "Civil",
      "Cybersecurity",
      "EV"
    ],
    "projects": [
      {
        "name": "SDR Ground Station Decoder",
        "desc": "Software defined radio receiver tracking weather satellites in orbit.",
        "tech": [
          "C++",
          "MATLAB",
          "Signal Processing",
          "FPGA"
        ],
        "role": "Embedded Engineer"
      },
      {
        "name": "LoRaWAN Mesh Weather Array",
        "desc": "Long-range distributed environmental sensor node mesh for agriculture.",
        "tech": [
          "ESP32",
          "Arduino",
          "PCB Design",
          "C++"
        ],
        "role": "Embedded Engineer"
      },
      {
        "name": "Smart ECG Telemetry Patch",
        "desc": "Low-power wearable biosensor broadcasting real-time arrhythmia warnings.",
        "tech": [
          "Embedded C",
          "STM32",
          "PCB Design",
          "BLE"
        ],
        "role": "Embedded Engineer"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 12,
      "commits": 166,
      "stars": 13,
      "followers": 57,
      "following": 42
    },
    "github_stats": {
      "repos": 12,
      "commits": 166,
      "stars": 13,
      "followers": 57,
      "following": 42
    },
    "profileCompletion": 86
  },
  {
    "id": "f1371c2b-d4f4-49e6-af42-977e4a370bf5",
    "name": "Tanvi Hegde",
    "username": "tanvi_hegde_70",
    "email": "tanvi.hegde@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=tanvi_hegde_70",
    "university": "KPR Institute of Engineering and Technology",
    "college": "KPR",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "4th Year",
    "branch": "Electronics & Communication Engineering",
    "bio": "Building sustainable and scalable solutions in Green Building. 4th Year at KPR.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Verilog",
      "FPGA",
      "VHDL",
      "STM32",
      "C++",
      "ESP32",
      "Arduino",
      "Team Leadership",
      "Communication"
    ],
    "verifiedSkills": [
      "Verilog",
      "Communication"
    ],
    "github": "tanvihegde",
    "linkedin": "tanvihegde",
    "website": "tanvihegde.dev",
    "social": {
      "github": "tanvihegde",
      "linkedin": "tanvihegde",
      "website": "tanvihegde.dev"
    },
    "interests": [
      "Green Building",
      "Telemedicine",
      "EdTech",
      "Green Mobility"
    ],
    "domains": [
      "Robotics",
      "Civil",
      "Design"
    ],
    "projects": [
      {
        "name": "Smart ECG Telemetry Patch",
        "desc": "Low-power wearable biosensor broadcasting real-time arrhythmia warnings.",
        "tech": [
          "Embedded C",
          "STM32",
          "PCB Design",
          "BLE"
        ],
        "role": "Embedded Engineer"
      },
      {
        "name": "SDR Ground Station Decoder",
        "desc": "Software defined radio receiver tracking weather satellites in orbit.",
        "tech": [
          "C++",
          "MATLAB",
          "Signal Processing",
          "FPGA"
        ],
        "role": "Embedded Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 23,
      "commits": 372,
      "stars": 0,
      "followers": 15,
      "following": 32
    },
    "github_stats": {
      "repos": 23,
      "commits": 372,
      "stars": 0,
      "followers": 15,
      "following": 32
    },
    "profileCompletion": 77
  },
  {
    "id": "26223b4e-f7fb-44af-b779-ee91d39509a7",
    "name": "Manish Roy",
    "username": "manish_roy_25",
    "email": "manish.roy@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=manish_roy_25",
    "university": "SASTRA Deemed University",
    "college": "SASTRA",
    "city": "Thanjavur",
    "district": "Thanjavur",
    "state": "Tamil Nadu",
    "location": "Thanjavur, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Electronics & Communication Engineering",
    "bio": "Interested in EdTech, DeepTech, and Web3. Active hackathon builder.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "FPGA",
      "Verilog",
      "Signal Processing",
      "STM32",
      "Arduino",
      "PCB Design",
      "VHDL",
      "ESP32",
      "Simulink",
      "MATLAB",
      "Team Leadership",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Arduino",
      "STM32",
      "Rapid Prototyping",
      "Simulink",
      "ESP32",
      "PCB Design",
      "Verilog",
      "Signal Processing"
    ],
    "github": "manishroy",
    "linkedin": "",
    "website": "manishroy.dev",
    "social": {
      "github": "manishroy",
      "linkedin": "",
      "website": "manishroy.dev"
    },
    "interests": [
      "EdTech",
      "DeepTech",
      "Web3",
      "BioTech",
      "Satellite Communication",
      "Autonomous Systems"
    ],
    "domains": [
      "EdTech",
      "Healthcare",
      "Product",
      "FinTech"
    ],
    "projects": [
      {
        "name": "LoRaWAN Mesh Weather Array",
        "desc": "Long-range distributed environmental sensor node mesh for agriculture.",
        "tech": [
          "ESP32",
          "Arduino",
          "PCB Design",
          "C++"
        ],
        "role": "Embedded Engineer"
      },
      {
        "name": "SDR Ground Station Decoder",
        "desc": "Software defined radio receiver tracking weather satellites in orbit.",
        "tech": [
          "C++",
          "MATLAB",
          "Signal Processing",
          "FPGA"
        ],
        "role": "Embedded Engineer"
      },
      {
        "name": "Smart ECG Telemetry Patch",
        "desc": "Low-power wearable biosensor broadcasting real-time arrhythmia warnings.",
        "tech": [
          "Embedded C",
          "STM32",
          "PCB Design",
          "BLE"
        ],
        "role": "Embedded Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 25,
      "commits": 129,
      "stars": 4,
      "followers": 55,
      "following": 31
    },
    "github_stats": {
      "repos": 25,
      "commits": 129,
      "stars": 4,
      "followers": 55,
      "following": 31
    },
    "profileCompletion": 96
  },
  {
    "id": "3aa9e83f-9407-49dd-bb68-44e046573db9",
    "name": "Divya Menon",
    "username": "divya_menon_63",
    "email": "divya.menon@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=divya_menon_63",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "1st Year",
    "branch": "Electrical Engineering",
    "bio": "Electrical Engineering student at VIT passionate about Smart Infrastructure and Manufacturing.",
    "status": "OFFLINE",
    "skills": [
      "Proteus",
      "Power Electronics",
      "Control Systems",
      "Presentation"
    ],
    "verifiedSkills": [
      "Presentation",
      "Power Electronics"
    ],
    "github": "",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Smart Infrastructure",
      "Manufacturing",
      "BioTech",
      "Industry 4.0"
    ],
    "domains": [
      "Web",
      "Civil",
      "Agritech"
    ],
    "projects": [
      {
        "name": "Microgrid Solar Power Inverter",
        "desc": "Grid-tied inverter with maximum power point tracking and SCADA monitoring.",
        "tech": [
          "PLC",
          "SCADA",
          "Simulink",
          "MATLAB"
        ],
        "role": "Electrical Systems Engineer"
      },
      {
        "name": "Industrial Automation Conveyor Guard",
        "desc": "Safety Interlock and speed regulator for heavy material handling.",
        "tech": [
          "PLC",
          "LabVIEW",
          "Control Systems"
        ],
        "role": "Electrical Systems Engineer"
      },
      {
        "name": "EV Smart Charging Load Balancer",
        "desc": "Dynamic load distribution controller preventing sub-station overloads.",
        "tech": [
          "Siemens TIA Portal",
          "PLC",
          "Power Electronics"
        ],
        "role": "Electrical Systems Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 91
  },
  {
    "id": "e649d778-4f86-4007-9cb7-ebe51f531c66",
    "name": "Abhinav Narayan",
    "username": "abhinav_narayan_13",
    "email": "abhinav.narayan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=abhinav_narayan_13",
    "university": "Coimbatore Institute of Technology",
    "college": "CIT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Electrical Engineering",
    "bio": "Building sustainable and scalable solutions in MedTech. 3rd Year at CIT.",
    "status": "IN_TEAM",
    "skills": [
      "Control Systems",
      "Siemens TIA Portal",
      "PLC",
      "MATLAB",
      "LabVIEW",
      "Team Leadership",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "PLC",
      "MATLAB",
      "Rapid Prototyping"
    ],
    "github": "abhinavnarayan",
    "linkedin": "abhinavnarayan",
    "website": "abhinavnarayan.dev",
    "social": {
      "github": "abhinavnarayan",
      "linkedin": "abhinavnarayan",
      "website": "abhinavnarayan.dev"
    },
    "interests": [
      "MedTech",
      "FinTech",
      "Green Building",
      "Generative AI",
      "Embedded Systems",
      "Blockchain"
    ],
    "domains": [
      "IoT",
      "EdTech",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "Industrial Automation Conveyor Guard",
        "desc": "Safety Interlock and speed regulator for heavy material handling.",
        "tech": [
          "PLC",
          "LabVIEW",
          "Control Systems"
        ],
        "role": "Electrical Systems Engineer"
      },
      {
        "name": "Microgrid Solar Power Inverter",
        "desc": "Grid-tied inverter with maximum power point tracking and SCADA monitoring.",
        "tech": [
          "PLC",
          "SCADA",
          "Simulink",
          "MATLAB"
        ],
        "role": "Electrical Systems Engineer"
      },
      {
        "name": "EV Smart Charging Load Balancer",
        "desc": "Dynamic load distribution controller preventing sub-station overloads.",
        "tech": [
          "Siemens TIA Portal",
          "PLC",
          "Power Electronics"
        ],
        "role": "Electrical Systems Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 3,
      "commits": 338,
      "stars": 9,
      "followers": 32,
      "following": 13
    },
    "github_stats": {
      "repos": 3,
      "commits": 338,
      "stars": 9,
      "followers": 32,
      "following": 13
    },
    "profileCompletion": 78
  },
  {
    "id": "7f3eecd2-0620-4f87-83c0-3604e8bbeb96",
    "name": "Kriti Nair",
    "username": "kriti_nair_57",
    "email": "kriti.nair@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=kriti_nair_57",
    "university": "KPR Institute of Engineering and Technology",
    "college": "KPR",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "1st Year",
    "branch": "Electrical Engineering",
    "bio": "Interested in Sustainability, Logistics, and High Performance Computing. Active hackathon builder.",
    "status": "OFFLINE",
    "skills": [
      "Siemens TIA Portal",
      "MATLAB",
      "SCADA",
      "PLC",
      "Ideation",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Rapid Prototyping",
      "MATLAB",
      "Siemens TIA Portal",
      "SCADA"
    ],
    "github": "kritinair",
    "linkedin": "kritinair",
    "website": "",
    "social": {
      "github": "kritinair",
      "linkedin": "kritinair",
      "website": ""
    },
    "interests": [
      "Sustainability",
      "Logistics",
      "High Performance Computing",
      "Renewable Energy"
    ],
    "domains": [
      "AI/ML",
      "Aerospace",
      "Mechanical",
      "Agritech"
    ],
    "projects": [],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 23,
      "commits": 194,
      "stars": 0,
      "followers": 55,
      "following": 36
    },
    "github_stats": {
      "repos": 23,
      "commits": 194,
      "stars": 0,
      "followers": 55,
      "following": 36
    },
    "profileCompletion": 98
  },
  {
    "id": "2b9a90d7-2e2e-4096-b75d-70225b6167e0",
    "name": "Srikant Mukherjee",
    "username": "srikant_mukherjee_68",
    "email": "srikant.mukherjee@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=srikant_mukherjee_68",
    "university": "Kumaraguru College of Technology",
    "college": "Kumaraguru",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "4th Year",
    "branch": "Mechanical Engineering",
    "bio": "Mechanical Engineering student at Kumaraguru passionate about Digital Health and CleanTech.",
    "status": "IN_TEAM",
    "skills": [
      "FEA",
      "ANSYS",
      "Thermodynamics",
      "3D Printing",
      "Creo",
      "Communication",
      "Ideation"
    ],
    "verifiedSkills": [
      "Thermodynamics",
      "ANSYS",
      "FEA"
    ],
    "github": "srikantmukherjee",
    "linkedin": "srikantmukherjee",
    "website": "",
    "social": {
      "github": "srikantmukherjee",
      "linkedin": "srikantmukherjee",
      "website": ""
    },
    "interests": [
      "Digital Health",
      "CleanTech",
      "Sustainable Materials",
      "Waste Management",
      "Telemedicine"
    ],
    "domains": [
      "Civil",
      "Agritech",
      "Web",
      "IoT"
    ],
    "projects": [
      {
        "name": "Generative Drone Frame Assembly",
        "desc": "Weight-minimized carbon composite arm joint created via generative CAD.",
        "tech": [
          "CATIA",
          "Creo",
          "GD&T"
        ],
        "role": "CAD Engineer"
      },
      {
        "name": "Autonomous Agricultural Rover Chassis",
        "desc": "Lightweight FEA-optimized structural frame for field robotics.",
        "tech": [
          "SolidWorks",
          "ANSYS",
          "FEA",
          "3D Printing"
        ],
        "role": "CAD Engineer"
      },
      {
        "name": "EV Battery Thermal Management System",
        "desc": "Liquid cooling plate design evaluated using computational fluid dynamics.",
        "tech": [
          "Fusion 360",
          "CFD",
          "Heat Transfer",
          "Thermodynamics"
        ],
        "role": "CAD Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 9,
      "commits": 201,
      "stars": 16,
      "followers": 45,
      "following": 22
    },
    "github_stats": {
      "repos": 9,
      "commits": 201,
      "stars": 16,
      "followers": 45,
      "following": 22
    },
    "profileCompletion": 93
  },
  {
    "id": "04988768-5f3f-4001-b1e2-cccf6434f729",
    "name": "Anjali Gupta",
    "username": "anjali_gupta_62",
    "email": "anjali.gupta@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=anjali_gupta_62",
    "university": "Amrita Vishwa Vidyapeetham",
    "college": "Amrita",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Mechanical Engineering",
    "bio": "Building sustainable and scalable solutions in Green Building. 2nd Year at Amrita.",
    "status": "OFFLINE",
    "skills": [
      "3D Printing",
      "Thermodynamics",
      "CFD",
      "SolidWorks",
      "FEA",
      "CATIA",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "CFD",
      "CATIA"
    ],
    "github": "anjaligupta",
    "linkedin": "anjaligupta",
    "website": "",
    "social": {
      "github": "anjaligupta",
      "linkedin": "anjaligupta",
      "website": ""
    },
    "interests": [
      "Green Building",
      "Micro-Mobility",
      "Avionics",
      "Renewable Grid",
      "Supply Chain"
    ],
    "domains": [
      "Logistics",
      "Agritech",
      "Aerospace",
      "Design"
    ],
    "projects": [
      {
        "name": "Generative Drone Frame Assembly",
        "desc": "Weight-minimized carbon composite arm joint created via generative CAD.",
        "tech": [
          "CATIA",
          "Creo",
          "GD&T"
        ],
        "role": "CAD Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 11,
      "commits": 138,
      "stars": 7,
      "followers": 26,
      "following": 25
    },
    "github_stats": {
      "repos": 11,
      "commits": 138,
      "stars": 7,
      "followers": 26,
      "following": 25
    },
    "profileCompletion": 75
  },
  {
    "id": "44011eff-1033-4636-b423-249db19d35c4",
    "name": "Arvind Kapoor",
    "username": "arvind_kapoor_34",
    "email": "arvind.kapoor@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=arvind_kapoor_34",
    "university": "Kongu Engineering College",
    "college": "Kongu",
    "city": "Erode",
    "district": "Erode",
    "state": "Tamil Nadu",
    "location": "Erode, Tamil Nadu",
    "year": "4th Year",
    "branch": "Mechanical Engineering",
    "bio": "Interested in Quantum Computing, Cybersecurity, and Blockchain. Active hackathon builder.",
    "status": "IN_TEAM",
    "skills": [
      "CFD",
      "FEA",
      "ANSYS",
      "Fusion 360",
      "CNC Programming",
      "3D Printing",
      "CATIA",
      "Presentation"
    ],
    "verifiedSkills": [
      "CNC Programming",
      "CFD"
    ],
    "github": "arvindkapoor",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "arvindkapoor",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Quantum Computing",
      "Cybersecurity",
      "Blockchain",
      "Micro-Mobility"
    ],
    "domains": [
      "Healthcare",
      "Design",
      "FinTech"
    ],
    "projects": [
      {
        "name": "EV Battery Thermal Management System",
        "desc": "Liquid cooling plate design evaluated using computational fluid dynamics.",
        "tech": [
          "Fusion 360",
          "CFD",
          "Heat Transfer",
          "Thermodynamics"
        ],
        "role": "CAD Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 18,
      "commits": 265,
      "stars": 28,
      "followers": 45,
      "following": 16
    },
    "github_stats": {
      "repos": 18,
      "commits": 265,
      "stars": 28,
      "followers": 45,
      "following": 16
    },
    "profileCompletion": 96
  },
  {
    "id": "0e5fe7e2-af95-46e2-bf8f-a08bcb198d14",
    "name": "Pallavi Saxena",
    "username": "pallavi_saxena_18",
    "email": "pallavi.saxena@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=pallavi_saxena_18",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Civil Engineering",
    "bio": "Civil Engineering student at VIT passionate about Synthetic Biology and High Performance Computing.",
    "status": "IN_TEAM",
    "skills": [
      "Hydrology",
      "STAAD Pro",
      "SAP2000",
      "ETABS",
      "Problem Solving",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Problem Solving"
    ],
    "github": "pallavisaxena",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "pallavisaxena",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Synthetic Biology",
      "High Performance Computing",
      "Smart Grids",
      "Manufacturing",
      "Geo-Tech",
      "Bioinformatics"
    ],
    "domains": [
      "Biotech",
      "EV",
      "Mechanical"
    ],
    "projects": [
      {
        "name": "Sustainable Campus Stormwater Network",
        "desc": "Hydrological runoff model and underground retention reservoir plan.",
        "tech": [
          "AutoCAD Civil 3D",
          "GIS",
          "Hydrology"
        ],
        "role": "Structural Engineer"
      },
      {
        "name": "Seismic Resilient High-Rise Frame",
        "desc": "30-story structural concrete core modeled under dynamic earthquake loading.",
        "tech": [
          "ETABS",
          "STAAD Pro",
          "Structural Analysis"
        ],
        "role": "Structural Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 4,
      "commits": 332,
      "stars": 6,
      "followers": 28,
      "following": 45
    },
    "github_stats": {
      "repos": 4,
      "commits": 332,
      "stars": 6,
      "followers": 28,
      "following": 45
    },
    "profileCompletion": 75
  },
  {
    "id": "8e6faa10-2480-4c61-97e1-c320efa565fd",
    "name": "Harish Joshi",
    "username": "harish_joshi_80",
    "email": "harish.joshi@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=harish_joshi_80",
    "university": "Coimbatore Institute of Technology",
    "college": "CIT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "1st Year",
    "branch": "Civil Engineering",
    "bio": "Building sustainable and scalable solutions in Automation. 1st Year at CIT.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Structural Analysis",
      "BIM (Building Information Modeling)",
      "GIS",
      "Problem Solving",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "GIS",
      "Problem Solving"
    ],
    "github": "harishjoshi",
    "linkedin": "",
    "website": "harishjoshi.dev",
    "social": {
      "github": "harishjoshi",
      "linkedin": "",
      "website": "harishjoshi.dev"
    },
    "interests": [
      "Automation",
      "Drone Technology",
      "VLSI"
    ],
    "domains": [
      "Robotics",
      "Mechanical",
      "FinTech",
      "CleanTech"
    ],
    "projects": [],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 11,
      "commits": 443,
      "stars": 9,
      "followers": 11,
      "following": 8
    },
    "github_stats": {
      "repos": 11,
      "commits": 443,
      "stars": 9,
      "followers": 11,
      "following": 8
    },
    "profileCompletion": 93
  },
  {
    "id": "261a2b64-84c8-4f62-aab8-f89183729d9f",
    "name": "Bhavana Malhotra",
    "username": "bhavana_malhotra_82",
    "email": "bhavana.malhotra@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=bhavana_malhotra_82",
    "university": "College of Engineering Guindy",
    "college": "CEG",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Civil Engineering",
    "bio": "Interested in Synthetic Biology, MedTech, and Robotics. Active hackathon builder.",
    "status": "IN_TEAM",
    "skills": [
      "BIM (Building Information Modeling)",
      "AutoCAD Civil 3D",
      "Structural Analysis",
      "SAP2000",
      "Rapid Prototyping",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "SAP2000"
    ],
    "github": "bhavanamalhotra",
    "linkedin": "bhavanamalhotra",
    "website": "",
    "social": {
      "github": "bhavanamalhotra",
      "linkedin": "bhavanamalhotra",
      "website": ""
    },
    "interests": [
      "Synthetic Biology",
      "MedTech",
      "Robotics",
      "SpaceTech",
      "Automation"
    ],
    "domains": [
      "Web",
      "CleanTech",
      "AI/ML",
      "Civil"
    ],
    "projects": [
      {
        "name": "Prefabricated Modular Housing BIM Model",
        "desc": "Fully parametric building information model for rapid disaster shelter deployment.",
        "tech": [
          "Revit",
          "BIM (Building Information Modeling)",
          "SAP2000"
        ],
        "role": "Structural Engineer"
      },
      {
        "name": "Sustainable Campus Stormwater Network",
        "desc": "Hydrological runoff model and underground retention reservoir plan.",
        "tech": [
          "AutoCAD Civil 3D",
          "GIS",
          "Hydrology"
        ],
        "role": "Structural Engineer"
      },
      {
        "name": "Seismic Resilient High-Rise Frame",
        "desc": "30-story structural concrete core modeled under dynamic earthquake loading.",
        "tech": [
          "ETABS",
          "STAAD Pro",
          "Structural Analysis"
        ],
        "role": "Structural Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 23,
      "commits": 246,
      "stars": 17,
      "followers": 25,
      "following": 42
    },
    "github_stats": {
      "repos": 23,
      "commits": 246,
      "stars": 17,
      "followers": 25,
      "following": 42
    },
    "profileCompletion": 83
  },
  {
    "id": "31af78ed-9dda-4632-a904-96cb721a1963",
    "name": "Sanjeev Singhania",
    "username": "sanjeev_singhania_52",
    "email": "sanjeev.singhania@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sanjeev_singhania_52",
    "university": "Madras Institute of Technology",
    "college": "MIT Chennai",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Mechatronics",
    "bio": "Mechatronics student at MIT Chennai passionate about Wearable Tech and Hydrology.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "SolidWorks",
      "Embedded C",
      "MATLAB",
      "PLC",
      "Automation",
      "Ideation",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "SolidWorks",
      "MATLAB",
      "Ideation",
      "Automation"
    ],
    "github": "sanjeevsinghania",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "sanjeevsinghania",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Wearable Tech",
      "Hydrology",
      "Artificial Intelligence"
    ],
    "domains": [
      "Logistics",
      "Biotech",
      "Mechanical",
      "Web"
    ],
    "projects": [
      {
        "name": "Quadruped Bio-Inspired Leg Actuator",
        "desc": "Custom torque-dense actuator module built for mobile legged platforms.",
        "tech": [
          "Embedded C",
          "MATLAB",
          "SolidWorks",
          "PCB Design"
        ],
        "role": "Mechatronics Engineer"
      },
      {
        "name": "Autonomous Sorting Robotic Arm",
        "desc": "5-DOF robotic manipulator sorting warehouse items via computer vision.",
        "tech": [
          "ROS2",
          "Arduino",
          "SolidWorks",
          "OpenCV"
        ],
        "role": "Mechatronics Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 22,
      "commits": 407,
      "stars": 31,
      "followers": 58,
      "following": 8
    },
    "github_stats": {
      "repos": 22,
      "commits": 407,
      "stars": 31,
      "followers": 58,
      "following": 8
    },
    "profileCompletion": 98
  },
  {
    "id": "d0813615-73e8-428e-a989-f63bf8f97a8d",
    "name": "Priyanka Agarwal",
    "username": "priyanka_agarwal_99",
    "email": "priyanka.agarwal@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=priyanka_agarwal_99",
    "university": "Amrita Vishwa Vidyapeetham",
    "college": "Amrita",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "4th Year",
    "branch": "Mechatronics",
    "bio": "Building sustainable and scalable solutions in Manufacturing. 4th Year at Amrita.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Automation",
      "Sensors",
      "Raspberry Pi",
      "Presentation"
    ],
    "verifiedSkills": [
      "Presentation"
    ],
    "github": "",
    "linkedin": "priyankaagarwal",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "priyankaagarwal",
      "website": ""
    },
    "interests": [
      "Manufacturing",
      "ClimateTech",
      "Sustainable Materials"
    ],
    "domains": [
      "Healthcare",
      "Design"
    ],
    "projects": [
      {
        "name": "Quadruped Bio-Inspired Leg Actuator",
        "desc": "Custom torque-dense actuator module built for mobile legged platforms.",
        "tech": [
          "Embedded C",
          "MATLAB",
          "SolidWorks",
          "PCB Design"
        ],
        "role": "Mechatronics Engineer"
      },
      {
        "name": "Automated CNC Tool Ingestion Loader",
        "desc": "Pneumatic pick-and-place gantry with encoder feedback.",
        "tech": [
          "PLC",
          "Mechatronics Design",
          "Sensors"
        ],
        "role": "Mechatronics Engineer"
      },
      {
        "name": "Autonomous Sorting Robotic Arm",
        "desc": "5-DOF robotic manipulator sorting warehouse items via computer vision.",
        "tech": [
          "ROS2",
          "Arduino",
          "SolidWorks",
          "OpenCV"
        ],
        "role": "Mechatronics Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 87
  },
  {
    "id": "ce5c719e-0eba-4ee2-9b14-0345a49fc6d3",
    "name": "Sourav Subramanian",
    "username": "sourav_subramanian_28",
    "email": "sourav.subramanian@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sourav_subramanian_28",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Mechatronics",
    "bio": "Interested in Automation, Assistive Tech, and Cybersecurity. Active hackathon builder.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Arduino",
      "ROS2",
      "PLC",
      "Embedded C",
      "Automation",
      "Simulink",
      "MATLAB",
      "ROS",
      "Sensors",
      "SolidWorks",
      "Raspberry Pi",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "ROS",
      "Simulink",
      "Raspberry Pi",
      "Sensors",
      "MATLAB",
      "Embedded C",
      "PLC",
      "ROS2",
      "Automation"
    ],
    "github": "souravsubramanian",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "souravsubramanian",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Automation",
      "Assistive Tech",
      "Cybersecurity",
      "Autonomous Systems",
      "Green Building",
      "Bioinformatics"
    ],
    "domains": [
      "Healthcare",
      "Design",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "Autonomous Sorting Robotic Arm",
        "desc": "5-DOF robotic manipulator sorting warehouse items via computer vision.",
        "tech": [
          "ROS2",
          "Arduino",
          "SolidWorks",
          "OpenCV"
        ],
        "role": "Mechatronics Engineer"
      },
      {
        "name": "Automated CNC Tool Ingestion Loader",
        "desc": "Pneumatic pick-and-place gantry with encoder feedback.",
        "tech": [
          "PLC",
          "Mechatronics Design",
          "Sensors"
        ],
        "role": "Mechatronics Engineer"
      },
      {
        "name": "Quadruped Bio-Inspired Leg Actuator",
        "desc": "Custom torque-dense actuator module built for mobile legged platforms.",
        "tech": [
          "Embedded C",
          "MATLAB",
          "SolidWorks",
          "PCB Design"
        ],
        "role": "Mechatronics Engineer"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 13,
      "commits": 71,
      "stars": 28,
      "followers": 14,
      "following": 38
    },
    "github_stats": {
      "repos": 13,
      "commits": 71,
      "stars": 28,
      "followers": 14,
      "following": 38
    },
    "profileCompletion": 72
  },
  {
    "id": "c04f993f-4455-4dc5-80f8-c549868d0354",
    "name": "Archana Mahajan",
    "username": "archana_mahajan_70",
    "email": "archana.mahajan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=archana_mahajan_70",
    "university": "Anna University Regional Campus",
    "college": "Anna University",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Robotics",
    "bio": "Robotics student at Anna University passionate about Social Impact and Cloud Computing.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Motion Planning",
      "ROS2",
      "OpenCV",
      "SLAM",
      "Gazebo",
      "Autonomous Navigation",
      "Python",
      "ROS",
      "Robotics Kinematics",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "SLAM",
      "ROS2",
      "Python",
      "Motion Planning",
      "Autonomous Navigation"
    ],
    "github": "archanamahajan",
    "linkedin": "archanamahajan",
    "website": "",
    "social": {
      "github": "archanamahajan",
      "linkedin": "archanamahajan",
      "website": ""
    },
    "interests": [
      "Social Impact",
      "Cloud Computing",
      "Logistics"
    ],
    "domains": [
      "AI/ML",
      "Agritech"
    ],
    "projects": [],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 14,
      "commits": 240,
      "stars": 9,
      "followers": 33,
      "following": 38
    },
    "github_stats": {
      "repos": 14,
      "commits": 240,
      "stars": 9,
      "followers": 33,
      "following": 38
    },
    "profileCompletion": 75
  },
  {
    "id": "cd66922d-c11d-445c-8359-6d83c64885f1",
    "name": "Sandeep Trivedi",
    "username": "sandeep_trivedi_32",
    "email": "sandeep.trivedi@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sandeep_trivedi_32",
    "university": "Coimbatore Institute of Technology",
    "college": "CIT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Robotics",
    "bio": "Building sustainable and scalable solutions in Remote Sensing. 3rd Year at CIT.",
    "status": "OFFLINE",
    "skills": [
      "Sensor Fusion",
      "Python",
      "Robotics Kinematics",
      "Gazebo",
      "ROS2",
      "Motion Planning",
      "Autonomous Navigation",
      "OpenCV",
      "SLAM",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "SLAM",
      "Robotics Kinematics",
      "Python",
      "Gazebo",
      "Rapid Prototyping"
    ],
    "github": "sandeeptrivedi",
    "linkedin": "sandeeptrivedi",
    "website": "",
    "social": {
      "github": "sandeeptrivedi",
      "linkedin": "sandeeptrivedi",
      "website": ""
    },
    "interests": [
      "Remote Sensing",
      "Supply Chain",
      "MedTech",
      "Green Mobility",
      "Logistics"
    ],
    "domains": [
      "Civil",
      "Design"
    ],
    "projects": [
      {
        "name": "Autonomous Warehouse AM Rover",
        "desc": "Differential drive robot executing SLAM mapping and dynamic obstacle avoidance.",
        "tech": [
          "ROS",
          "ROS2",
          "Gazebo",
          "Python",
          "SLAM"
        ],
        "role": "Robotics Engineer"
      },
      {
        "name": "Visual Inertial Drone Odometry",
        "desc": "Monocular camera and IMU sensor fusion suite for GPS-denied environments.",
        "tech": [
          "C++",
          "OpenCV",
          "Autonomous Navigation",
          "Sensor Fusion"
        ],
        "role": "Robotics Engineer"
      },
      {
        "name": "Subterranean Inspection Crawler",
        "desc": "Rugged tracked platform exploring hazardous pipes autonomously.",
        "tech": [
          "ROS2",
          "Motion Planning",
          "Gazebo"
        ],
        "role": "Robotics Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 21,
      "commits": 203,
      "stars": 36,
      "followers": 39,
      "following": 49
    },
    "github_stats": {
      "repos": 21,
      "commits": 203,
      "stars": 36,
      "followers": 39,
      "following": 49
    },
    "profileCompletion": 97
  },
  {
    "id": "8adc503c-cbb2-41a7-bd6f-2bcec950aea0",
    "name": "Megha Bhatia",
    "username": "megha_bhatia_97",
    "email": "megha.bhatia@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=megha_bhatia_97",
    "university": "PSG College of Technology",
    "college": "PSG Tech",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "1st Year",
    "branch": "Robotics",
    "bio": "Interested in IoT, Precision Agriculture, and Nanotechnology. Active hackathon builder.",
    "status": "OFFLINE",
    "skills": [
      "C++",
      "Python",
      "OpenCV",
      "Sensor Fusion",
      "Autonomous Navigation",
      "ROS2",
      "Motion Planning",
      "Gazebo",
      "Robotics Kinematics",
      "ROS",
      "Communication"
    ],
    "verifiedSkills": [
      "Autonomous Navigation"
    ],
    "github": "meghabhatia",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "meghabhatia",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "IoT",
      "Precision Agriculture",
      "Nanotechnology",
      "Electric Vehicles",
      "SpaceTech",
      "E-Commerce"
    ],
    "domains": [
      "Mechanical",
      "Cybersecurity",
      "Robotics"
    ],
    "projects": [
      {
        "name": "Visual Inertial Drone Odometry",
        "desc": "Monocular camera and IMU sensor fusion suite for GPS-denied environments.",
        "tech": [
          "C++",
          "OpenCV",
          "Autonomous Navigation",
          "Sensor Fusion"
        ],
        "role": "Robotics Engineer"
      },
      {
        "name": "Subterranean Inspection Crawler",
        "desc": "Rugged tracked platform exploring hazardous pipes autonomously.",
        "tech": [
          "ROS2",
          "Motion Planning",
          "Gazebo"
        ],
        "role": "Robotics Engineer"
      },
      {
        "name": "Autonomous Warehouse AM Rover",
        "desc": "Differential drive robot executing SLAM mapping and dynamic obstacle avoidance.",
        "tech": [
          "ROS",
          "ROS2",
          "Gazebo",
          "Python",
          "SLAM"
        ],
        "role": "Robotics Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 19,
      "commits": 276,
      "stars": 17,
      "followers": 23,
      "following": 21
    },
    "github_stats": {
      "repos": 19,
      "commits": 276,
      "stars": 17,
      "followers": 23,
      "following": 21
    },
    "profileCompletion": 74
  },
  {
    "id": "d3ced1b7-92b3-466b-92fa-4d0f7d7ebdfa",
    "name": "Sameer Patil",
    "username": "sameer_patil_38",
    "email": "sameer.patil@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sameer_patil_38",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "4th Year",
    "branch": "Automobile Engineering",
    "bio": "Automobile Engineering student at VIT passionate about Telemedicine and Manufacturing.",
    "status": "OFFLINE",
    "skills": [
      "ANSYS",
      "Battery Management",
      "SolidWorks",
      "CATIA",
      "Electric Drive Systems",
      "CFD",
      "MATLAB",
      "AutoCAD",
      "Ideation",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Battery Management",
      "CATIA",
      "AutoCAD",
      "ANSYS",
      "Electric Drive Systems",
      "CFD"
    ],
    "github": "sameerpatil",
    "linkedin": "sameerpatil",
    "website": "sameerpatil.dev",
    "social": {
      "github": "sameerpatil",
      "linkedin": "sameerpatil",
      "website": "sameerpatil.dev"
    },
    "interests": [
      "Telemedicine",
      "Manufacturing",
      "GIS Mapping",
      "Agritech",
      "Remote Sensing"
    ],
    "domains": [
      "EV",
      "Mechanical",
      "FinTech"
    ],
    "projects": [
      {
        "name": "Active Aerodynamic Wing Actuator",
        "desc": "Speed-sensitive rear wing controller lowering high-speed drag.",
        "tech": [
          "ANSYS",
          "CFD",
          "CAN Bus",
          "Arduino"
        ],
        "role": "Automotive & EV Engineer"
      },
      {
        "name": "Regenerative Braking Power Recuperator",
        "desc": "KERS energy recovery simulation for urban electric buses.",
        "tech": [
          "MATLAB",
          "Simulink",
          "Battery Management"
        ],
        "role": "Automotive & EV Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 12,
      "commits": 272,
      "stars": 7,
      "followers": 14,
      "following": 20
    },
    "github_stats": {
      "repos": 12,
      "commits": 272,
      "stars": 7,
      "followers": 14,
      "following": 20
    },
    "profileCompletion": 100
  },
  {
    "id": "c4b5cf54-8f46-49df-b8f1-81ee738e55e4",
    "name": "Pavithra Das",
    "username": "pavithra_das_99",
    "email": "pavithra.das@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=pavithra_das_99",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Automobile Engineering",
    "bio": "Building sustainable and scalable solutions in Nanotechnology. 2nd Year at NIT Trichy.",
    "status": "IN_TEAM",
    "skills": [
      "Battery Management",
      "ANSYS",
      "CFD",
      "Electric Drive Systems",
      "MATLAB",
      "Problem Solving",
      "Presentation"
    ],
    "verifiedSkills": [
      "Electric Drive Systems",
      "Presentation"
    ],
    "github": "pavithradas",
    "linkedin": "pavithradas",
    "website": "",
    "social": {
      "github": "pavithradas",
      "linkedin": "pavithradas",
      "website": ""
    },
    "interests": [
      "Nanotechnology",
      "Defence",
      "Edge Computing",
      "Embedded Systems"
    ],
    "domains": [
      "Aerospace",
      "AI/ML",
      "Civil",
      "Healthcare"
    ],
    "projects": [
      {
        "name": "Active Aerodynamic Wing Actuator",
        "desc": "Speed-sensitive rear wing controller lowering high-speed drag.",
        "tech": [
          "ANSYS",
          "CFD",
          "CAN Bus",
          "Arduino"
        ],
        "role": "Automotive & EV Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 5,
      "commits": 359,
      "stars": 13,
      "followers": 78,
      "following": 6
    },
    "github_stats": {
      "repos": 5,
      "commits": 359,
      "stars": 13,
      "followers": 78,
      "following": 6
    },
    "profileCompletion": 95
  },
  {
    "id": "5b3a219d-f774-40a3-8e53-cefbbd95c1b7",
    "name": "Alok Nambiar",
    "username": "alok_nambiar_82",
    "email": "alok.nambiar@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=alok_nambiar_82",
    "university": "Kongu Engineering College",
    "college": "Kongu",
    "city": "Erode",
    "district": "Erode",
    "state": "Tamil Nadu",
    "location": "Erode, Tamil Nadu",
    "year": "4th Year",
    "branch": "Automobile Engineering",
    "bio": "Interested in DevOps, ClimateTech, and Agentic Systems. Active hackathon builder.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "AutoCAD",
      "MATLAB",
      "Vehicle Dynamics",
      "CATIA",
      "ANSYS",
      "Electric Drive Systems",
      "Presentation"
    ],
    "verifiedSkills": [
      "MATLAB",
      "ANSYS"
    ],
    "github": "",
    "linkedin": "aloknambiar",
    "website": "aloknambiar.dev",
    "social": {
      "github": "",
      "linkedin": "aloknambiar",
      "website": "aloknambiar.dev"
    },
    "interests": [
      "DevOps",
      "ClimateTech",
      "Agentic Systems",
      "Robotics",
      "Electric Vehicles"
    ],
    "domains": [
      "Aerospace",
      "IoT"
    ],
    "projects": [
      {
        "name": "Active Aerodynamic Wing Actuator",
        "desc": "Speed-sensitive rear wing controller lowering high-speed drag.",
        "tech": [
          "ANSYS",
          "CFD",
          "CAN Bus",
          "Arduino"
        ],
        "role": "Automotive & EV Engineer"
      },
      {
        "name": "Sub-Compact EV Drivetrain Model",
        "desc": "Single-speed reduction gearbox and electric motor matching calculation.",
        "tech": [
          "CATIA",
          "MATLAB",
          "Vehicle Dynamics",
          "SolidWorks"
        ],
        "role": "Automotive & EV Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 83
  },
  {
    "id": "7e41e4a1-e1f5-4811-b5ee-7d004b7f594a",
    "name": "Rashmi Goel",
    "username": "rashmi_goel_77",
    "email": "rashmi.goel@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=rashmi_goel_77",
    "university": "Government College of Technology",
    "college": "GCT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Chemical Engineering",
    "bio": "Chemical Engineering student at GCT passionate about Green Mobility and GIS Mapping.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Thermodynamics",
      "Polymer Chemistry",
      "Fluid Mechanics",
      "Chemical Reaction Engineering",
      "ASPEN Plus",
      "MATLAB",
      "Ideation"
    ],
    "verifiedSkills": [
      "MATLAB"
    ],
    "github": "",
    "linkedin": "rashmigoel",
    "website": "rashmigoel.dev",
    "social": {
      "github": "",
      "linkedin": "rashmigoel",
      "website": "rashmigoel.dev"
    },
    "interests": [
      "Green Mobility",
      "GIS Mapping",
      "Robotics",
      "Healthcare",
      "Battery Tech"
    ],
    "domains": [
      "Mechanical",
      "FinTech",
      "Design"
    ],
    "projects": [
      {
        "name": "Industrial Effluent Membrane Filtration",
        "desc": "Reverse osmosis wastewater treatment plant for textile dyes.",
        "tech": [
          "Chemical Reaction Engineering",
          "Heat Transfer",
          "MATLAB"
        ],
        "role": "Process Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 72
  },
  {
    "id": "42564104-e8ad-4e44-b9ff-89862dfd35d2",
    "name": "Rohan Wagh",
    "username": "rohan_wagh_26",
    "email": "rohan.wagh@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=rohan_wagh_26",
    "university": "Anna University Regional Campus",
    "college": "Anna University",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Chemical Engineering",
    "bio": "Building sustainable and scalable solutions in Green Mobility. 1st Year at Anna University.",
    "status": "OFFLINE",
    "skills": [
      "Process Engineering",
      "Heat Transfer",
      "Chemical Reaction Engineering",
      "Thermodynamics",
      "Fluid Mechanics",
      "MATLAB",
      "Polymer Chemistry",
      "ASPEN Plus",
      "Communication"
    ],
    "verifiedSkills": [
      "Communication",
      "Thermodynamics",
      "ASPEN Plus",
      "Polymer Chemistry",
      "Heat Transfer",
      "MATLAB"
    ],
    "github": "rohanwagh",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "rohanwagh",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Green Mobility",
      "Wearable Tech",
      "Urban Planning",
      "Defence",
      "Autonomous Systems"
    ],
    "domains": [
      "Agritech",
      "CleanTech",
      "Aerospace"
    ],
    "projects": [],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 5,
      "commits": 66,
      "stars": 5,
      "followers": 13,
      "following": 32
    },
    "github_stats": {
      "repos": 5,
      "commits": 66,
      "stars": 5,
      "followers": 13,
      "following": 32
    },
    "profileCompletion": 95
  },
  {
    "id": "78ae885f-c435-4649-9c08-d501a77bc648",
    "name": "Sowmya Pandey",
    "username": "sowmya_pandey_26",
    "email": "sowmya.pandey@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sowmya_pandey_26",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Chemical Engineering",
    "bio": "Interested in Agentic Systems, Battery Tech, and Manufacturing. Active hackathon builder.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Process Engineering",
      "Thermodynamics",
      "ASPEN Plus",
      "Heat Transfer",
      "Fluid Mechanics",
      "Chemical Reaction Engineering",
      "MATLAB",
      "Presentation"
    ],
    "verifiedSkills": [
      "Fluid Mechanics",
      "ASPEN Plus",
      "Process Engineering",
      "Presentation",
      "Thermodynamics"
    ],
    "github": "sowmyapandey",
    "linkedin": "",
    "website": "sowmyapandey.dev",
    "social": {
      "github": "sowmyapandey",
      "linkedin": "",
      "website": "sowmyapandey.dev"
    },
    "interests": [
      "Agentic Systems",
      "Battery Tech",
      "Manufacturing",
      "Sustainability"
    ],
    "domains": [
      "Logistics",
      "Aerospace",
      "FinTech"
    ],
    "projects": [
      {
        "name": "Green Hydrogen Electrolyzer Array",
        "desc": "Proton exchange membrane stack layout and heat exchange unit.",
        "tech": [
          "Thermodynamics",
          "Process Engineering"
        ],
        "role": "Process Engineer"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 7,
    "githubStats": {
      "repos": 28,
      "commits": 239,
      "stars": 35,
      "followers": 80,
      "following": 48
    },
    "github_stats": {
      "repos": 28,
      "commits": 239,
      "stars": 35,
      "followers": 80,
      "following": 48
    },
    "profileCompletion": 78
  },
  {
    "id": "277d73e1-a781-4bdf-a6f2-d6c53560bc03",
    "name": "Ishaan Swaminathan",
    "username": "ishaan_swaminathan_13",
    "email": "ishaan.swaminathan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ishaan_swaminathan_13",
    "university": "KPR Institute of Engineering and Technology",
    "college": "KPR",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Biotechnology",
    "bio": "Biotechnology student at KPR passionate about Green Mobility and Microelectronics.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Bioprocess Engineering",
      "CRISPR",
      "Bioinformatics",
      "Python",
      "R",
      "Microbiology",
      "Molecular Biology",
      "Genomics",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Bioprocess Engineering",
      "CRISPR",
      "Microbiology",
      "R",
      "Genomics",
      "Python"
    ],
    "github": "",
    "linkedin": "ishaanswaminathan",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "ishaanswaminathan",
      "website": ""
    },
    "interests": [
      "Green Mobility",
      "Microelectronics",
      "NLP",
      "Edge Computing",
      "Smart Agriculture",
      "Cyber Defence"
    ],
    "domains": [
      "EdTech",
      "AI/ML",
      "Healthcare",
      "Logistics"
    ],
    "projects": [
      {
        "name": "Microbial Fuel Cell Yield Monitor",
        "desc": "Sensory rig tracking bio-electricity output from wastewater bacteria.",
        "tech": [
          "Microbiology",
          "Bioprocess Engineering",
          "Data Analysis"
        ],
        "role": "Bioinformatics Researcher"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 83
  },
  {
    "id": "6ccd1f6a-9887-4159-94ae-a8daf672d1a8",
    "name": "Diya Sen",
    "username": "diya_sen_72",
    "email": "diya.sen@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=diya_sen_72",
    "university": "BITS Pilani Hyderabad Campus",
    "college": "BITS Pilani",
    "city": "Hyderabad",
    "district": "Hyderabad",
    "state": "Telangana",
    "location": "Hyderabad, Telangana",
    "year": "4th Year",
    "branch": "Biotechnology",
    "bio": "Building sustainable and scalable solutions in High Performance Computing. 4th Year at BITS Pilani.",
    "status": "IN_TEAM",
    "skills": [
      "Bioprocess Engineering",
      "Genomics",
      "Molecular Biology",
      "Microbiology",
      "Python",
      "Bioinformatics",
      "Problem Solving",
      "Presentation"
    ],
    "verifiedSkills": [
      "Presentation",
      "Python",
      "Bioinformatics",
      "Molecular Biology",
      "Bioprocess Engineering",
      "Microbiology"
    ],
    "github": "diyasen",
    "linkedin": "diyasen",
    "website": "diyasen.dev",
    "social": {
      "github": "diyasen",
      "linkedin": "diyasen",
      "website": "diyasen.dev"
    },
    "interests": [
      "High Performance Computing",
      "Healthcare",
      "Artificial Intelligence",
      "Entrepreneurship",
      "Logistics",
      "Smart Cities"
    ],
    "domains": [
      "CleanTech",
      "EV"
    ],
    "projects": [
      {
        "name": "Recombinant Protein Expression Assay",
        "desc": "High-efficiency bacterial culture protocol for therapeutic enzymes.",
        "tech": [
          "Molecular Biology",
          "CRISPR"
        ],
        "role": "Bioinformatics Researcher"
      },
      {
        "name": "CRISPR Off-Target Predictive Tool",
        "desc": "Bioinformatics sequence parser identifying non-specific gene edits.",
        "tech": [
          "Python",
          "Bioinformatics",
          "Genomics",
          "R"
        ],
        "role": "Bioinformatics Researcher"
      },
      {
        "name": "Microbial Fuel Cell Yield Monitor",
        "desc": "Sensory rig tracking bio-electricity output from wastewater bacteria.",
        "tech": [
          "Microbiology",
          "Bioprocess Engineering",
          "Data Analysis"
        ],
        "role": "Bioinformatics Researcher"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 18,
      "commits": 402,
      "stars": 27,
      "followers": 24,
      "following": 13
    },
    "github_stats": {
      "repos": 18,
      "commits": 402,
      "stars": 27,
      "followers": 24,
      "following": 13
    },
    "profileCompletion": 97
  },
  {
    "id": "fcccb7c6-a8a4-4e69-9db9-8f40d2b5cea2",
    "name": "Raghunath Krishnan",
    "username": "raghunath_krishnan_15",
    "email": "raghunath.krishnan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=raghunath_krishnan_15",
    "university": "SRM Institute of Science and Technology",
    "college": "SRM",
    "city": "Chennai",
    "district": "Chengalpattu",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Biotechnology",
    "bio": "Interested in Nanotechnology, SpaceTech, and Industry 4.0. Active hackathon builder.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "R",
      "CRISPR",
      "Bioprocess Engineering",
      "Genomics",
      "Molecular Biology",
      "Data Analysis",
      "Presentation",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "R",
      "Bioprocess Engineering",
      "CRISPR",
      "Molecular Biology"
    ],
    "github": "raghunathkrishnan",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "raghunathkrishnan",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Nanotechnology",
      "SpaceTech",
      "Industry 4.0",
      "Sustainability",
      "CleanTech",
      "Digital Twins"
    ],
    "domains": [
      "Product",
      "EdTech",
      "Civil"
    ],
    "projects": [
      {
        "name": "Recombinant Protein Expression Assay",
        "desc": "High-efficiency bacterial culture protocol for therapeutic enzymes.",
        "tech": [
          "Molecular Biology",
          "CRISPR"
        ],
        "role": "Bioinformatics Researcher"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 10,
      "commits": 190,
      "stars": 10,
      "followers": 11,
      "following": 37
    },
    "github_stats": {
      "repos": 10,
      "commits": 190,
      "stars": 10,
      "followers": 11,
      "following": 37
    },
    "profileCompletion": 98
  },
  {
    "id": "40627c66-b187-405d-94af-8fafe9314606",
    "name": "Meera Ahuja",
    "username": "meera_ahuja_54",
    "email": "meera.ahuja@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=meera_ahuja_54",
    "university": "SSN College of Engineering",
    "college": "SSN",
    "city": "Chennai",
    "district": "Kanchipuram",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Biomedical Engineering",
    "bio": "Biomedical Engineering student at SSN passionate about VLSI and Disaster Tech.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "LabVIEW",
      "Sensor Design",
      "Biomedical Instrumentation",
      "Signal Processing",
      "Ideation"
    ],
    "verifiedSkills": [
      "LabVIEW"
    ],
    "github": "meeraahuja",
    "linkedin": "meeraahuja",
    "website": "",
    "social": {
      "github": "meeraahuja",
      "linkedin": "meeraahuja",
      "website": ""
    },
    "interests": [
      "VLSI",
      "Disaster Tech",
      "Sustainable Materials",
      "Waste Management"
    ],
    "domains": [
      "Biotech",
      "Agritech",
      "Product",
      "EdTech"
    ],
    "projects": [],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 17,
      "commits": 343,
      "stars": 19,
      "followers": 37,
      "following": 42
    },
    "github_stats": {
      "repos": 17,
      "commits": 343,
      "stars": 19,
      "followers": 37,
      "following": 42
    },
    "profileCompletion": 79
  },
  {
    "id": "77a759a7-7170-48ba-bd51-11b2aced5eeb",
    "name": "Aravind Ranganathan",
    "username": "aravind_ranganathan_69",
    "email": "aravind.ranganathan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=aravind_ranganathan_69",
    "university": "SASTRA Deemed University",
    "college": "SASTRA",
    "city": "Thanjavur",
    "district": "Thanjavur",
    "state": "Tamil Nadu",
    "location": "Thanjavur, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Biomedical Engineering",
    "bio": "Building sustainable and scalable solutions in Precision Agriculture. 3rd Year at SASTRA.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "SolidWorks",
      "Signal Processing",
      "Biomedical Instrumentation",
      "Communication"
    ],
    "verifiedSkills": [
      "Communication"
    ],
    "github": "",
    "linkedin": "aravindranganathan",
    "website": "aravindranganathan.dev",
    "social": {
      "github": "",
      "linkedin": "aravindranganathan",
      "website": "aravindranganathan.dev"
    },
    "interests": [
      "Precision Agriculture",
      "Micro-Mobility",
      "Cybersecurity",
      "Digital Health",
      "Carbon Capture",
      "Autonomous Driving"
    ],
    "domains": [
      "Agritech",
      "Design"
    ],
    "projects": [
      {
        "name": "Non-Invasive Glucose Biosensor",
        "desc": "Optical near-infrared spectrophotometer measuring interstitial blood glucose.",
        "tech": [
          "MATLAB",
          "Medical Image Processing",
          "Medical AI",
          "Biomedical Instrumentation"
        ],
        "role": "Medical AI Specialist"
      },
      {
        "name": "Prosthetic Myoelectric Hand Controller",
        "desc": "Surface EMG pattern recognition decoding hand gesture intent.",
        "tech": [
          "Signal Processing",
          "Sensor Design",
          "LabVIEW"
        ],
        "role": "Medical AI Specialist"
      },
      {
        "name": "Smart ICU Patient Vital Predictor",
        "desc": "Predictive alert system flagging onset of septic shock.",
        "tech": [
          "Medical AI",
          "Python",
          "Biomedical Instrumentation"
        ],
        "role": "Medical AI Specialist"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 75
  },
  {
    "id": "affb040c-0796-49f8-b3db-6780d0e12bad",
    "name": "Shruti Shetty",
    "username": "shruti_shetty_15",
    "email": "shruti.shetty@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=shruti_shetty_15",
    "university": "Thiagarajar College of Engineering",
    "college": "Thiagarajar",
    "city": "Madurai",
    "district": "Madurai",
    "state": "Tamil Nadu",
    "location": "Madurai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Biomedical Engineering",
    "bio": "Interested in Satellite Communication, Defence, and Hydroponics. Active hackathon builder.",
    "status": "IN_TEAM",
    "skills": [
      "Biomedical Instrumentation",
      "Sensor Design",
      "Signal Processing",
      "SolidWorks",
      "Medical Image Processing",
      "LabVIEW",
      "Communication",
      "Ideation"
    ],
    "verifiedSkills": [
      "LabVIEW"
    ],
    "github": "",
    "linkedin": "",
    "website": "shrutishetty.dev",
    "social": {
      "github": "",
      "linkedin": "",
      "website": "shrutishetty.dev"
    },
    "interests": [
      "Satellite Communication",
      "Defence",
      "Hydroponics"
    ],
    "domains": [
      "Civil",
      "EV",
      "CleanTech",
      "Aerospace"
    ],
    "projects": [],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 74
  },
  {
    "id": "347dcda4-cc34-4117-be02-c3eeaaf8878f",
    "name": "Naveen Dutta",
    "username": "naveen_dutta_54",
    "email": "naveen.dutta@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=naveen_dutta_54",
    "university": "College of Engineering Guindy",
    "college": "CEG",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "4th Year",
    "branch": "Agricultural Engineering",
    "bio": "Agricultural Engineering student at CEG passionate about Hydrology and Nanotechnology.",
    "status": "IN_TEAM",
    "skills": [
      "GIS",
      "Soil Mechanics",
      "IOT Sensors",
      "Hydrology",
      "Team Leadership",
      "Ideation"
    ],
    "verifiedSkills": [
      "Ideation"
    ],
    "github": "naveendutta",
    "linkedin": "naveendutta",
    "website": "naveendutta.dev",
    "social": {
      "github": "naveendutta",
      "linkedin": "naveendutta",
      "website": "naveendutta.dev"
    },
    "interests": [
      "Hydrology",
      "Nanotechnology",
      "Generative AI",
      "Smart Agriculture",
      "Open Source",
      "Smart Cities"
    ],
    "domains": [
      "Design",
      "Robotics",
      "IoT"
    ],
    "projects": [
      {
        "name": "Hydroponic Nutrient Auto-Doser",
        "desc": "Closed-loop EC and pH control unit for greenhouse verti-farming.",
        "tech": [
          "AgriTech",
          "IOT Sensors",
          "Arduino"
        ],
        "role": "AgriTech Specialist"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 12,
      "commits": 423,
      "stars": 6,
      "followers": 66,
      "following": 39
    },
    "github_stats": {
      "repos": 12,
      "commits": 423,
      "stars": 6,
      "followers": 66,
      "following": 39
    },
    "profileCompletion": 74
  },
  {
    "id": "85821370-f883-484e-94ee-f6ae8dc26c65",
    "name": "Vandana Bhardwaj",
    "username": "vandana_bhardwaj_86",
    "email": "vandana.bhardwaj@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=vandana_bhardwaj_86",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Agricultural Engineering",
    "bio": "Building sustainable and scalable solutions in Digital Health. 2nd Year at VIT.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Precision Agriculture",
      "Python",
      "AgriTech",
      "Hydrology",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Python",
      "Hydrology"
    ],
    "github": "vandanabhardwaj",
    "linkedin": "vandanabhardwaj",
    "website": "",
    "social": {
      "github": "vandanabhardwaj",
      "linkedin": "vandanabhardwaj",
      "website": ""
    },
    "interests": [
      "Digital Health",
      "Automation",
      "Signal Processing",
      "Web3",
      "Smart Agriculture"
    ],
    "domains": [
      "Robotics",
      "Aerospace",
      "Biotech"
    ],
    "projects": [
      {
        "name": "Solar Powered Drip Irrigation Router",
        "desc": "Soil moisture driven automated solenoid network for arid farms.",
        "tech": [
          "IOT Sensors",
          "AgriTech",
          "AutoCAD"
        ],
        "role": "AgriTech Specialist"
      },
      {
        "name": "Autonomous Crop Health Mapping Drone",
        "desc": "Multispectral aerial imaging drone detecting nitrogen stress in crops.",
        "tech": [
          "Precision Agriculture",
          "GIS",
          "Drone Surveying",
          "Python"
        ],
        "role": "AgriTech Specialist"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 19,
      "commits": 290,
      "stars": 26,
      "followers": 22,
      "following": 17
    },
    "github_stats": {
      "repos": 19,
      "commits": 290,
      "stars": 26,
      "followers": 22,
      "following": 17
    },
    "profileCompletion": 97
  },
  {
    "id": "b92bae36-b338-429c-af78-0cbf3fb8795f",
    "name": "Dinesh Ghosh",
    "username": "dinesh_ghosh_57",
    "email": "dinesh.ghosh@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=dinesh_ghosh_57",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "4th Year",
    "branch": "Agricultural Engineering",
    "bio": "Interested in FinTech, Edge Computing, and Manufacturing. Active hackathon builder.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Python",
      "GIS",
      "Precision Agriculture",
      "AutoCAD",
      "IOT Sensors",
      "Drone Surveying",
      "Soil Mechanics",
      "AgriTech",
      "Problem Solving",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Drone Surveying",
      "Python",
      "Soil Mechanics",
      "Problem Solving",
      "AutoCAD",
      "IOT Sensors",
      "Precision Agriculture",
      "AgriTech"
    ],
    "github": "dineshghosh",
    "linkedin": "dineshghosh",
    "website": "",
    "social": {
      "github": "dineshghosh",
      "linkedin": "dineshghosh",
      "website": ""
    },
    "interests": [
      "FinTech",
      "Edge Computing",
      "Manufacturing",
      "Robotics",
      "Autonomous Systems",
      "Defence"
    ],
    "domains": [
      "Agritech",
      "Healthcare",
      "Product",
      "Web"
    ],
    "projects": [
      {
        "name": "Autonomous Crop Health Mapping Drone",
        "desc": "Multispectral aerial imaging drone detecting nitrogen stress in crops.",
        "tech": [
          "Precision Agriculture",
          "GIS",
          "Drone Surveying",
          "Python"
        ],
        "role": "AgriTech Specialist"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 7,
      "commits": 408,
      "stars": 45,
      "followers": 62,
      "following": 33
    },
    "github_stats": {
      "repos": 7,
      "commits": 408,
      "stars": 45,
      "followers": 62,
      "following": 33
    },
    "profileCompletion": 76
  },
  {
    "id": "9965fb9a-60f0-4faa-a4c2-69d5bf9b8f86",
    "name": "Radhika Naidu",
    "username": "radhika_naidu_29",
    "email": "radhika.naidu@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=radhika_naidu_29",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Aerospace Engineering",
    "bio": "Aerospace Engineering student at NIT Trichy passionate about E-Commerce and Supply Chain.",
    "status": "OFFLINE",
    "skills": [
      "CFD",
      "Simulink",
      "MATLAB",
      "CATIA",
      "ANSYS",
      "Aerodynamics",
      "SolidWorks",
      "Flight Mechanics",
      "Propulsion Systems",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "Problem Solving",
      "Propulsion Systems",
      "CFD",
      "Aerodynamics",
      "ANSYS",
      "SolidWorks",
      "Simulink",
      "MATLAB"
    ],
    "github": "",
    "linkedin": "",
    "website": "radhikanaidu.dev",
    "social": {
      "github": "",
      "linkedin": "",
      "website": "radhikanaidu.dev"
    },
    "interests": [
      "E-Commerce",
      "Supply Chain",
      "Artificial Intelligence",
      "Telemedicine"
    ],
    "domains": [
      "IoT",
      "Mechanical",
      "Cybersecurity"
    ],
    "projects": [
      {
        "name": "CubeSat Thermal Radiator Shield",
        "desc": "Passive thermal control system for LEO nanosatellite electronics.",
        "tech": [
          "ANSYS",
          "CFD",
          "Thermal Systems",
          "SolidWorks"
        ],
        "role": "Aerospace Systems Engineer"
      },
      {
        "name": "Micro-Turbojet Combustion Chamber",
        "desc": "Annular combustor designed for low emissions and high thrust-to-weight.",
        "tech": [
          "CATIA",
          "Simulink",
          "Flight Mechanics"
        ],
        "role": "Aerospace Systems Engineer"
      },
      {
        "name": "Supersonic Nozzle Flow Analyzer",
        "desc": "Variable geometry convergent-divergent nozzle CFD simulation.",
        "tech": [
          "Aerodynamics",
          "Propulsion Systems",
          "MATLAB"
        ],
        "role": "Aerospace Systems Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 90
  },
  {
    "id": "6c7ba5ab-e76c-4823-86d3-ecd291bf2b8e",
    "name": "Ashwin Tiwari",
    "username": "ashwin_tiwari_59",
    "email": "ashwin.tiwari@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ashwin_tiwari_59",
    "university": "SSN College of Engineering",
    "college": "SSN",
    "city": "Chennai",
    "district": "Kanchipuram",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Aerospace Engineering",
    "bio": "Building sustainable and scalable solutions in Cybersecurity. 1st Year at SSN.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Aerodynamics",
      "CFD",
      "SolidWorks",
      "Communication"
    ],
    "verifiedSkills": [
      "SolidWorks"
    ],
    "github": "ashwintiwari",
    "linkedin": "ashwintiwari",
    "website": "ashwintiwari.dev",
    "social": {
      "github": "ashwintiwari",
      "linkedin": "ashwintiwari",
      "website": "ashwintiwari.dev"
    },
    "interests": [
      "Cybersecurity",
      "Circular Economy",
      "Embedded Systems",
      "Microelectronics"
    ],
    "domains": [
      "Cybersecurity",
      "Biotech",
      "Design",
      "Agritech"
    ],
    "projects": [],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 25,
      "commits": 417,
      "stars": 29,
      "followers": 6,
      "following": 23
    },
    "github_stats": {
      "repos": 25,
      "commits": 417,
      "stars": 29,
      "followers": 6,
      "following": 23
    },
    "profileCompletion": 80
  },
  {
    "id": "99d675f5-481c-4a42-ab83-626ee52dd60c",
    "name": "Nivedita Kannan",
    "username": "nivedita_kannan_49",
    "email": "nivedita.kannan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=nivedita_kannan_49",
    "university": "Karunya Institute of Technology and Sciences",
    "college": "Karunya",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Aerospace Engineering",
    "bio": "Interested in FinTech, Supply Chain, and Industry 4.0. Active hackathon builder.",
    "status": "IN_TEAM",
    "skills": [
      "Simulink",
      "ANSYS",
      "MATLAB",
      "CATIA",
      "Propulsion Systems",
      "Structural Analysis",
      "Aerodynamics",
      "CFD",
      "SolidWorks",
      "Flight Mechanics",
      "Rapid Prototyping",
      "Communication"
    ],
    "verifiedSkills": [
      "Structural Analysis",
      "MATLAB",
      "CFD",
      "Flight Mechanics",
      "Communication",
      "Aerodynamics",
      "Propulsion Systems"
    ],
    "github": "niveditakannan",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "niveditakannan",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "FinTech",
      "Supply Chain",
      "Industry 4.0",
      "Synthetic Biology",
      "Open Source"
    ],
    "domains": [
      "EV",
      "Agritech",
      "FinTech",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "Supersonic Nozzle Flow Analyzer",
        "desc": "Variable geometry convergent-divergent nozzle CFD simulation.",
        "tech": [
          "Aerodynamics",
          "Propulsion Systems",
          "MATLAB"
        ],
        "role": "Aerospace Systems Engineer"
      },
      {
        "name": "Micro-Turbojet Combustion Chamber",
        "desc": "Annular combustor designed for low emissions and high thrust-to-weight.",
        "tech": [
          "CATIA",
          "Simulink",
          "Flight Mechanics"
        ],
        "role": "Aerospace Systems Engineer"
      },
      {
        "name": "CubeSat Thermal Radiator Shield",
        "desc": "Passive thermal control system for LEO nanosatellite electronics.",
        "tech": [
          "ANSYS",
          "CFD",
          "Thermal Systems",
          "SolidWorks"
        ],
        "role": "Aerospace Systems Engineer"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 12,
      "commits": 248,
      "stars": 38,
      "followers": 56,
      "following": 15
    },
    "github_stats": {
      "repos": 12,
      "commits": 248,
      "stars": 38,
      "followers": 56,
      "following": 15
    },
    "profileCompletion": 89
  },
  {
    "id": "0af9507d-81b9-4cf1-b44b-0dacf503dc2d",
    "name": "Chirag Mishra",
    "username": "chirag_mishra_65",
    "email": "chirag.mishra@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=chirag_mishra_65",
    "university": "Anna University Regional Campus",
    "college": "Anna University",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Industrial Engineering",
    "bio": "Industrial Engineering student at Anna University passionate about Electric Vehicles and Agritech.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "SQL",
      "Python",
      "Arena Simulation",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "Problem Solving"
    ],
    "github": "chiragmishra",
    "linkedin": "",
    "website": "chiragmishra.dev",
    "social": {
      "github": "chiragmishra",
      "linkedin": "",
      "website": "chiragmishra.dev"
    },
    "interests": [
      "Electric Vehicles",
      "Agritech",
      "Web3"
    ],
    "domains": [
      "Aerospace",
      "Logistics",
      "Civil",
      "EV"
    ],
    "projects": [
      {
        "name": "Global Logistics Carbon Tracking Dashboard",
        "desc": "Supply chain carbon footprint auditor with route optimization.",
        "tech": [
          "Python",
          "SQL",
          "Six Sigma"
        ],
        "role": "Operations Analyst"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 24,
      "commits": 250,
      "stars": 23,
      "followers": 49,
      "following": 33
    },
    "github_stats": {
      "repos": 24,
      "commits": 250,
      "stars": 23,
      "followers": 49,
      "following": 33
    },
    "profileCompletion": 81
  },
  {
    "id": "ce2ebc11-9397-4333-846e-1b97cad19e01",
    "name": "Saritha Rajan",
    "username": "saritha_rajan_60",
    "email": "saritha.rajan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=saritha_rajan_60",
    "university": "Madras Institute of Technology",
    "college": "MIT Chennai",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "4th Year",
    "branch": "Industrial Engineering",
    "bio": "Building sustainable and scalable solutions in Digital Health. 4th Year at MIT Chennai.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Supply Chain Analytics",
      "Operations Research",
      "Python",
      "Process Optimization",
      "Ideation",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Python"
    ],
    "github": "saritharajan",
    "linkedin": "saritharajan",
    "website": "saritharajan.dev",
    "social": {
      "github": "saritharajan",
      "linkedin": "saritharajan",
      "website": "saritharajan.dev"
    },
    "interests": [
      "Digital Health",
      "Smart Cities",
      "Telemedicine",
      "DeepTech",
      "Smart Infrastructure"
    ],
    "domains": [
      "FinTech",
      "Healthcare"
    ],
    "projects": [
      {
        "name": "Global Logistics Carbon Tracking Dashboard",
        "desc": "Supply chain carbon footprint auditor with route optimization.",
        "tech": [
          "Python",
          "SQL",
          "Six Sigma"
        ],
        "role": "Operations Analyst"
      },
      {
        "name": "Hospital Emergency Ward Bottleneck Model",
        "desc": "Discrete event simulation optimizing nurse allocation and triage time.",
        "tech": [
          "Arena Simulation",
          "Operations Research",
          "Process Optimization"
        ],
        "role": "Operations Analyst"
      },
      {
        "name": "Automated Fulfillment Warehouse Layout",
        "desc": "SLP-based facility layout reducing order retrieval transit times.",
        "tech": [
          "Supply Chain Analytics",
          "Lean Manufacturing",
          "Tableau"
        ],
        "role": "Operations Analyst"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 25,
      "commits": 247,
      "stars": 5,
      "followers": 42,
      "following": 47
    },
    "github_stats": {
      "repos": 25,
      "commits": 247,
      "stars": 5,
      "followers": 42,
      "following": 47
    },
    "profileCompletion": 92
  },
  {
    "id": "aae2087b-48ce-441f-8985-02e8fb5169ec",
    "name": "Eashan Sethi",
    "username": "eashan_sethi_99",
    "email": "eashan.sethi@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=eashan_sethi_99",
    "university": "Manipal Institute of Technology",
    "college": "Manipal",
    "city": "Manipal",
    "district": "Udupi",
    "state": "Karnataka",
    "location": "Manipal, Karnataka",
    "year": "2nd Year",
    "branch": "Industrial Engineering",
    "bio": "Interested in Interactive Media, Battery Tech, and Avionics. Active hackathon builder.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Python",
      "Six Sigma",
      "Operations Research",
      "Supply Chain Analytics",
      "Process Optimization",
      "Arena Simulation",
      "Tableau",
      "SQL",
      "Lean Manufacturing",
      "Rapid Prototyping",
      "Ideation"
    ],
    "verifiedSkills": [
      "Rapid Prototyping",
      "Six Sigma",
      "Ideation"
    ],
    "github": "",
    "linkedin": "eashansethi",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "eashansethi",
      "website": ""
    },
    "interests": [
      "Interactive Media",
      "Battery Tech",
      "Avionics",
      "Assistive Tech",
      "Carbon Capture"
    ],
    "domains": [
      "Healthcare",
      "Agritech"
    ],
    "projects": [
      {
        "name": "Global Logistics Carbon Tracking Dashboard",
        "desc": "Supply chain carbon footprint auditor with route optimization.",
        "tech": [
          "Python",
          "SQL",
          "Six Sigma"
        ],
        "role": "Operations Analyst"
      },
      {
        "name": "Automated Fulfillment Warehouse Layout",
        "desc": "SLP-based facility layout reducing order retrieval transit times.",
        "tech": [
          "Supply Chain Analytics",
          "Lean Manufacturing",
          "Tableau"
        ],
        "role": "Operations Analyst"
      },
      {
        "name": "Hospital Emergency Ward Bottleneck Model",
        "desc": "Discrete event simulation optimizing nurse allocation and triage time.",
        "tech": [
          "Arena Simulation",
          "Operations Research",
          "Process Optimization"
        ],
        "role": "Operations Analyst"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 88
  },
  {
    "id": "ed82829b-d814-4e03-b750-a41974852d40",
    "name": "Sangeetha Venkatesh",
    "username": "sangeetha_venkatesh_33",
    "email": "sangeetha.venkatesh@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sangeetha_venkatesh_33",
    "university": "Kumaraguru College of Technology",
    "college": "Kumaraguru",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "1st Year",
    "branch": "Instrumentation Engineering",
    "bio": "Instrumentation Engineering student at Kumaraguru passionate about MedTech and Startups.",
    "status": "IN_TEAM",
    "skills": [
      "LabVIEW",
      "PLC",
      "MATLAB",
      "Instrumentation Design",
      "SCADA",
      "Control Systems",
      "Signal Processing",
      "Communication",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Team Leadership",
      "SCADA",
      "Signal Processing"
    ],
    "github": "",
    "linkedin": "sangeethavenkatesh",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "sangeethavenkatesh",
      "website": ""
    },
    "interests": [
      "MedTech",
      "Startups",
      "Remote Sensing"
    ],
    "domains": [
      "CleanTech",
      "Healthcare",
      "EV",
      "Design"
    ],
    "projects": [
      {
        "name": "Smart Gas Leak Optical Detector",
        "desc": "NDIR sensor unit with wireless alarm reporting for chemical plants.",
        "tech": [
          "LabVIEW",
          "Sensors & Transducers",
          "PLC"
        ],
        "role": "Instrumentation Engineer"
      },
      {
        "name": "Ultra-Precise Vibration Calibration Rig",
        "desc": "Piezo-actuated shaker table for accelerometer calibration.",
        "tech": [
          "SCADA",
          "Signal Processing",
          "Instrumentation Design"
        ],
        "role": "Instrumentation Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 96
  },
  {
    "id": "0614b282-09f3-41f4-8c80-cd26922cefb7",
    "name": "Ganesh Jain",
    "username": "ganesh_jain_13",
    "email": "ganesh.jain@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ganesh_jain_13",
    "university": "Coimbatore Institute of Technology",
    "college": "CIT",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Instrumentation Engineering",
    "bio": "Building sustainable and scalable solutions in Battery Tech. 3rd Year at CIT.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "MATLAB",
      "Embedded C",
      "Sensors & Transducers",
      "Signal Processing",
      "Instrumentation Design",
      "LabVIEW",
      "PLC",
      "SCADA",
      "Rapid Prototyping",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Instrumentation Design",
      "SCADA",
      "Embedded C",
      "LabVIEW",
      "MATLAB",
      "Rapid Prototyping",
      "Signal Processing"
    ],
    "github": "ganeshjain",
    "linkedin": "ganeshjain",
    "website": "",
    "social": {
      "github": "ganeshjain",
      "linkedin": "ganeshjain",
      "website": ""
    },
    "interests": [
      "Battery Tech",
      "Sustainable Materials",
      "Entrepreneurship",
      "Microelectronics",
      "Synthetic Biology",
      "AR/VR"
    ],
    "domains": [
      "Agritech",
      "Aerospace",
      "Civil"
    ],
    "projects": [
      {
        "name": "Ultra-Precise Vibration Calibration Rig",
        "desc": "Piezo-actuated shaker table for accelerometer calibration.",
        "tech": [
          "SCADA",
          "Signal Processing",
          "Instrumentation Design"
        ],
        "role": "Instrumentation Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 20,
      "commits": 74,
      "stars": 20,
      "followers": 32,
      "following": 34
    },
    "github_stats": {
      "repos": 20,
      "commits": 74,
      "stars": 20,
      "followers": 32,
      "following": 34
    },
    "profileCompletion": 74
  },
  {
    "id": "fc2e2e44-67a1-49c0-8deb-aae8b7fd05ce",
    "name": "Usha Gopal",
    "username": "usha_gopal_22",
    "email": "usha.gopal@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=usha_gopal_22",
    "university": "PSG College of Technology",
    "college": "PSG Tech",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "1st Year",
    "branch": "Instrumentation Engineering",
    "bio": "Interested in Generative AI, SpaceTech, and Interactive Media. Active hackathon builder.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Sensors & Transducers",
      "Embedded C",
      "Signal Processing",
      "PLC",
      "SCADA",
      "MATLAB",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "SCADA",
      "PLC",
      "MATLAB",
      "Signal Processing"
    ],
    "github": "ushagopal",
    "linkedin": "ushagopal",
    "website": "",
    "social": {
      "github": "ushagopal",
      "linkedin": "ushagopal",
      "website": ""
    },
    "interests": [
      "Generative AI",
      "SpaceTech",
      "Interactive Media",
      "Thermal Systems",
      "Green Mobility",
      "Web3"
    ],
    "domains": [
      "Aerospace",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "Ultra-Precise Vibration Calibration Rig",
        "desc": "Piezo-actuated shaker table for accelerometer calibration.",
        "tech": [
          "SCADA",
          "Signal Processing",
          "Instrumentation Design"
        ],
        "role": "Instrumentation Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 22,
      "commits": 354,
      "stars": 43,
      "followers": 62,
      "following": 23
    },
    "github_stats": {
      "repos": 22,
      "commits": 354,
      "stars": 43,
      "followers": 62,
      "following": 23
    },
    "profileCompletion": 93
  },
  {
    "id": "6c480048-b597-421a-a03f-d31dcc86dde0",
    "name": "Arjun Srivastava",
    "username": "arjun_srivastava_56",
    "email": "arjun.srivastava@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=arjun_srivastava_56",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "4th Year",
    "branch": "Architecture",
    "bio": "Architecture student at VIT passionate about Micro-Mobility and Quantum Computing.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Lumion",
      "Revit",
      "Rhino 3D",
      "Ideation",
      "Presentation"
    ],
    "verifiedSkills": [
      "Ideation"
    ],
    "github": "arjunsrivastava",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "arjunsrivastava",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Micro-Mobility",
      "Quantum Computing",
      "Smart Grids",
      "Telemedicine",
      "Renewable Energy",
      "Electric Vehicles"
    ],
    "domains": [
      "Civil",
      "Aerospace"
    ],
    "projects": [
      {
        "name": "Urban Climate Micro-District Plan",
        "desc": "Transit-oriented mixed-use masterplan reducing urban heat island effect.",
        "tech": [
          "Urban Planning",
          "AutoCAD",
          "Photoshop"
        ],
        "role": "BIM Designer"
      },
      {
        "name": "Net-Zero Energy Campus Library",
        "desc": "Parametric passive solar design with green roof integration.",
        "tech": [
          "Revit",
          "BIM (Building Information Modeling)",
          "Architectural Design",
          "Rhino 3D"
        ],
        "role": "BIM Designer"
      },
      {
        "name": "Parametric Bamboo Timber Pavilion",
        "desc": "Curvilinear public canopy generated using algorithmic geometric rules.",
        "tech": [
          "Grasshopper",
          "SketchUp",
          "3D Visualization"
        ],
        "role": "BIM Designer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 27,
      "commits": 93,
      "stars": 12,
      "followers": 79,
      "following": 37
    },
    "github_stats": {
      "repos": 27,
      "commits": 93,
      "stars": 12,
      "followers": 79,
      "following": 37
    },
    "profileCompletion": 92
  },
  {
    "id": "62896dac-f806-44b9-bcb9-4a4df88ecc09",
    "name": "Priya Kumar",
    "username": "priya_kumar_52",
    "email": "priya.kumar@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=priya_kumar_52",
    "university": "Amrita Vishwa Vidyapeetham",
    "college": "Amrita",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Architecture",
    "bio": "Building sustainable and scalable solutions in Precision Agriculture. 2nd Year at Amrita.",
    "status": "OFFLINE",
    "skills": [
      "SketchUp",
      "3D Visualization",
      "Urban Planning",
      "Architectural Design",
      "Photoshop",
      "Lumion",
      "AutoCAD",
      "Rhino 3D",
      "BIM (Building Information Modeling)",
      "Revit",
      "Communication",
      "Ideation"
    ],
    "verifiedSkills": [
      "Rhino 3D",
      "SketchUp",
      "Lumion",
      "Revit",
      "3D Visualization"
    ],
    "github": "priyakumar",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "priyakumar",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Precision Agriculture",
      "Smart Agriculture",
      "VLSI",
      "Robotics",
      "High Performance Computing",
      "Green Building"
    ],
    "domains": [
      "IoT",
      "AI/ML",
      "Design"
    ],
    "projects": [
      {
        "name": "Net-Zero Energy Campus Library",
        "desc": "Parametric passive solar design with green roof integration.",
        "tech": [
          "Revit",
          "BIM (Building Information Modeling)",
          "Architectural Design",
          "Rhino 3D"
        ],
        "role": "BIM Designer"
      },
      {
        "name": "Urban Climate Micro-District Plan",
        "desc": "Transit-oriented mixed-use masterplan reducing urban heat island effect.",
        "tech": [
          "Urban Planning",
          "AutoCAD",
          "Photoshop"
        ],
        "role": "BIM Designer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 26,
      "commits": 337,
      "stars": 24,
      "followers": 20,
      "following": 48
    },
    "github_stats": {
      "repos": 26,
      "commits": 337,
      "stars": 24,
      "followers": 20,
      "following": 48
    },
    "profileCompletion": 84
  },
  {
    "id": "1458b5a8-ec14-4f63-b9f8-f205cef99d3a",
    "name": "Tarun Natarajan",
    "username": "tarun_natarajan_50",
    "email": "tarun.natarajan@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=tarun_natarajan_50",
    "university": "SRM Institute of Science and Technology",
    "college": "SRM",
    "city": "Chennai",
    "district": "Chengalpattu",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "4th Year",
    "branch": "Architecture",
    "bio": "Interested in Telemedicine, Battery Tech, and Research. Active hackathon builder.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Rhino 3D",
      "Lumion",
      "Architectural Design",
      "3D Visualization",
      "BIM (Building Information Modeling)",
      "Revit",
      "AutoCAD",
      "SketchUp",
      "Photoshop",
      "Communication",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "AutoCAD",
      "Revit",
      "Architectural Design",
      "SketchUp",
      "BIM (Building Information Modeling)",
      "Photoshop",
      "Rapid Prototyping",
      "Communication",
      "3D Visualization"
    ],
    "github": "tarunnatarajan",
    "linkedin": "",
    "website": "tarunnatarajan.dev",
    "social": {
      "github": "tarunnatarajan",
      "linkedin": "",
      "website": "tarunnatarajan.dev"
    },
    "interests": [
      "Telemedicine",
      "Battery Tech",
      "Research",
      "CleanTech",
      "Quantum Computing"
    ],
    "domains": [
      "EV",
      "IoT",
      "Logistics",
      "Civil"
    ],
    "projects": [
      {
        "name": "Urban Climate Micro-District Plan",
        "desc": "Transit-oriented mixed-use masterplan reducing urban heat island effect.",
        "tech": [
          "Urban Planning",
          "AutoCAD",
          "Photoshop"
        ],
        "role": "BIM Designer"
      },
      {
        "name": "Parametric Bamboo Timber Pavilion",
        "desc": "Curvilinear public canopy generated using algorithmic geometric rules.",
        "tech": [
          "Grasshopper",
          "SketchUp",
          "3D Visualization"
        ],
        "role": "BIM Designer"
      },
      {
        "name": "Net-Zero Energy Campus Library",
        "desc": "Parametric passive solar design with green roof integration.",
        "tech": [
          "Revit",
          "BIM (Building Information Modeling)",
          "Architectural Design",
          "Rhino 3D"
        ],
        "role": "BIM Designer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 25,
      "commits": 380,
      "stars": 31,
      "followers": 42,
      "following": 35
    },
    "github_stats": {
      "repos": 25,
      "commits": 380,
      "stars": 31,
      "followers": 42,
      "following": 35
    },
    "profileCompletion": 91
  },
  {
    "id": "1c013e76-8dd1-4835-929d-4d17b3cca983",
    "name": "Meenakshi Aggarwal",
    "username": "meenakshi_aggarwal_79",
    "email": "meenakshi.aggarwal@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=meenakshi_aggarwal_79",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Fashion Technology",
    "bio": "Fashion Technology student at VIT passionate about Prompt Engineering and Avionics.",
    "status": "IN_TEAM",
    "skills": [
      "Pattern Making",
      "Textile Design",
      "Styling",
      "Adobe Illustrator",
      "Fashion Merchandising",
      "UI Design",
      "Photoshop",
      "Garment Manufacturing",
      "Fashion CAD",
      "Team Leadership",
      "Communication"
    ],
    "verifiedSkills": [
      "Fashion Merchandising",
      "Fashion CAD",
      "Communication",
      "Styling",
      "Pattern Making",
      "Team Leadership",
      "UI Design",
      "Textile Design",
      "Photoshop"
    ],
    "github": "meenakshiaggarwal",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "meenakshiaggarwal",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Prompt Engineering",
      "Avionics",
      "Manufacturing"
    ],
    "domains": [
      "IoT",
      "AI/ML",
      "FinTech",
      "Robotics"
    ],
    "projects": [
      {
        "name": "Virtual AR Apparel Fitting Room",
        "desc": "Real-time 3D cloth simulation for online e-commerce sizing.",
        "tech": [
          "Fashion CAD",
          "UI Design",
          "Photoshop"
        ],
        "role": "UI/Creative Designer"
      },
      {
        "name": "Zero-Waste Pattern Generation Engine",
        "desc": "Nested layout generator minimizing fabric cutting waste.",
        "tech": [
          "Pattern Making",
          "Garment Manufacturing"
        ],
        "role": "UI/Creative Designer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 6,
    "githubStats": {
      "repos": 6,
      "commits": 368,
      "stars": 8,
      "followers": 2,
      "following": 40
    },
    "github_stats": {
      "repos": 6,
      "commits": 368,
      "stars": 8,
      "followers": 2,
      "following": 40
    },
    "profileCompletion": 76
  },
  {
    "id": "cab37fc0-5983-4910-a593-6b513146db25",
    "name": "Devendra Iyer",
    "username": "devendra_iyer_46",
    "email": "devendra.iyer@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=devendra_iyer_46",
    "university": "Madras Institute of Technology",
    "college": "MIT Chennai",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Fashion Technology",
    "bio": "Building sustainable and scalable solutions in Waste Management. 1st Year at MIT Chennai.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Adobe Illustrator",
      "Photoshop",
      "Pattern Making",
      "Garment Manufacturing",
      "Styling",
      "UI Design",
      "Fashion CAD",
      "Fashion Merchandising",
      "Problem Solving"
    ],
    "verifiedSkills": [
      "Fashion CAD",
      "Fashion Merchandising",
      "Photoshop",
      "UI Design",
      "Pattern Making",
      "Adobe Illustrator",
      "Garment Manufacturing"
    ],
    "github": "devendraiyer",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "devendraiyer",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Waste Management",
      "Synthetic Biology",
      "Sustainability",
      "Satellite Communication",
      "DeepTech"
    ],
    "domains": [
      "Logistics",
      "Product",
      "Design"
    ],
    "projects": [
      {
        "name": "Zero-Waste Pattern Generation Engine",
        "desc": "Nested layout generator minimizing fabric cutting waste.",
        "tech": [
          "Pattern Making",
          "Garment Manufacturing"
        ],
        "role": "UI/Creative Designer"
      },
      {
        "name": "Circular Textile Upcycling Tracker",
        "desc": "QR-code powered garment lifecycle passport tracking recycled fibers.",
        "tech": [
          "Textile Design",
          "Fashion Merchandising",
          "Adobe Illustrator"
        ],
        "role": "UI/Creative Designer"
      },
      {
        "name": "Virtual AR Apparel Fitting Room",
        "desc": "Real-time 3D cloth simulation for online e-commerce sizing.",
        "tech": [
          "Fashion CAD",
          "UI Design",
          "Photoshop"
        ],
        "role": "UI/Creative Designer"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 11,
      "commits": 118,
      "stars": 7,
      "followers": 44,
      "following": 15
    },
    "github_stats": {
      "repos": 11,
      "commits": 118,
      "stars": 7,
      "followers": 44,
      "following": 15
    },
    "profileCompletion": 95
  },
  {
    "id": "bb0f642d-1096-4c1e-a583-70dcd1d200f4",
    "name": "Pooja Patel",
    "username": "pooja_patel_47",
    "email": "pooja.patel@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=pooja_patel_47",
    "university": "Indian Institute of Technology Madras",
    "college": "IIT Madras",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Fashion Technology",
    "bio": "Interested in Cyber Defence, CleanTech, and Artificial Intelligence. Active hackathon builder.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Fashion Merchandising",
      "UI Design",
      "Garment Manufacturing",
      "Textile Design",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Fashion Merchandising",
      "UI Design",
      "Rapid Prototyping"
    ],
    "github": "",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Cyber Defence",
      "CleanTech",
      "Artificial Intelligence",
      "Drone Technology",
      "3D Printing",
      "Web3"
    ],
    "domains": [
      "CleanTech",
      "Agritech",
      "EV"
    ],
    "projects": [
      {
        "name": "Virtual AR Apparel Fitting Room",
        "desc": "Real-time 3D cloth simulation for online e-commerce sizing.",
        "tech": [
          "Fashion CAD",
          "UI Design",
          "Photoshop"
        ],
        "role": "UI/Creative Designer"
      }
    ],
    "hackathonsWon": 2,
    "hackathons_won": 2,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 92
  },
  {
    "id": "c4e69c9e-4472-40aa-ae9e-e98402e48d1b",
    "name": "Pranav Verma",
    "username": "pranav_verma_40",
    "email": "pranav.verma@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=pranav_verma_40",
    "university": "PSG College of Technology",
    "college": "PSG Tech",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Data Science",
    "bio": "Data Science student at PSG Tech passionate about Urban Planning and Micro-Mobility.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "NumPy",
      "SQL",
      "Power BI",
      "Apache Spark",
      "Deep Learning",
      "Scikit-Learn",
      "Python",
      "Data Visualization",
      "Tableau",
      "Pandas",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Data Visualization",
      "Power BI",
      "Team Leadership"
    ],
    "github": "",
    "linkedin": "pranavverma",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "pranavverma",
      "website": ""
    },
    "interests": [
      "Urban Planning",
      "Micro-Mobility",
      "Green Building",
      "Signal Processing",
      "Prompt Engineering"
    ],
    "domains": [
      "IoT",
      "EdTech"
    ],
    "projects": [
      {
        "name": "Automated Machine Learning Workbench",
        "desc": "No-code model exploration tool comparing cross-validation scores.",
        "tech": [
          "Python",
          "Pandas",
          "Scikit-Learn",
          "Streamlit"
        ],
        "role": "Data Engineer"
      },
      {
        "name": "Geospatial Real Estate Value Mapper",
        "desc": "Interactive pricing map using satellite land feature vectors.",
        "tech": [
          "R",
          "Tableau",
          "Power BI",
          "SQL"
        ],
        "role": "Data Engineer"
      },
      {
        "name": "Realtime E-Commerce Trend Predictor",
        "desc": "Streaming clickstream aggregator classifying buyer intent live.",
        "tech": [
          "Apache Spark",
          "Big Data",
          "SQL",
          "Python"
        ],
        "role": "Data Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 76
  },
  {
    "id": "e019c590-05ca-4dd0-8414-3264362d7ab3",
    "name": "Shreya Joshi",
    "username": "shreya_joshi_83",
    "email": "shreya.joshi@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=shreya_joshi_83",
    "university": "National Institute of Technology Tiruchirappalli",
    "college": "NIT Trichy",
    "city": "Tiruchirappalli",
    "district": "Tiruchirappalli",
    "state": "Tamil Nadu",
    "location": "Tiruchirappalli, Tamil Nadu",
    "year": "4th Year",
    "branch": "Data Science",
    "bio": "Building sustainable and scalable solutions in Green Mobility. 4th Year at NIT Trichy.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Scikit-Learn",
      "Apache Spark",
      "Tableau",
      "R",
      "Pandas",
      "Problem Solving",
      "Ideation"
    ],
    "verifiedSkills": [
      "Ideation",
      "Scikit-Learn",
      "R",
      "Apache Spark"
    ],
    "github": "shreyajoshi",
    "linkedin": "",
    "website": "shreyajoshi.dev",
    "social": {
      "github": "shreyajoshi",
      "linkedin": "",
      "website": "shreyajoshi.dev"
    },
    "interests": [
      "Green Mobility",
      "Waste Management",
      "Healthcare",
      "Hydroponics",
      "Sustainable Materials",
      "Smart Agriculture"
    ],
    "domains": [
      "Web",
      "Civil",
      "CleanTech",
      "Mechanical"
    ],
    "projects": [
      {
        "name": "Geospatial Real Estate Value Mapper",
        "desc": "Interactive pricing map using satellite land feature vectors.",
        "tech": [
          "R",
          "Tableau",
          "Power BI",
          "SQL"
        ],
        "role": "Data Engineer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 21,
      "commits": 57,
      "stars": 2,
      "followers": 56,
      "following": 27
    },
    "github_stats": {
      "repos": 21,
      "commits": 57,
      "stars": 2,
      "followers": 56,
      "following": 27
    },
    "profileCompletion": 99
  },
  {
    "id": "fb92583d-11ab-4cec-a9fd-c5fd932c1193",
    "name": "Aditya Sharma",
    "username": "aditya_sharma_70",
    "email": "aditya.sharma@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=aditya_sharma_70",
    "university": "PSG College of Technology",
    "college": "PSG Tech",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "Data Science",
    "bio": "Interested in Generative AI, Logistics, and Sustainable Materials. Active hackathon builder.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "SQL",
      "Deep Learning",
      "Power BI",
      "Scikit-Learn",
      "Big Data",
      "Pandas",
      "Tableau",
      "Apache Spark",
      "Python",
      "Communication"
    ],
    "verifiedSkills": [
      "Deep Learning",
      "Power BI",
      "Tableau",
      "Big Data",
      "Communication",
      "Pandas"
    ],
    "github": "adityasharma",
    "linkedin": "adityasharma",
    "website": "",
    "social": {
      "github": "adityasharma",
      "linkedin": "adityasharma",
      "website": ""
    },
    "interests": [
      "Generative AI",
      "Logistics",
      "Sustainable Materials"
    ],
    "domains": [
      "Logistics",
      "Mechanical",
      "Civil",
      "Product"
    ],
    "projects": [
      {
        "name": "Geospatial Real Estate Value Mapper",
        "desc": "Interactive pricing map using satellite land feature vectors.",
        "tech": [
          "R",
          "Tableau",
          "Power BI",
          "SQL"
        ],
        "role": "Data Engineer"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 14,
      "commits": 99,
      "stars": 17,
      "followers": 26,
      "following": 12
    },
    "github_stats": {
      "repos": 14,
      "commits": 99,
      "stars": 17,
      "followers": 26,
      "following": 12
    },
    "profileCompletion": 94
  },
  {
    "id": "732dbfe7-1acd-4dd9-8572-92ca7923a567",
    "name": "Ritu Reddy",
    "username": "ritu_reddy_12",
    "email": "ritu.reddy@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=ritu_reddy_12",
    "university": "Thiagarajar College of Engineering",
    "college": "Thiagarajar",
    "city": "Madurai",
    "district": "Madurai",
    "state": "Tamil Nadu",
    "location": "Madurai, Tamil Nadu",
    "year": "1st Year",
    "branch": "Cyber Security",
    "bio": "Cyber Security student at Thiagarajar passionate about Embedded Systems and Smart Cities.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Penetration Testing",
      "Python",
      "Ethical Hacking",
      "Network Security",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Penetration Testing",
      "Network Security",
      "Python"
    ],
    "github": "",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Embedded Systems",
      "Smart Cities",
      "Healthcare",
      "Gaming"
    ],
    "domains": [
      "EV",
      "IoT",
      "Agritech",
      "Logistics"
    ],
    "projects": [],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "github_stats": {
      "repos": 0,
      "commits": 0,
      "stars": 0,
      "followers": 0,
      "following": 0
    },
    "profileCompletion": 86
  },
  {
    "id": "e88fb49b-4d38-4e00-98f7-81c1486d5d6c",
    "name": "Akash Sengupta",
    "username": "akash_sengupta_38",
    "email": "akash.sengupta@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=akash_sengupta_38",
    "university": "SRM Institute of Science and Technology",
    "college": "SRM",
    "city": "Chennai",
    "district": "Chengalpattu",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "3rd Year",
    "branch": "Cyber Security",
    "bio": "Building sustainable and scalable solutions in Open Source. 3rd Year at SRM.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Ethical Hacking",
      "Cryptography",
      "Burp Suite",
      "Kali Linux",
      "Wireshark",
      "Metasploit",
      "Reverse Engineering",
      "Communication",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Rapid Prototyping",
      "Metasploit",
      "Communication",
      "Kali Linux",
      "Reverse Engineering",
      "Cryptography",
      "Wireshark"
    ],
    "github": "akashsengupta",
    "linkedin": "akashsengupta",
    "website": "",
    "social": {
      "github": "akashsengupta",
      "linkedin": "akashsengupta",
      "website": ""
    },
    "interests": [
      "Open Source",
      "Signal Processing",
      "Green Building",
      "Web3",
      "Manufacturing",
      "Logistics"
    ],
    "domains": [
      "Healthcare",
      "Biotech",
      "AI/ML",
      "CleanTech"
    ],
    "projects": [
      {
        "name": "Automated Malware Sandbox Runner",
        "desc": "Isolated dynamic analysis platform extracting C2 indicators.",
        "tech": [
          "Kali Linux",
          "Reverse Engineering",
          "Wireshark",
          "Metasploit"
        ],
        "role": "Security Analyst"
      },
      {
        "name": "Zero-Trust IAM Policy Validator",
        "desc": "Static analysis tool identifying over-privileged cloud infrastructure roles.",
        "tech": [
          "Python",
          "Network Security",
          "Cloud Security",
          "OAuth 2.0"
        ],
        "role": "Security Analyst"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 3,
    "githubStats": {
      "repos": 19,
      "commits": 88,
      "stars": 24,
      "followers": 33,
      "following": 21
    },
    "github_stats": {
      "repos": 19,
      "commits": 88,
      "stars": 24,
      "followers": 33,
      "following": 21
    },
    "profileCompletion": 72
  },
  {
    "id": "38eb7628-e648-4935-b757-eff8326a187d",
    "name": "Sneha Sundaram",
    "username": "sneha_sundaram_78",
    "email": "sneha.sundaram@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=sneha_sundaram_78",
    "university": "Kongu Engineering College",
    "college": "Kongu",
    "city": "Erode",
    "district": "Erode",
    "state": "Tamil Nadu",
    "location": "Erode, Tamil Nadu",
    "year": "1st Year",
    "branch": "Cyber Security",
    "bio": "Interested in Smart Cities, Research, and Renewable Energy. Active hackathon builder.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Kali Linux",
      "Python",
      "Ethical Hacking",
      "Penetration Testing",
      "Network Security",
      "Wireshark",
      "Nmap",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Wireshark",
      "Ethical Hacking"
    ],
    "github": "snehasundaram",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "snehasundaram",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Smart Cities",
      "Research",
      "Renewable Energy"
    ],
    "domains": [
      "Design",
      "IoT",
      "Robotics",
      "Logistics"
    ],
    "projects": [
      {
        "name": "Automated Malware Sandbox Runner",
        "desc": "Isolated dynamic analysis platform extracting C2 indicators.",
        "tech": [
          "Kali Linux",
          "Reverse Engineering",
          "Wireshark",
          "Metasploit"
        ],
        "role": "Security Analyst"
      },
      {
        "name": "Container Vulnerability Scanner",
        "desc": "Image layer scanner checking CVE databases before deployment.",
        "tech": [
          "Docker",
          "Penetration Testing",
          "Burp Suite"
        ],
        "role": "Security Analyst"
      },
      {
        "name": "Zero-Trust IAM Policy Validator",
        "desc": "Static analysis tool identifying over-privileged cloud infrastructure roles.",
        "tech": [
          "Python",
          "Network Security",
          "Cloud Security",
          "OAuth 2.0"
        ],
        "role": "Security Analyst"
      }
    ],
    "hackathonsWon": 1,
    "hackathons_won": 1,
    "hackathonsParticipated": 1,
    "githubStats": {
      "repos": 27,
      "commits": 164,
      "stars": 24,
      "followers": 61,
      "following": 39
    },
    "github_stats": {
      "repos": 27,
      "commits": 164,
      "stars": 24,
      "followers": 61,
      "following": 39
    },
    "profileCompletion": 95
  },
  {
    "id": "bccfcb8d-4fb3-47d4-b57d-a04e3af3b2df",
    "name": "Siddharth Pillai",
    "username": "siddharth_pillai_70",
    "email": "siddharth.pillai@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=siddharth_pillai_70",
    "university": "Madras Institute of Technology",
    "college": "MIT Chennai",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "4th Year",
    "branch": "MBA",
    "bio": "MBA student at MIT Chennai passionate about Waste Management and CleanTech.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Power BI",
      "Agile/Scrum",
      "Product Management",
      "Salesforce",
      "Business Analysis",
      "Marketing",
      "Strategic Planning",
      "Presentation",
      "Team Leadership"
    ],
    "verifiedSkills": [
      "Marketing",
      "Salesforce"
    ],
    "github": "siddharthpillai",
    "linkedin": "",
    "website": "",
    "social": {
      "github": "siddharthpillai",
      "linkedin": "",
      "website": ""
    },
    "interests": [
      "Waste Management",
      "CleanTech",
      "Disaster Tech",
      "Micro-Mobility",
      "Autonomous Driving",
      "Microelectronics"
    ],
    "domains": [
      "Design",
      "Logistics",
      "Biotech"
    ],
    "projects": [
      {
        "name": "D2C Brand Customer Retention Engine",
        "desc": "Cohort analysis dashboard identifying high LTV buyer segments.",
        "tech": [
          "Salesforce",
          "Strategic Planning",
          "Agile/Scrum"
        ],
        "role": "Product Manager"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 8,
      "commits": 91,
      "stars": 34,
      "followers": 64,
      "following": 16
    },
    "github_stats": {
      "repos": 8,
      "commits": 91,
      "stars": 34,
      "followers": 64,
      "following": 16
    },
    "profileCompletion": 100
  },
  {
    "id": "6c6070fe-5590-4bd5-bd37-c804f1141ede",
    "name": "Tanvi Rao",
    "username": "tanvi_rao_95",
    "email": "tanvi.rao@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=tanvi_rao_95",
    "university": "PSG College of Technology",
    "college": "PSG Tech",
    "city": "Coimbatore",
    "district": "Coimbatore",
    "state": "Tamil Nadu",
    "location": "Coimbatore, Tamil Nadu",
    "year": "2nd Year",
    "branch": "MBA",
    "bio": "Building sustainable and scalable solutions in Avionics. 2nd Year at PSG Tech.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Financial Modeling",
      "Market Research",
      "Business Analysis",
      "Power BI",
      "Strategic Planning",
      "Product Management",
      "Agile/Scrum",
      "Marketing",
      "Presentation",
      "Problem Solving",
      "Ideation"
    ],
    "verifiedSkills": [
      "Ideation",
      "Marketing",
      "Financial Modeling",
      "Presentation",
      "Strategic Planning",
      "Agile/Scrum",
      "Power BI",
      "Problem Solving"
    ],
    "github": "tanvirao",
    "linkedin": "tanvirao",
    "website": "tanvirao.dev",
    "social": {
      "github": "tanvirao",
      "linkedin": "tanvirao",
      "website": "tanvirao.dev"
    },
    "interests": [
      "Avionics",
      "Quantum Computing",
      "Signal Processing"
    ],
    "domains": [
      "Web",
      "Product",
      "Mechanical"
    ],
    "projects": [
      {
        "name": "FinTech Micro-Credit Risk Matrix",
        "desc": "Credit scoring framework for informal sector small business loans.",
        "tech": [
          "Business Analysis",
          "Financial Modeling",
          "Power BI"
        ],
        "role": "Product Manager"
      },
      {
        "name": "D2C Brand Customer Retention Engine",
        "desc": "Cohort analysis dashboard identifying high LTV buyer segments.",
        "tech": [
          "Salesforce",
          "Strategic Planning",
          "Agile/Scrum"
        ],
        "role": "Product Manager"
      },
      {
        "name": "EdTech B2B Market Entry Strategy",
        "desc": "Go-to-market analysis and financial projection for tier-3 Indian college sales.",
        "tech": [
          "Product Management",
          "Market Research",
          "Financial Modeling",
          "Presentation"
        ],
        "role": "Product Manager"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 19,
      "commits": 96,
      "stars": 15,
      "followers": 26,
      "following": 44
    },
    "github_stats": {
      "repos": 19,
      "commits": 96,
      "stars": 15,
      "followers": 26,
      "following": 44
    },
    "profileCompletion": 100
  },
  {
    "id": "a4a433e6-4d7c-4b9e-a42e-488e76adf7e7",
    "name": "Manish Bhattacharya",
    "username": "manish_bhattacharya_61",
    "email": "manish.bhattacharya@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=manish_bhattacharya_61",
    "university": "SASTRA Deemed University",
    "college": "SASTRA",
    "city": "Thanjavur",
    "district": "Thanjavur",
    "state": "Tamil Nadu",
    "location": "Thanjavur, Tamil Nadu",
    "year": "4th Year",
    "branch": "MBA",
    "bio": "Interested in Cloud Computing, FinTech, and Disaster Tech. Active hackathon builder.",
    "status": "OFFLINE",
    "skills": [
      "Market Research",
      "Salesforce",
      "Business Analysis",
      "Power BI",
      "Agile/Scrum",
      "Product Management",
      "Rapid Prototyping"
    ],
    "verifiedSkills": [
      "Power BI",
      "Agile/Scrum",
      "Rapid Prototyping",
      "Market Research"
    ],
    "github": "manishbhattacharya",
    "linkedin": "manishbhattacharya",
    "website": "",
    "social": {
      "github": "manishbhattacharya",
      "linkedin": "manishbhattacharya",
      "website": ""
    },
    "interests": [
      "Cloud Computing",
      "FinTech",
      "Disaster Tech"
    ],
    "domains": [
      "Agritech",
      "FinTech",
      "AI/ML"
    ],
    "projects": [
      {
        "name": "D2C Brand Customer Retention Engine",
        "desc": "Cohort analysis dashboard identifying high LTV buyer segments.",
        "tech": [
          "Salesforce",
          "Strategic Planning",
          "Agile/Scrum"
        ],
        "role": "Product Manager"
      },
      {
        "name": "EdTech B2B Market Entry Strategy",
        "desc": "Go-to-market analysis and financial projection for tier-3 Indian college sales.",
        "tech": [
          "Product Management",
          "Market Research",
          "Financial Modeling",
          "Presentation"
        ],
        "role": "Product Manager"
      },
      {
        "name": "FinTech Micro-Credit Risk Matrix",
        "desc": "Credit scoring framework for informal sector small business loans.",
        "tech": [
          "Business Analysis",
          "Financial Modeling",
          "Power BI"
        ],
        "role": "Product Manager"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 0,
    "githubStats": {
      "repos": 21,
      "commits": 263,
      "stars": 17,
      "followers": 7,
      "following": 9
    },
    "github_stats": {
      "repos": 21,
      "commits": 263,
      "stars": 17,
      "followers": 7,
      "following": 9
    },
    "profileCompletion": 100
  },
  {
    "id": "bf5c6dbf-7b36-4028-b03b-7b4abbf3532f",
    "name": "Divya Varma",
    "username": "divya_varma_36",
    "email": "divya.varma@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=divya_varma_36",
    "university": "Indian Institute of Technology Madras",
    "college": "IIT Madras",
    "city": "Chennai",
    "district": "Chennai",
    "state": "Tamil Nadu",
    "location": "Chennai, Tamil Nadu",
    "year": "3rd Year",
    "branch": "MCA",
    "bio": "MCA student at IIT Madras passionate about Defence and Industry 4.0.",
    "status": "OPEN_TO_INVITES",
    "skills": [
      "Python",
      "PostgreSQL",
      "React",
      "Node.js",
      "Docker",
      "AWS",
      "Full Stack Development",
      "Software Engineering",
      "Git",
      "Communication"
    ],
    "verifiedSkills": [
      "Git",
      "AWS"
    ],
    "github": "divyavarma",
    "linkedin": "divyavarma",
    "website": "",
    "social": {
      "github": "divyavarma",
      "linkedin": "divyavarma",
      "website": ""
    },
    "interests": [
      "Defence",
      "Industry 4.0",
      "Automation"
    ],
    "domains": [
      "Agritech",
      "Civil"
    ],
    "projects": [
      {
        "name": "Automated CI/CD Deployment Suite",
        "desc": "Dockerized deployment pipeline with automated unit testing.",
        "tech": [
          "AWS",
          "Docker",
          "Git",
          "Python"
        ],
        "role": "Backend Developer"
      },
      {
        "name": "Realtime Event Management Portal",
        "desc": "Full stack portal with QR ticket validation and live attendance.",
        "tech": [
          "Node.js",
          "React",
          "MongoDB",
          "Express.js"
        ],
        "role": "Backend Developer"
      },
      {
        "name": "Scalable Microservices E-Commerce API",
        "desc": "Decoupled backend API handling inventory management and payments.",
        "tech": [
          "Java",
          "Spring Boot",
          "PostgreSQL",
          "Docker"
        ],
        "role": "Backend Developer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 5,
    "githubStats": {
      "repos": 11,
      "commits": 421,
      "stars": 28,
      "followers": 64,
      "following": 19
    },
    "github_stats": {
      "repos": 11,
      "commits": 421,
      "stars": 28,
      "followers": 64,
      "following": 19
    },
    "profileCompletion": 88
  },
  {
    "id": "b94ac878-a11a-4440-8721-86ece96b9784",
    "name": "Abhinav Kulkarni",
    "username": "abhinav_kulkarni_94",
    "email": "abhinav.kulkarni@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=abhinav_kulkarni_94",
    "university": "Vellore Institute of Technology",
    "college": "VIT",
    "city": "Vellore",
    "district": "Vellore",
    "state": "Tamil Nadu",
    "location": "Vellore, Tamil Nadu",
    "year": "1st Year",
    "branch": "MCA",
    "bio": "Building sustainable and scalable solutions in Smart Agriculture. 1st Year at VIT.",
    "status": "LOOKING_FOR_TEAM",
    "skills": [
      "Node.js",
      "Python",
      "Docker",
      "PostgreSQL",
      "Software Engineering",
      "Git",
      "Full Stack Development",
      "Presentation",
      "Communication"
    ],
    "verifiedSkills": [
      "Python"
    ],
    "github": "abhinavkulkarni",
    "linkedin": "abhinavkulkarni",
    "website": "",
    "social": {
      "github": "abhinavkulkarni",
      "linkedin": "abhinavkulkarni",
      "website": ""
    },
    "interests": [
      "Smart Agriculture",
      "Social Impact",
      "Nanotechnology"
    ],
    "domains": [
      "FinTech",
      "Healthcare",
      "EdTech"
    ],
    "projects": [],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 4,
    "githubStats": {
      "repos": 20,
      "commits": 304,
      "stars": 32,
      "followers": 54,
      "following": 11
    },
    "github_stats": {
      "repos": 20,
      "commits": 304,
      "stars": 32,
      "followers": 54,
      "following": 11
    },
    "profileCompletion": 72
  },
  {
    "id": "132eafd1-24b7-4dd8-b703-0907cb2db46e",
    "name": "Kriti Choudhury",
    "username": "kriti_choudhury_86",
    "email": "kriti.choudhury@b2b2h.com",
    "avatar": "https://api.dicebear.com/8.x/adventurer/svg?seed=kriti_choudhury_86",
    "university": "BITS Pilani Hyderabad Campus",
    "college": "BITS Pilani",
    "city": "Hyderabad",
    "district": "Hyderabad",
    "state": "Telangana",
    "location": "Hyderabad, Telangana",
    "year": "3rd Year",
    "branch": "MCA",
    "bio": "Interested in Cloud Computing, Industry 4.0, and Quantum Computing. Active hackathon builder.",
    "status": "LOOKING_FOR_MEMBERS",
    "skills": [
      "Java",
      "PostgreSQL",
      "Full Stack Development",
      "Software Engineering",
      "AWS",
      "Git",
      "Docker",
      "Python",
      "React",
      "Communication"
    ],
    "verifiedSkills": [
      "Full Stack Development",
      "Communication",
      "AWS",
      "React",
      "Docker",
      "Software Engineering",
      "PostgreSQL"
    ],
    "github": "kritichoudhury",
    "linkedin": "kritichoudhury",
    "website": "kritichoudhury.dev",
    "social": {
      "github": "kritichoudhury",
      "linkedin": "kritichoudhury",
      "website": "kritichoudhury.dev"
    },
    "interests": [
      "Cloud Computing",
      "Industry 4.0",
      "Quantum Computing"
    ],
    "domains": [
      "EV",
      "Design",
      "EdTech"
    ],
    "projects": [
      {
        "name": "Realtime Event Management Portal",
        "desc": "Full stack portal with QR ticket validation and live attendance.",
        "tech": [
          "Node.js",
          "React",
          "MongoDB",
          "Express.js"
        ],
        "role": "Backend Developer"
      },
      {
        "name": "Scalable Microservices E-Commerce API",
        "desc": "Decoupled backend API handling inventory management and payments.",
        "tech": [
          "Java",
          "Spring Boot",
          "PostgreSQL",
          "Docker"
        ],
        "role": "Backend Developer"
      }
    ],
    "hackathonsWon": 0,
    "hackathons_won": 0,
    "hackathonsParticipated": 2,
    "githubStats": {
      "repos": 26,
      "commits": 340,
      "stars": 31,
      "followers": 78,
      "following": 44
    },
    "github_stats": {
      "repos": 26,
      "commits": 340,
      "stars": 31,
      "followers": 78,
      "following": 44
    },
    "profileCompletion": 70
  }
]
export const hackathons = []
export const projects = []
export const myTeam = null
export const notifications = []
export const recommendations = []

export const currentUser = {
  id: '61ace078-841c-48e7-b038-4e485a54a187',
  name: 'Jaswant MP',
  username: 'jaswantmp',
  avatar: 'https://api.dicebear.com/8.x/adventurer/svg?seed=JaswantMP',
  university: 'SKCET',
  college: 'SKCET',
  year: '2nd Year',
  branch: 'Computer Science and Engineering',
  bio: 'Computer Science student at SKCET passionate about AI, Full Stack Development, Hackathons, and Open Source.',
  status: 'LOOKING_FOR_TEAM',
  skills: ['React', 'Node.js', 'Python', 'Tailwind CSS', 'TypeScript'],
  verifiedSkills: ['React', 'Node.js', 'TypeScript'],
  github: 'jaswantmp',
  githubStats: { repos: 18, commits: 247, stars: 36 },
  hackathonsWon: 2,
  projects: [],
  location: 'Dindigul, Tamil Nadu',
  interests: ['Full-Stack Development', 'AI/ML', 'Hackathons', 'Open Source'],
  domains: ['Web', 'AI/ML', 'EdTech'],
  joined: '2024-06',
  social: { github: 'jaswantmp', linkedin: 'jaswantmp' },
  achievements: ['Hack Tamil Nadu 2025 Finalist', 'SKCET Tech Fest Winner 2024', 'Open Source Contributor'],
}
