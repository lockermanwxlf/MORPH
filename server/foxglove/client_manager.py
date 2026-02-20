from foxglove.client import FoxgloveClient
from robots.robot import Robot


class ClientManager:
    def __init__(self, sio):
        self.sio = sio
        self.clients: list[FoxgloveClient] = []
        self.ip_to_client: dict[str, FoxgloveClient] = {}

    async def add_robot(self, robot: Robot):
        client = FoxgloveClient(robot, self.sio)
        if any(ip in self.ip_to_client for ip in robot.ip_addresses):
            print(f"Already connected to robot at {robot.ip_addresses}, skipping")
            return

        self.clients.append(client)
        for ip in robot.ip_addresses:
            self.ip_to_client[ip] = client
        await client.connect()

    async def remove_robot(self, robot: Robot):
        clients = [self.ip_to_client.get(ip) for ip in robot.ip_addresses]
        clients = [c for c in clients if c]
        for client in clients:
            await client._ws.close()
            self.clients.remove(client)
        for ip in robot.ip_addresses:
            if ip in self.ip_to_client:
                del self.ip_to_client[ip]
