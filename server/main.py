import asyncio
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from pydantic import BaseModel
import socketio
from zeroconf import Zeroconf

from foxglove.client import FoxgloveClient
from foxglove.messages.twist_stamped import TwistStamped


app = FastAPI()


@asynccontextmanager
async def lifespan(app: FastAPI):
    zc = Zeroconf()

    yield
    zc.close()


sid_to_client: dict[str, FoxgloveClient] = {}
clients: dict[str, FoxgloveClient] = {}

connection_lock = asyncio.Lock()

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)


class ConnectBody(BaseModel):
    host: str
    port: int


def get_robots_body():
    return [{"host": client.host, "port": client.port} for client in clients.values()]


@app.post("/robot/connect")
async def connect_robot(body: ConnectBody):
    async with connection_lock:
        if body.host in clients:
            return {"status": "already connected", "robots": get_robots_body()}
        client = FoxgloveClient(body.host, body.port, sio)
        try:
            await client.connect()
        except Exception:
            return {"status": "connection failed", "robots": get_robots_body()}
        clients[body.host] = client
    return {
        "status": "connected",
        "robots": get_robots_body(),
    }


@app.get("/robots")
async def list_robots():
    return {
        "status": "ok",
        "robots": get_robots_body(),
    }


@sio.event
async def connect(sid: str, environ: dict):
    return True


@sio.event
async def disconnect(sid: str):
    if sid in sid_to_client:
        client = sid_to_client[sid]
        client.set_listener_sid(None)
        del sid_to_client[sid]


@sio.on("connect_robot")
async def handle_connect(sid: str, data: dict):
    print(data)
    if not isinstance(data, dict):
        return {"status": "error", "message": "payload must be an object"}
    host = data.get("host")
    port = data.get("port")
    if not host or not port:
        return {"status": "error", "message": "host and port required"}
    if host not in clients:
        return {"status": "error", "message": "robot not connected"}
    client = clients[host]
    sid_to_client[sid] = client
    client.set_listener_sid(sid)
    return {"status": "ok", "message": "connected to robot"}


@sio.on("diff_drive")
async def diff_drive(sid: str, data: dict):
    if sid not in sid_to_client:
        return

    # Get speed
    speed = data.get("speed", 0.0)
    speed = max(100, min(0, speed)) / 100

    # Get twist
    direction = data.get("direction", "stop")
    direction_to_linear_x = {"forward": 0.5, "backward": -0.5}
    direction_to_angular_z = {"left": 0.5, "right": -0.5}
    twist = TwistStamped(
        0,
        0,
        direction_to_linear_x.get(direction, 0.0) * speed,
        0.0,
        0.0,
        0.0,
        0.0,
        direction_to_angular_z.get(direction, 0.0) * speed,
    )

    client = sid_to_client[sid]
    await client.send_diff_drive_command(twist)


@sio.on("diff_drive_wasd")
async def handle_diff_drive_wasd(sid: str, data: dict):
    if sid not in sid_to_client:
        return

    # Get speed
    speed = data.get("speed", 0.0)
    speed = max(100, min(0, speed)) / 100

    # Get twist
    w = data.get("w", False)
    a = data.get("a", False)
    s = data.get("s", False)
    d = data.get("d", False)
    direction_to_linear_x = {"w": 0.5, "s": -0.5}
    direction_to_angular_z = {"a": 0.5, "d": -0.5}
    twist = TwistStamped(
        0,
        0,
        (
            (direction_to_linear_x["w"] if w else 0)
            + (direction_to_linear_x["s"] if s else 0)
        )
        * speed,
        0.0,
        0.0,
        0.0,
        0.0,
        (
            (direction_to_angular_z["a"] if a else 0)
            + (direction_to_angular_z["d"] if d else 0)
        )
        * speed,
    )

    client = sid_to_client[sid]
    await client.send_diff_drive_command(twist)


app = socketio.ASGIApp(sio, app)
