"""
ws_manager.py
Manages active WebSocket connections keyed by job_id.
The generation worker calls broadcast_progress(); the frontend
listens via /ws/{job_id}.
"""
import asyncio
import json
from collections import defaultdict

from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        # job_id → list of connected WebSockets
        self._connections: dict[int, list[WebSocket]] = defaultdict(list)

    async def connect(self, job_id: int, ws: WebSocket) -> None:
        await ws.accept()
        self._connections[job_id].append(ws)

    def disconnect(self, job_id: int, ws: WebSocket) -> None:
        conns = self._connections.get(job_id, [])
        if ws in conns:
            conns.remove(ws)
        if not conns:
            self._connections.pop(job_id, None)

    async def broadcast_progress(self, job_id: int, progress: int, status: str) -> None:
        payload = json.dumps({"job_id": job_id, "progress": progress, "status": status})
        dead: list[WebSocket] = []
        for ws in list(self._connections.get(job_id, [])):
            try:
                await ws.send_text(payload)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.disconnect(job_id, ws)

    async def close_all(self, job_id: int) -> None:
        for ws in list(self._connections.get(job_id, [])):
            try:
                await ws.close()
            except Exception:
                pass
        self._connections.pop(job_id, None)


ws_manager = ConnectionManager()
