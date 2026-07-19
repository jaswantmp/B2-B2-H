import requests
from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.utils.security import get_password_hash

def ensure_test_user():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "test_builder_api@example.com").first()
        if not user:
            print("Creating test user for API testing...")
            hashed_password = get_password_hash("testpassword123")
            user = User(
                name="Test Builder Api User",
                username="testbuilderapi",
                email="test_builder_api@example.com",
                hashed_password=hashed_password,
                is_active=True,
                is_verified=True,
                onboarding_completed=True
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            print("Test user already exists.")
    finally:
        db.close()

def run_request():
    print("Logging in...")
    resp = requests.post("http://127.0.0.1:8000/api/v1/auth/login", json={
        "email": "test_builder_api@example.com",
        "password": "testpassword123"
    })
    if resp.status_code != 200:
        print("Login failed:", resp.status_code, resp.text)
        return
        
    token_data = resp.json()
    token = token_data["access_token"]
    
    print("Querying /api/v1/builders/...")
    headers = {"Authorization": f"Bearer {token}"}
    resp = requests.get("http://127.0.0.1:8000/api/v1/builders/", headers=headers)
    print("Response status:", resp.status_code)
    if resp.status_code != 200:
        print("Error content:")
        print(resp.text)
    else:
        print("Success! Got builders.")

if __name__ == "__main__":
    ensure_test_user()
    run_request()
