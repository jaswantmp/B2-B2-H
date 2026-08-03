# app/utils/benchmark_endpoints.py
import time
from sqlalchemy import event, text
from app.database import SessionLocal, engine
from app.models.user import User
from app.api.v1.notifications import list_notifications
from app.api.v1.hackathons import list_hackathons
from app.api.v1.demo import reset_demo_account, ResetDemoRequest
from app.api.v1.ai import get_hackathon_recommendations
from app.services.team_match_service import TeamMatchService

# Track SQL execution times
sql_times = []
sql_count = [0]

@event.listens_for(engine, "before_cursor_execute")
def before_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    context._query_start_time = time.perf_counter()

@event.listens_for(engine, "after_cursor_execute")
def after_cursor_execute(conn, cursor, statement, parameters, context, executemany):
    total = (time.perf_counter() - context._query_start_time) * 1000
    sql_times.append(total)
    sql_count[0] += 1

def reset_sql_tracker():
    sql_times.clear()
    sql_count[0] = 0

def benchmark():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == "demo@b2b2h.com").first()
        if not user:
            print("Demo user not found!")
            return

        print("="*60)
        print("PERFORMANCE BENCHMARK FOR SLOW ENDPOINTS")
        print("="*60)

        # 1. Benchmark GET /api/v1/notifications
        reset_sql_tracker()
        t0 = time.perf_counter()
        res_notif = list_notifications(db=db, current_user=user)
        t1 = time.perf_counter()
        total_notif = (t1 - t0) * 1000
        sql_notif = sum(sql_times)
        count_notif = sql_count[0]
        py_notif = total_notif - sql_notif
        print(f"\n1. GET /api/v1/notifications:")
        print(f"   - Total Time       : {total_notif:.2f} ms")
        print(f"   - SQL Query Count  : {count_notif}")
        print(f"   - SQL Time         : {sql_notif:.2f} ms")
        print(f"   - Python/Ser Time  : {py_notif:.2f} ms")

        # 2. Benchmark GET /api/v1/hackathons
        reset_sql_tracker()
        t0 = time.perf_counter()
        res_hack = list_hackathons(db=db, current_user=user)
        t1 = time.perf_counter()
        total_hack = (t1 - t0) * 1000
        sql_hack = sum(sql_times)
        count_hack = sql_count[0]
        py_hack = total_hack - sql_hack
        print(f"\n2. GET /api/v1/hackathons:")
        print(f"   - Total Time       : {total_hack:.2f} ms")
        print(f"   - SQL Query Count  : {count_hack}")
        print(f"   - SQL Time         : {sql_hack:.2f} ms")
        print(f"   - Python/Ser Time  : {py_hack:.2f} ms")

        # 3. Benchmark Team Match Recommendations (POST /api/v1/ai/team-match & hackathon-recommendations)
        reset_sql_tracker()
        t0 = time.perf_counter()
        res_rec = get_hackathon_recommendations(db=db, current_user=user)
        t1 = time.perf_counter()
        total_rec = (t1 - t0) * 1000
        sql_rec = sum(sql_times)
        count_rec = sql_count[0]
        py_rec = total_rec - sql_rec
        print(f"\n3. GET /api/v1/ai/hackathon-recommendations:")
        print(f"   - Total Time       : {total_rec:.2f} ms")
        print(f"   - SQL Query Count  : {count_rec}")
        print(f"   - SQL Time         : {sql_rec:.2f} ms")
        print(f"   - Python/Ser Time  : {py_rec:.2f} ms")

        # 4. Benchmark POST /api/v1/demo/reset
        reset_sql_tracker()
        t0 = time.perf_counter()
        res_reset = reset_demo_account(body=ResetDemoRequest(email="demo@b2b2h.com"), db=db)
        t1 = time.perf_counter()
        total_reset = (t1 - t0) * 1000
        sql_reset = sum(sql_times)
        count_reset = sql_count[0]
        py_reset = total_reset - sql_reset
        print(f"\n4. POST /api/v1/demo/reset:")
        print(f"   - Total Time       : {total_reset:.2f} ms")
        print(f"   - SQL Query Count  : {count_reset}")
        print(f"   - SQL Time         : {sql_reset:.2f} ms")
        print(f"   - Python/Ser Time  : {py_reset:.2f} ms (includes bcrypt GIL delay)")

        print("="*60)

    finally:
        db.close()

if __name__ == "__main__":
    benchmark()
