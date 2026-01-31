import asyncio
import subprocess

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from foxglove.capabilities.twist import Twist
from foxglove.client_manager import FoxgloveClientManager
from ip.ip_manager import IpManager
from robots.robot import Robot

ip_manager = IpManager()
robots = []
client_manager = FoxgloveClientManager()

app = FastAPI()


def add_client_to_tunnel(public_key: str, assigned_ip: str):
    try:
        # Use the 'wg' tool to talk to the userspace daemon
        # This is the standard way to update wireguard-go without restarts
        subprocess.run(
            [
                "wg",
                "set",
                "wg0",
                "peer",
                public_key,
                "allowed-ips",
                f"{assigned_ip}/32",
                "persistent-keepalive",
                "25",
            ],
            check=True,
        )
    except subprocess.CalledProcessError as e:
        print(f"WireGuard-Go Error: {e}")
        raise HTTPException(
            status_code=500, detail="Failed to add peer to userspace tunnel"
        )


class ConnectRequest(BaseModel):
    public_key: str


@app.post("/robot/connect")
async def connect(request: ConnectRequest):
    assigned_ip = ip_manager.get_free_ip()
    add_client_to_tunnel(request.public_key, assigned_ip)
    robot = Robot(
        name="robot",
        tunnel_host=assigned_ip,
        foxglove_port=8765,
    )
    robots.append(robot)
    return {
        "assigned_ip": assigned_ip,
        "server_pk": open("/etc/wireguard/publickey").read().strip(),
    }


async def loop():
    while True:
        await asyncio.sleep(5)
        print("Loop")
        for robot in robots:
            client = client_manager.get_client(robot)
            try:
                await client.connect()
                await client.advertise("/cmd_vel", "geometry_msgs/msg/Twist")
                await client.send(Twist(1, 0, 0, 0, 0, 0))
            except ConnectionRefusedError:
                print(f"Connection refused to {robot.tunnel_host}:{robot.foxglove_port}, will retry...")
            except Exception as e:
                print(f"Error connecting to robot: {e}")


asyncio.create_task(loop())
