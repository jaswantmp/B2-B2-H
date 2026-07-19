import sys
import traceback
from sqlalchemy import text
from app.database import SessionLocal, engine
from app.models.user import User
from app.api.v1.builders import list_builders

def test_endpoint():
    db = SessionLocal()
    try:
        user = db.query(User).first()
        if not user:
            print("No users in DB to test with.")
            return
            
        print(f"Testing list_builders with user: {user.username}")
        # Call the endpoint directly
        res = list_builders(
            search="",
            skills=None,
            statuses=None,
            status_legacy=None,
            colleges=None,
            cities=None,
            db=db,
            current_user=user
        )
        print(f"Success! Retrieved {len(res)} builders.")
    except Exception as e:
        print("Endpoint FAILED:")
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_endpoint()
