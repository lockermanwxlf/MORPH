import asyncio
import socket
from collections.abc import Coroutine
from threading import Lock
from typing import Any
from zeroconf import ServiceInfo, ServiceListener, Zeroconf

from foxglove.client_manager import ClientManager
from robots.robot import Robot


class RobotListener(ServiceListener):
    def __init__(self, client_manager: ClientManager, loop: asyncio.AbstractEventLoop):
        super().__init__()
        self.client_manager = client_manager
        self.loop = loop
        # Cache discovery metadata by service name so remove events do not rely on
        # querying zeroconf for already-gone records.
        self._service_to_device_id: dict[str, str] = {}
        self._lock = Lock()

    def _schedule(self, coro: Coroutine[Any, Any, Any]) -> None:
        def _create_task() -> None:
            asyncio.create_task(coro)

        self.loop.call_soon_threadsafe(_create_task)

    def _get_device_id(self, info: ServiceInfo) -> str | None:
        if info.properties:
            device_id = info.properties.get(b"DEVICE_ID")
            if device_id:
                return device_id.decode("utf-8")
        return None

    def _robot_from_info(self, info: ServiceInfo) -> Robot | None:
        if not info.addresses or not info.port:
            return None

        device_id = self._get_device_id(info)
        if not device_id:
            return None

        addresses = [socket.inet_ntoa(addr) for addr in info.addresses]
        return Robot(ip_addresses=addresses, port=info.port, device_id=device_id)

    def update_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        info = zc.get_service_info(type_, name)
        if not info:
            print(f"Service {name} updated but no info found", flush=True)
            return

        robot = self._robot_from_info(info)
        if not robot:
            print(f"Service {name} updated but missing robot fields", flush=True)
            return

        with self._lock:
            self._service_to_device_id[name] = robot.device_id
        self._schedule(self.client_manager.add_robot(robot))

    def remove_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        with self._lock:
            device_id = self._service_to_device_id.pop(name, None)

        if not device_id:
            info = zc.get_service_info(type_, name)
            if info:
                device_id = self._get_device_id(info)

        if not device_id:
            print(
                f"Service {name} removed but no cached device ID found, skipping",
                flush=True,
            )
            return

        self._schedule(self.client_manager.remove_robot(device_id))

    def add_service(self, zc: Zeroconf, type_: str, name: str) -> None:
        info = zc.get_service_info(type_, name)
        if not info:
            print(f"Service {name} added but no info found, skipping", flush=True)
            return

        robot = self._robot_from_info(info)
        if not robot:
            print(f"Service {name} added but no device ID found, skipping", flush=True)
            return

        with self._lock:
            self._service_to_device_id[name] = robot.device_id
        self._schedule(self.client_manager.add_robot(robot))
