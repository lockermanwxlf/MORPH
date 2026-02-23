from socketio import AsyncServer

from foxglove.client import FoxgloveClient
from robots.robot import Robot


class ClientManager:
    def __init__(self, sio: AsyncServer):
        self.sio = sio
        self.clients: list[FoxgloveClient] = []
        self.device_id_to_client: dict[str, FoxgloveClient] = {}

    async def add_robot(self, robot: Robot):
        client = FoxgloveClient(robot, self.sio)
        if robot.device_id in self.device_id_to_client:
            print(f"Already connected to robot {robot.device_id}, skipping")
            return

        self.clients.append(client)
        self.device_id_to_client[robot.device_id] = client

        await self.sio.emit(
            "robot_added",
            {
                "host": robot.ip_addresses[0],
                "port": robot.port,
                "device_id": robot.device_id,
            },
            to="robots",
        )

        await client.connect()

    async def remove_robot(self, device_id: str):
        client = self.device_id_to_client.get(device_id)
        if not client:
            return

        if client._ws:
            await client._ws.close()
        self.clients.remove(client)
        del self.device_id_to_client[device_id]

        await self.sio.emit(
            "robot_removed",
            {
                "device_id": device_id,
            },
            to="robots",
        )
