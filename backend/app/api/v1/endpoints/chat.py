from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from jose import JWTError, jwt
from app.config import settings
from app.database import SessionLocal
from app.models.user import User
from app.models.chat import ChatMessage
from app.api.v1.endpoints.connection_manager import ConnectionManager
import logging
import json

from datetime import datetime, timezone

router = APIRouter()
manager = ConnectionManager()
logger = logging.getLogger(__name__)

def format_iso_utc(dt: datetime | None) -> str:
    if not dt:
        return ""
    if dt.tzinfo is None:
        dt = dt.replace(tzinfo=timezone.utc)
    return dt.isoformat()

@router.websocket("/ws/{team_id}")
async def websocket_endpoint(websocket: WebSocket, team_id: str, token: str = Query(None)):
    logger.info(f"[Chat] Incoming websocket request for team_id: {team_id}")
    db = SessionLocal()
    user_info = {}
    try:
        if not token:
            logger.warning("[Chat] Rejected: No token provided")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
        
        try:
            payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
            user_id: str | None = payload.get("sub")
            if user_id is None:
                logger.warning("[Chat] Rejected: Invalid token sub")
                await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
                return
            logger.info(f"[Chat] JWT validated for user_id: {user_id}")
        except JWTError as je:
            logger.warning(f"[Chat] Rejected: JWT decoding failed: {je}")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return

        user = db.query(User).filter(User.id == user_id).first()
        if user is None or not user.is_active:
            logger.warning(f"[Chat] Rejected: User {user_id} not found or inactive")
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        user_info = {
            "id": user.id,
            "name": user.name,
            "avatar": user.avatar
        }
        logger.info(f"[Chat] User authenticated: {user_info['name']}")
    except Exception as e:
        logger.exception(f"[Chat] Error during authentication: {e}")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return
    finally:
        db.close()

    # Associate authenticated user's ID
    websocket.scope["user_id"] = user_info["id"]

    try:
        await manager.connect(team_id, websocket, user_info)
        logger.info(f"[Chat] WebSocket accepted for user {user_info['name']} in team {team_id}")
    except Exception as e:
        logger.exception(f"[Chat] Error during manager.connect: {e}")
        await websocket.close(code=1011)
        return

    # Fetch user dictionary mapping for sender details in history
    history_db = SessionLocal()
    try:
        history_msgs = (
            history_db.query(ChatMessage)
            .filter(ChatMessage.team_id == team_id)
            .order_by(ChatMessage.created_at.desc())
            .limit(50)
            .all()
        )
        history_msgs.reverse()

        # Collect unique sender_ids to load user details efficiently
        sender_ids = list({m.sender_id for m in history_msgs if m.sender_id})
        senders = history_db.query(User).filter(User.id.in_(sender_ids)).all() if sender_ids else []
        sender_map = {s.id: {"name": s.name, "avatar": s.avatar} for s in senders}

        formatted_messages = []
        for msg in history_msgs:
            s_detail = sender_map.get(msg.sender_id, {})
            formatted_messages.append({
                "id": str(msg.id),
                "team_id": str(msg.team_id),
                "sender_id": str(msg.sender_id) if msg.sender_id else None,
                "sender_name": s_detail.get("name") or (f"User {msg.sender_id[:8]}" if msg.sender_id else "System"),
                "sender_avatar": s_detail.get("avatar"),
                "message": str(msg.message),
                "created_at": format_iso_utc(msg.created_at)
            })

        history_payload = {
            "type": "history",
            "messages": formatted_messages
        }
        await manager.send_personal_message(json.dumps(history_payload), websocket)
        logger.info(f"[Chat] History loaded and sent to user {user_info['name']}")
    except Exception as e:
        logger.exception(f"[Chat] Failed to load chat history for team {team_id}: {e}")
    finally:
        history_db.close()

    logger.info(f"[Chat] Ready for messages for user {user_info['name']}")

    try:
        while True:
            raw_data = await websocket.receive_text()
            msg_text = raw_data
            event_type = "message"

            # Parse JSON if payload is structured
            try:
                parsed = json.loads(raw_data)
                if isinstance(parsed, dict):
                    event_type = parsed.get("type", "message")
                    if event_type == "typing":
                        typing_payload = {
                            "type": "typing",
                            "user": {
                                "id": str(user_info["id"]),
                                "name": str(user_info["name"])
                            }
                        }
                        await manager.broadcast_to_team(team_id, json.dumps(typing_payload))
                        continue
                    elif "message" in parsed:
                        msg_text = str(parsed["message"])
                    elif "data" in parsed and isinstance(parsed["data"], dict) and "message" in parsed["data"]:
                        msg_text = str(parsed["data"]["message"])
            except Exception:
                msg_text = raw_data

            clean_text = msg_text.strip()
            if not clean_text:
                continue

            # Persist incoming message to DB
            db_message = None
            msg_db = SessionLocal()
            try:
                db_message = ChatMessage(
                    team_id=team_id,
                    sender_id=user_info["id"],
                    message=clean_text
                )
                msg_db.add(db_message)
                msg_db.commit()
                msg_db.refresh(db_message)
            except Exception as e:
                msg_db.rollback()
                logger.exception(f"[Chat] Failed to persist chat message: {e}")
            finally:
                msg_db.close()

            # Only broadcast if the database commit succeeded
            if db_message and db_message.id:
                broadcast_payload = {
                    "type": "message",
                    "data": {
                        "id": str(db_message.id),
                        "team_id": str(db_message.team_id),
                        "sender_id": str(db_message.sender_id),
                        "sender_name": str(user_info["name"]),
                        "sender_avatar": user_info.get("avatar"),
                        "message": str(db_message.message),
                        "created_at": format_iso_utc(db_message.created_at)
                    }
                }
                await manager.broadcast_to_team(team_id, json.dumps(broadcast_payload))
    except WebSocketDisconnect:
        logger.info(f"[Chat] WebSocketDisconnect for user {user_info.get('id')}")
        await manager.disconnect(team_id, websocket)
    except Exception as e:
        logger.exception(f"[Chat] Unexpected WebSocket error for user {user_info.get('id')}: {e}")
        await manager.disconnect(team_id, websocket)




