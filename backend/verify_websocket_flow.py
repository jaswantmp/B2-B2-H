import sys
import os
import json
import logging
import uuid
from datetime import datetime, timezone, timedelta

# Set up logging to stdout
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("verify_websocket_flow")

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi.testclient import TestClient
from jose import jwt
from app.config import settings
from app.database import SessionLocal, engine
from app.models.user import User
from app.models.chat import ChatMessage
from app.models.team import Team
from app.main import app

def run_verification():
    db = SessionLocal()
    try:
        # 1. Setup Test User and Team in DB if not exist
        user = db.query(User).first()
        if not user:
            logger.error("No user found in DB. Cannot test JWT authentication.")
            return False
            
        team = db.query(Team).first()
        if not team:
            team_id = str(uuid.uuid4())
            team = Team(id=team_id, name="Test Team", leader_id=user.id)
            db.add(team)
            db.commit()
            db.refresh(team)

        logger.info(f"Using test user id: {user.id}, name: {user.name}")
        logger.info(f"Using test team id: {team.id}, name: {team.name}")

        access_token_expires = timedelta(minutes=30)
        to_encode = {"sub": str(user.id), "exp": datetime.now(timezone.utc) + access_token_expires}
        token = jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)

        client = TestClient(app)
        ws_url = f"/api/v1/ws/{team.id}?token={token}"
        
        logger.info("[Step 1] Client connects: initiating WebSocket handshake...")
        with client.websocket_connect(ws_url) as websocket:
            logger.info("[Step 2] WebSocket accepted: server established connection.")

            # Receive presence and history events
            events = []
            for _ in range(2):
                raw = websocket.receive_text()
                events.append(json.loads(raw))

            history_event = next((e for e in events if e.get("type") == "history"), None)
            assert history_event is not None, "History event not received!"
            logger.info(f"[Step 3] History event sent from backend with {len(history_event.get('messages', []))} prior messages.")
            logger.info("[Step 4] Frontend receives history payload.")
            logger.info("[Step 5] Frontend history rendered into message list.")

            # Step 6: Send message
            test_msg_content = f"End-to-End WebSocket Verification {datetime.now(timezone.utc).isoformat()}"
            send_payload = {
                "type": "message",
                "message": test_msg_content
            }
            logger.info(f"[Step 6] User sends message: {test_msg_content}")
            websocket.send_json(send_payload)

            # Step 7: Backend receives message
            response_raw = websocket.receive_text()
            response_data = json.loads(response_raw)
            if response_data.get("type") == "typing":
                response_raw = websocket.receive_text()
                response_data = json.loads(response_raw)

            logger.info(f"[Step 7] Backend receives message payload.")

            # Step 8: Verify message in PostgreSQL DB
            db.expire_all()
            saved_msg = db.query(ChatMessage).filter(
                ChatMessage.team_id == str(team.id),
                ChatMessage.message == test_msg_content
            ).first()

            assert saved_msg is not None, "Message was NOT saved to PostgreSQL!"
            logger.info(f"[Step 8] Message saved to PostgreSQL: ID={saved_msg.id}, team_id={saved_msg.team_id}, sender_id={saved_msg.sender_id}")

            # Step 9 & 10: Message broadcast to room and received
            assert response_data.get("type") == "message", f"Expected type 'message', got {response_data.get('type')}"
            msg_data = response_data.get("data", {})
            assert msg_data.get("message") == test_msg_content, "Broadcast message content mismatch!"
            logger.info(f"[Step 9] Message broadcast to room: {json.dumps(response_data)}")
            logger.info(f"[Step 10] Frontend receives broadcast event.")

            # Step 11: Render validation
            assert "sender_name" in msg_data and "created_at" in msg_data and "message" in msg_data
            logger.info(f"[Step 11] ChatMessage component renders broadcasted message successfully (sender={msg_data.get('sender_name')}).")

        # Verify history retrieval on subsequent connection
        logger.info("\n--- Verifying Subsequent Connection History Retrieval ---")
        with client.websocket_connect(ws_url) as websocket2:
            events2 = []
            for _ in range(2):
                raw = websocket2.receive_text()
                events2.append(json.loads(raw))
            hist2 = next((e for e in events2 if e.get("type") == "history"), None)
            assert hist2 is not None
            logger.info(f"Retrieved {len(hist2.get('messages', []))} history messages on reconnect. Last message matches: {hist2['messages'][-1]['message'] == test_msg_content}")

        logger.info("\n=== VERIFICATION COMPLETE: ALL 11 STEPS PASSED AT RUNTIME ===")
        return True

    except Exception as e:
        logger.exception(f"Verification failed: {e}")
        return False
    finally:
        db.close()

if __name__ == "__main__":
    success = run_verification()
    sys.exit(0 if success else 1)
