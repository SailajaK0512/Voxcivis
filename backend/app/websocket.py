import json
from typing import Dict, List
from fastapi import WebSocket

class ConnectionManager:
    def __init__(self):
        # Maps channel/room name -> list of WebSocket connections
        self.rooms: Dict[str, List[WebSocket]] = {
            "admin": [],
            "all": []
        }

    async def connect(self, websocket: WebSocket, channel: str = "all"):
        await websocket.accept()
        if channel not in self.rooms:
            self.rooms[channel] = []
        self.rooms[channel].append(websocket)

    def disconnect(self, websocket: WebSocket, channel: str = "all"):
        if channel in self.rooms and websocket in self.rooms[channel]:
            self.rooms[channel].remove(websocket)

    async def broadcast_to_channel(self, channel: str, message: dict):
        if channel in self.rooms:
            disconnected = []
            for connection in self.rooms[channel]:
                try:
                    await connection.send_text(json.dumps(message))
                except Exception:
                    disconnected.append(connection)
            for dead in disconnected:
                if dead in self.rooms[channel]:
                    self.rooms[channel].remove(dead)

    async def broadcast_event(self, event_type: str, payload: dict, department_id: int = None, user_id: int = None):
        msg = {"type": event_type, "payload": payload}
        # Broadcast to admin
        await self.broadcast_to_channel("admin", msg)
        await self.broadcast_to_channel("all", msg)

        # Broadcast to department room if worker relevant
        if department_id is not None:
            dept_channel = f"dept_{department_id}"
            await self.broadcast_to_channel(dept_channel, msg)

        # Broadcast to specific citizen
        if user_id is not None:
            user_channel = f"user_{user_id}"
            await self.broadcast_to_channel(user_channel, msg)

manager = ConnectionManager()
