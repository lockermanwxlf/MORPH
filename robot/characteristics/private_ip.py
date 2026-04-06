import json
from collections.abc import Awaitable, Callable

from dbus_fast import PropertyAccess
from dbus_fast.service import ServiceInterface, dbus_property, method

from config import PRIVATE_IP_CHAR_UUID, SERVICE_PATH
from constants import GATT_CHARACTERISTIC_IFACE


class PrivateIpCharacteristic(ServiceInterface):
    def __init__(
        self,
        get_current_network_details: Callable[[], Awaitable[tuple[str, str]]],
        get_network_state_counter: Callable[[], int],
    ) -> None:
        super().__init__(GATT_CHARACTERISTIC_IFACE)
        self._get_current_network_details = get_current_network_details
        self._get_network_state_counter = get_network_state_counter
        self.cached_network_state: int | None = None
        self.cached_payload = b""

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":
        return SERVICE_PATH

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return PRIVATE_IP_CHAR_UUID

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":
        return ["read"]

    async def update_cached_value(self) -> None:
        network_state = self._get_network_state_counter()
        if self.cached_network_state != network_state:
            _ssid, private_ip = await self._get_current_network_details()
            self.cached_network_state = network_state
            self.cached_payload = json.dumps(
                {"private_ip": private_ip, "st": network_state}
            ).encode("utf-8")

    @method()
    async def ReadValue(self, _options: "a{sv}") -> "ay":
        return self.cached_payload
