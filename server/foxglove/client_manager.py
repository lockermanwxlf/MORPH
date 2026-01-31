from foxglove.client import FoxgloveClient
from robots.robot import Robot


class FoxgloveClientManager:
    def __init__(self):
        self.clients: dict[Robot, FoxgloveClient] = {}

    def get_client(self, robot: Robot) -> FoxgloveClient:
        if robot not in self.clients:
            self.clients[robot] = FoxgloveClient(robot.tunnel_host, robot.foxglove_port)
        return self.clients[robot]
