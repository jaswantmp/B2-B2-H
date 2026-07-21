from typing import Dict, List, Any
import logging
import json
from fastapi import WebSocket

logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        # Maps team_id to a list of dicts: {"websocket": WebSocket, "user_id": str, "user_name": str, "user_avatar": str}
        self.team_connections: Dict[str, List[Dict[str, Any]]] = {}

    async def connect(self, team_id: str, websocket: WebSocket, user_info: Dict[str, Any]):
        await websocket.accept()
        if team_id not in self.team_connections:
            self.team_connections[team_id] = []
            logger.info(f"[Chat] Created room: {team_id}")
            
        connection_entry = {
            "websocket": websocket,
            "user_id": user_info.get("id"),
            "name": user_info.get("name", "Unknown User"),
            "avatar": user_info.get("avatar")
        }
        self.team_connections[team_id].append(connection_entry)
        num_users = len(self.team_connections[team_id])
        logger.info(f"[Chat] User {user_info.get('name')} connected to {team_id} ({num_users} users)")

        # Broadcast updated presence snapshot to room
        await self.broadcast_presence(team_id)

    async def disconnect(self, team_id: str, websocket: WebSocket):
        if team_id in self.team_connections:
            self.team_connections[team_id] = [
                conn for conn in self.team_connections[team_id] if conn["websocket"] != websocket
            ]
            num_users = len(self.team_connections[team_id])
            logger.info(f"[Chat] User disconnected from {team_id} ({num_users} users remaining)")
            
            if not self.team_connections[team_id]:
                del self.team_connections[team_id]
                logger.info(f"[Chat] Removed empty room: {team_id}")
            else:
                # Broadcast presence update to remaining users
                await self.broadcast_presence(team_id)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast_to_team(self, team_id: str, message: str):
        if team_id in self.team_connections:
            for conn in list(self.team_connections[team_id]):
                try:
                    await conn["websocket"].send_text(message)
                except Exception:
                    pass

    async def get_online_users(self, team_id: str) -> List[Dict[str, Any]]:
        if team_id not in self.team_connections:
            return []
        
        seen_user_ids = set()
        unique_users = []
        for conn in self.team_connections[team_id]:
            uid = str(conn["user_id"]) if conn.get("user_id") else None
            if uid and uid not in seen_user_ids:
                seen_user_ids.add(uid)
                unique_users.append({
                    "id": uid,
                    "name": str(conn.get("name", "Unknown User")),
                    "avatar": str(conn["avatar"]) if conn.get("avatar") else None,
                    "is_online": True
                })
        return unique_users

    async def broadcast_presence(self, team_id: str):
        try:
            online_users = await self.get_online_users(team_id)
            presence_payload = {
                "type": "presence",
                "users": online_users
            }
            await self.broadcast_to_team(team_id, json.dumps(presence_payload))
        except Exception as e:
            logger.exception(f"[Chat] Failed to broadcast presence for team {team_id}: {e}")




