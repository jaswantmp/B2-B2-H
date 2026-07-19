# app/constants/recommendation_constants.py

KNOWN_TECHNICAL_SKILLS = {
    "react", "node.js", "python", "typescript", "tailwind css",
    "next.js", "fastapi", "postgresql", "mongodb", "docker",
    "figma", "solidity", "web3.js", "kotlin", "swift", "pytorch",
    "java", "kubernetes", "sql", "flutter", "tensorflow", "langchain",
    "javascript", "html", "css", "c++", "c", "rust", "go", "aws"
}

KNOWN_DOMAINS = {
    "artificial intelligence", "machine learning", "healthcare",
    "fintech", "cybersecurity", "web development", "cloud", "iot",
    "robotics", "sustainability", "education", "blockchain", "web3",
    "mobile", "ui/ux"
}

BRANCH_DOMAIN_MAPPING = {
    "cse": {
        "artificial intelligence", "machine learning", "web development",
        "cloud", "cybersecurity", "software engineering", "blockchain",
        "web3", "mobile", "ui/ux"
    },
    "computer science": {
        "artificial intelligence", "machine learning", "web development",
        "cloud", "cybersecurity", "software engineering", "blockchain",
        "web3", "mobile", "ui/ux"
    },
    "it": {
        "artificial intelligence", "web development", "cloud",
        "software engineering", "mobile"
    },
    "information technology": {
        "artificial intelligence", "web development", "cloud",
        "software engineering", "mobile"
    },
    "ece": {
        "iot", "robotics", "embedded systems"
    },
    "electronics and communication": {
        "iot", "robotics", "embedded systems"
    },
    "eee": {
        "iot", "power systems"
    },
    "electrical and electronics": {
        "iot", "power systems"
    },
    "biomedical": {
        "healthcare"
    },
    "biomedical engineering": {
        "healthcare"
    }
}

SKILL_SYNONYMS = {
    "js": "javascript",
    "node": "node.js",
    "tailwind": "tailwind css",
}

DOMAIN_SYNONYMS = {
    "ai": "artificial intelligence",
    "ml": "machine learning",
    "healthtech": "healthcare",
    "edtech": "education",
    "greentech": "sustainability",
    "ui ux": "ui/ux",
}

YEAR_SUITABILITY = {
    "1st Year": 8,
    "2nd Year": 9,
    "3rd Year": 10,
    "4th Year": 10,
    "Postgraduate": 10
}
