import json
from websockets import ClientConnection, ClientProtocol, State, Subprotocol
import websockets

from foxglove.capabilities.twist import Twist, encode_twist_msg


class FoxgloveClient:
    def __init__(self, host: str, port: int) -> None:
        self._host = host
        self._port = port
        self._ws: ClientConnection | None = None

    @property
    def connected(self):
        return self._ws and self._ws.protocol.state == State.OPEN

    @property
    def connecting(self):
        return self._ws and self._ws.protocol.state == State.CONNECTING

    async def connect(self) -> None:
        if self._ws and (self.connected or self.connecting):
            return

        uri = f"ws://{self._host}:{self._port}"
        self._ws = await websockets.connect(
            uri, subprotocols=[Subprotocol("foxglove.sdk.v1")]
        )

    async def __aexit__(self, exc_type, exc, tb):
        if self._ws:
            await self._ws.close()

    async def send(self, twist: Twist):
        if not self._ws or not self.connected:
            raise RuntimeError("WebSocket is not connected")

        await self._ws.send(encode_twist_msg(twist, channel_id=1))

    async def advertise(self, topic: str, schemaName: str):
        if not self._ws or not self.connected:
            raise RuntimeError("WebSocket is not connected")
        
        advertise_op = {
            "op": "advertise",
            "channels": [
                {
                    "id": 1,
                    "topic": topic,
                    "encoding": "cdr",
                    "schemaName": schemaName,
                }
            ]
        }

        await self._ws.send(json.dumps(advertise_op))