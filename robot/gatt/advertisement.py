from dbus_fast import PropertyAccess, Variant
from dbus_fast.service import ServiceInterface, dbus_property, method

from gatt.config import SERVICE_UUID


class Advertisement(ServiceInterface):
    def __init__(self, name):
        super().__init__("org.bluez.LEAdvertisement1")
        self.name = name
        self.payload = {"ST": -1}

    @dbus_property(access=PropertyAccess.READ)
    def Type(self) -> "s":
        return "peripheral"

    @dbus_property(access=PropertyAccess.READ)
    def ServiceUUIDs(self) -> "as":
        return [SERVICE_UUID]

    @dbus_property(access=PropertyAccess.READ)
    def Includes(self) -> "as":
        return ["tx-power", "local-name"]

    @dbus_property(access=PropertyAccess.READ)
    def LocalName(self) -> "s":
        return self.name

    @dbus_property(access=PropertyAccess.READ)
    def ManufacturerData(self) -> "a{qv}":
        payload_str = ",".join([f"{k},{v}" for k, v in self.payload.items()])
        payload_bytes = payload_str.encode("utf-8")
        return {0xFFFF: Variant("ay", payload_bytes)}

    def set_network_state(self, state: int):
        self.payload["ST"] = state

    @dbus_property(access=PropertyAccess.READ)
    def MinInterval(self) -> "u":
        return 200

    @dbus_property(access=PropertyAccess.READ)
    def MaxInterval(self) -> "u":
        return 300

    @method()
    def Release(self) -> None:
        return None
