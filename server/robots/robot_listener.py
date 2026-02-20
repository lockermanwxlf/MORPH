import asyncio
from math import inf
import socket
from zeroconf import ServiceListener, Zeroconf
from zeroconf.asyncio import AsyncZeroconf, AsyncServiceInfo

from foxglove.client_manager import ClientManager
from robots.robot import Robot


class RobotListener(ServiceListener):

    def __init__(self, client_manager: ClientManager):
        super().__init__()
        self.client_manager = client_manager

    def update_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        print(f"Service {name} updated")

    def remove_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        info = zc.get_service_info(type_, name)
        if info and info.addresses and info.port:
            addresses = [socket.inet_ntoa(addr) for addr in info.addresses]
            port = info.port
            robot = Robot(ip_addresses=addresses, port=port)
            asyncio.run(self.client_manager.remove_robot(robot))

    def add_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        info = zc.get_service_info(type_, name)
        if info and info.addresses and info.port:
            addresses = [socket.inet_ntoa(addr) for addr in info.addresses]
            port = info.port
            robot = Robot(ip_addresses=addresses, port=port)
            asyncio.run(self.client_manager.add_robot(robot))
        print(self.client_manager.clients)
