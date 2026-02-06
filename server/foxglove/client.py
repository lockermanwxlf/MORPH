import json
from engineio import AsyncServer
import websockets
from websockets import ClientConnection, Subprotocol, State

from foxglove.capabilities.diff_drive import DiffDrive
from foxglove.messages.twist_stamped import TwistStamped


class FoxgloveClient:
    def __init__(self, host: str, port: int, sio: AsyncServer):
        self.host = host
        self.port = port
        self._ws: ClientConnection | None = None
        self.channel_id = 1
        self.sio = sio
        self.listener_sid: str | None = None

    async def log(self, msg: str):
        print("[FoxgloveClient]", msg)
        if self.listener_sid:
            await self.sio.emit("log", {"message": msg}, to=self.listener_sid)

    def set_listener_sid(self, sid: str | None):
        self.listener_sid = sid

    async def connect(self):
        if self._ws and (
            self._ws.protocol.state == State.OPEN
            or self._ws.protocol.state == State.CONNECTING
        ):
            return

        # Connect to Foxglove websocket
        url = f"ws://{self.host}:{self.port}"
        await self.log(f"Connecting to Foxglove websocket at {url}")
        self._ws = await websockets.connect(
            url, subprotocols=[Subprotocol("foxglove.sdk.v1")]
        )
        await self.log(f"Connected to Foxglove websocket at {url}")

        # Get server info
        await self.log("Getting server info")
        msg = await self._ws.recv()
        server_info = json.loads(msg)
        await self.log(f"Got server info: {server_info}")

        # Advertise channels
        await self.log("Advertising diff drive channel")
        await self._ws.send(DiffDrive.make_advertisement_frame(self.channel_id))
        await self.log("Advertised diff drive channel")

    async def send_diff_drive_command(self, twist: TwistStamped):
        if not self._ws or self._ws.protocol.state != State.OPEN:
            raise ConnectionError("WebSocket is not connected")

        frame = DiffDrive.make_command_frame(twist, self.channel_id, "base_link")
        await self.log(f"Sending diff drive command: {twist}")
        await self._ws.send(frame)
        await self.log("Sent diff drive command")
