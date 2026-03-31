from socketio import AsyncServer

from foxglove.client import FoxgloveClient
from robots.robot import Robot


class ClientManager:
    def __init__(self, sio: AsyncServer):
        self.sio = sio
        self.clients: list[FoxgloveClient] = []
        self.device_id_to_client: dict[str, FoxgloveClient] = {}

    async def add_robot(self, robot: Robot):
        if robot.device_id in self.device_id_to_client:
            # If IP is the same, break.
            if not set(
                self.device_id_to_client[robot.device_id].robot.ip_addresses
            ).isdisjoint(robot.ip_addresses):
                return
            await self.remove_robot(robot.device_id)

        client = FoxgloveClient(robot, self.sio)
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
