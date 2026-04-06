import asyncio
from encodings.uu_codec import uu_decode
from itertools import count
import json
from multiprocessing import process
import socket

from dbus_fast import PropertyAccess
from dbus_fast.aio import MessageBus
from dbus_fast.service import ServiceInterface, dbus_property, method

from gatt.constants import GATT_CHARACTERISTIC_IFACE


class NetworkStateCharacteristic(ServiceInterface):
    def __init__(self, service_path, uuid):
        super().__init__(GATT_CHARACTERISTIC_IFACE)
        self.service_path = service_path
        self.uuid = uuid
        self.payload = {"ssid": None, "host": None, "etag": -1}

    def set_payload(self, ssid: str, host: str, counter: int):
        self.payload = {"ssid": ssid, "host": host, "etag": counter}

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":
        return self.service_path

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return self.uuid

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":
        return ["read"]

    @method()
    async def ReadValue(self, _options: "a{sv}") -> "ay":
        return json.dumps(self.payload).encode("utf-8")
