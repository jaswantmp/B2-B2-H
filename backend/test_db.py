# import sys
# import traceback
# from sqlalchemy import text
# from app.database import SessionLocal, engine
# from app.models.user import User
# from app.schemas.user import UserDetailResponse

# def test_connection():
#     print("Testing DB connection...")
#     try:
#         with engine.connect() as conn:
#             res = conn.execute(text("SELECT 1")).fetchall()
#             print("Connection OK:", res)
#     except Exception as e:
#         print("Connection FAILED:")
#         traceback.print_exc()
#         return False
#     return True

# def test_query():
#     print("Testing query on users...")
#     db = SessionLocal()
#     try:
#         # Check if domains column exists in the database
#         with engine.connect() as conn:
#             res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name='users'")).fetchall()
#             print("Columns in 'users' table:", [r[0] for r in res])
            
#         users = db.query(User).all()
#         print(f"Successfully retrieved {len(users)} users.")
#         for u in users:
#             try:
#                 validated = UserDetailResponse.model_validate(u)
#                 print(f"User: {u.username} validated successfully")
#             except Exception as val_err:
#                 print(f"Validation FAILED for user {u.username}:")
#                 traceback.print_exc()
#                 break
#     except Exception as e:
#         print("Query FAILED:")
#         traceback.print_exc()
#     finally:
#         db.close()

# if __name__ == "__main__":
#     if test_connection():
#         test_query()
# test_db.py

from sqlalchemy import text
from app.database import engine
import time

start = time.time()

with engine.connect() as conn:
    conn.execute(text("SELECT 1"))

print(time.time()-start)

# import psycopg2
# import time

# start = time.time()

# conn = psycopg2.connect(
#     host="ep-nameless-glade-auiemdwp.c-10.us-east-1.aws.neon.tech",
#     database="neondb",
#     user="neondb_owner",
#     password="YOUR_PASSWORD",
#     sslmode="require",
# )

# print("Connected in:", time.time() - start)

# conn.close()