import asyncio
from fastapi import FastAPI
from fastapi.concurrency import asynccontextmanager
from pydantic import BaseModel
import socketio
from zeroconf import ServiceBrowser, Zeroconf
from zeroconf.asyncio import AsyncZeroconf, AsyncServiceBrowser
from fastapi.middleware.cors import CORSMiddleware

from foxglove.client_manager import ClientManager
from foxglove.client import FoxgloveClient
from foxglove.messages.twist_stamped import TwistStamped
from robots.robot import Robot
from robots.robot_listener import RobotListener

sio = socketio.AsyncServer(
    async_mode="asgi",
    cors_allowed_origins="*",
    logger=False,
    engineio_logger=False,
)

client_manager = ClientManager(sio=sio)


@asynccontextmanager
async def lifespan(app: FastAPI):
    zc = Zeroconf()
    loop = asyncio.get_running_loop()
    browser = ServiceBrowser(
        zc,
        "_morph-ws._tcp.local.",
        RobotListener(client_manager=client_manager, loop=loop),
    )

    yield
    zc.close()


app = FastAPI(lifespan=lifespan)


app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

sid_to_client: dict[str, FoxgloveClient] = {}

connection_lock = asyncio.Lock()


class ConnectBody(BaseModel):
    host: str
    port: int


def get_robots_body():
    return [
        {"host": client.host, "port": client.port, "device_id": client.device_id}
        for client in client_manager.clients
    ]


# TODO: robot needs to host an endpoint that exposes their device_id so client
# can just type in the IP and port.

# @app.post("/robot/connect")
# async def connect_robot(body: ConnectBody):
#    async with connection_lock:
#        if body.host in client_manager.ip_to_client:
#            return {"status": "already connected", "robots": get_robots_body()}
#        robot = Robot(ip_addresses=[body.host], port=body.port)
#        try:
#            await client_manager.add_robot(robot)
#        except Exception:
#            return {"status": "connection failed", "robots": get_robots_body()}
#    return {
#        "status": "connected",
#        "robots": get_robots_body(),
#    }


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


@sio.on("subscribe")  # type: ignore
async def handle_subscribe(sid: str, data: dict):
    topic = data.get("topic")
    if not topic:
        return {"status": "error", "message": "topic required"}
    await sio.enter_room(sid, topic)


@sio.on("unsubscribe")  # type: ignore
async def handle_unsubscribe(sid: str, data: dict):
    topic = data.get("topic")
    if not topic:
        return {"status": "error", "message": "topic required"}
    await sio.leave_room(sid, topic)


@sio.on("connect_robot")  # type: ignore
async def handle_connect(sid: str, data: dict):
    print(data)
    if not isinstance(data, dict):
        return {"status": "error", "message": "payload must be an object"}
    device_id = data.get("device_id")
    if not device_id:
        return {"status": "error", "message": "device_id required"}
    if device_id not in client_manager.device_id_to_client:
        return {"status": "error", "message": "robot device_id not recognized"}
    client = client_manager.device_id_to_client[device_id]
    sid_to_client[sid] = client
    client.set_listener_sid(sid)
    return {"status": "ok", "message": "connected to robot"}


@sio.on("disconnect_robot")  # type: ignore
async def handle_disconnect_robot(sid: str):
    if sid in sid_to_client:
        client = sid_to_client[sid]
        client.set_listener_sid(None)
        del sid_to_client[sid]
    return {"status": "ok", "message": "disconnected from robot"}


@sio.on("diff_drive")  # type: ignore
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


@sio.on("diff_drive_wasd")  # type: ignore
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
