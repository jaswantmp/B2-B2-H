import sys
import traceback
from app.database import SessionLocal
from app.models.user import User
from app.schemas.user import UserDetailResponse

def test_all():
    db = SessionLocal()
    try:
        users = db.query(User).all()
        print(f"Total users in DB: {len(users)}")
        for u in users:
            try:
                # Attempt to validate
                val = UserDetailResponse.model_validate(u)
            except Exception as e:
                print(f"FAILED validation for user {u.username}:")
                traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_all()
