#!/usr/bin/env python3
"""BlueZ GATT service + LE advertisement for Debian/Linux."""

import asyncio
import json
import signal
from pathlib import Path
import subprocess
from typing import Any

from dbus_fast import BusType, PropertyAccess, Variant
from dbus_fast.aio import MessageBus
from dbus_fast.service import ServiceInterface, dbus_property, method

BLUEZ_SERVICE = "org.bluez"
OBJ_MANAGER_IFACE = "org.freedesktop.DBus.ObjectManager"
GATT_MANAGER_IFACE = "org.bluez.GattManager1"
LE_ADV_MANAGER_IFACE = "org.bluez.LEAdvertisingManager1"

APP_PATH = "/com/morph/app"
SERVICE_PATH = "/com/morph/app/service0"
CHAR_PATH = "/com/morph/app/service0/char0"
ADV_PATH = "/com/morph/advertisement0"

SERVICE_UUID = "a14ddb44-90a8-4b95-a604-66bdafe8a0fa"
CHAR_UUID = "a14ddb44-90a8-4b95-a604-66bdafe8a0fb"
# Advertising interval in milliseconds (BlueZ accepts 20ms to 10,485s).
# Use equal values for near-fixed cadence, or a small range.
ADV_MIN_INTERVAL_MS = 200
ADV_MAX_INTERVAL_MS = 300
DEVICE_ID_PATH = Path("/etc/morph/device_id")

# Wifi hotspot stuff
WIFI_CHAR_UUID = "eaf9ab55-aea7-4b8a-98b1-5b9b139f41e3"
WIFI_CHAR_PATH = "/com/morph/app/service0/char1"


class WifiProvisioningCharacteristic(ServiceInterface):
    def __init__(self) -> None:
        super().__init__("org.bluez.GattCharacteristic1")
        self.value = b""

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":
        return SERVICE_PATH

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return WIFI_CHAR_UUID

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":
        return ["write"]

    @method()
    def WriteValue(self, value: "ay", _options: "a{sv}") -> None:
        self.value = bytes(value)
        try:
            payload = json.loads(self.value.decode("utf-8"))
            ssid = payload.get("ssid")
            psk = payload.get("psk")
            if ssid and psk:
                print(f"Received WiFi provisioning data: SSID={ssid}, PSK={psk}")
                result = subprocess.run(
                    ["nmcli", "device", "wifi", "connect", ssid, "password", psk],
                    capture_output=True,
                    text=True,
                )
                if result.returncode == 0:
                    print(f"Successfully connected to WiFi network '{ssid}'")
                else:
                    print(
                        f"Failed to connect to WiFi network '{ssid}': {result.stderr}"
                    )
        except Exception as e:
            print(f"Error processing WiFi provisioning data: {e}")


class Application(ServiceInterface):
    def __init__(self) -> None:
        super().__init__(OBJ_MANAGER_IFACE)

    @method()
    def GetManagedObjects(self) -> "a{oa{sa{sv}}}":
        return {
            SERVICE_PATH: {
                "org.bluez.GattService1": {
                    "UUID": Variant("s", SERVICE_UUID),
                    "Primary": Variant("b", True),
                    "Includes": Variant("ao", []),
                }
            },
            CHAR_PATH: {
                "org.bluez.GattCharacteristic1": {
                    "Service": Variant("o", SERVICE_PATH),
                    "UUID": Variant("s", CHAR_UUID),
                    "Flags": Variant("as", ["read"]),
                    "Value": Variant("ay", b"ready"),
                }
            },
            WIFI_CHAR_PATH: {
                "org.bluez.GattCharacteristic1": {
                    "Service": Variant("o", SERVICE_PATH),
                    "UUID": Variant("s", WIFI_CHAR_UUID),
                    "Flags": Variant("as", ["write"]),
                }
            },
        }


class GattService(ServiceInterface):
    def __init__(self) -> None:
        super().__init__("org.bluez.GattService1")

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return SERVICE_UUID

    @dbus_property(access=PropertyAccess.READ)
    def Primary(self) -> "b":
        return True

    @dbus_property(access=PropertyAccess.READ)
    def Includes(self) -> "ao":
        return []


class GattCharacteristic(ServiceInterface):
    def __init__(self) -> None:
        super().__init__("org.bluez.GattCharacteristic1")
        self.value = b"ready"

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":
        return SERVICE_PATH

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return CHAR_UUID

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":
        return ["read"]

    @dbus_property(access=PropertyAccess.READ)
    def Value(self) -> "ay":
        return self.value

    @method()
    def ReadValue(self, _options: "a{sv}") -> "ay":
        return self.value


class Advertisement(ServiceInterface):
    def __init__(self, device_id: str) -> None:
        super().__init__("org.bluez.LEAdvertisement1")
        self.device_id = device_id

    @dbus_property(access=PropertyAccess.READ)
    def Type(self) -> "s":
        return "peripheral"

    @dbus_property(access=PropertyAccess.READ)
    def ServiceUUIDs(self) -> "as":
        return [SERVICE_UUID]

    @dbus_property(access=PropertyAccess.READ)
    def LocalName(self) -> "s":
        return "Morph"

    @dbus_property(access=PropertyAccess.READ)
    def ManufacturerData(self) -> "a{qv}":
        payload_bytes = f"ID={self.device_id}".encode("utf-8")
        return {0xFFFF: Variant("ay", payload_bytes)}

    @dbus_property(access=PropertyAccess.READ)
    def Includes(self) -> "as":
        return ["tx-power"]

    @dbus_property(access=PropertyAccess.READ)
    def MinInterval(self) -> "u":
        return ADV_MIN_INTERVAL_MS

    @dbus_property(access=PropertyAccess.READ)
    def MaxInterval(self) -> "u":
        return ADV_MAX_INTERVAL_MS

    @method()
    def Release(self) -> None:
        return None


def read_device_id() -> str:
    try:
        return DEVICE_ID_PATH.read_text(encoding="utf-8").strip()
    except OSError:
        return ""


async def find_adapter_path(bus: MessageBus) -> str:
    intro = await bus.introspect(BLUEZ_SERVICE, "/")
    obj = bus.get_proxy_object(BLUEZ_SERVICE, "/", intro)
    manager = obj.get_interface(OBJ_MANAGER_IFACE)
    managed: dict[str, dict[str, Any]] = await manager.call_get_managed_objects()
    for path, ifaces in managed.items():
        if GATT_MANAGER_IFACE in ifaces and LE_ADV_MANAGER_IFACE in ifaces:
            return path
    raise RuntimeError("No BLE adapter with GATT + LE advertising manager found")


async def main() -> None:
    bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
    adapter_path = await find_adapter_path(bus)
    device_id = read_device_id()

    app = Application()
    svc = GattService()
    ch = GattCharacteristic()
    wifi_ch = WifiProvisioningCharacteristic()
    adv = Advertisement(device_id)

    bus.export(APP_PATH, app)
    bus.export(SERVICE_PATH, svc)
    bus.export(CHAR_PATH, ch)
    bus.export(WIFI_CHAR_PATH, wifi_ch)
    bus.export(ADV_PATH, adv)

    adapter_intro = await bus.introspect(BLUEZ_SERVICE, adapter_path)
    adapter_obj = bus.get_proxy_object(BLUEZ_SERVICE, adapter_path, adapter_intro)
    gatt_mgr = adapter_obj.get_interface(GATT_MANAGER_IFACE)
    adv_mgr = adapter_obj.get_interface(LE_ADV_MANAGER_IFACE)

    await gatt_mgr.call_register_application(APP_PATH, {})
    await adv_mgr.call_register_advertisement(ADV_PATH, {})
    print(f"Advertising GATT service UUID: {SERVICE_UUID} on {adapter_path}")
    if device_id:
        print(f"Advertising DEVICE_ID from {DEVICE_ID_PATH}: {device_id}")
    else:
        print(f"No DEVICE_ID loaded from {DEVICE_ID_PATH}; advertising empty value.")
    print("Press Ctrl+C to stop.")

    stop_event = asyncio.Event()
    loop = asyncio.get_running_loop()
    loop.add_signal_handler(signal.SIGINT, stop_event.set)
    loop.add_signal_handler(signal.SIGTERM, stop_event.set)
    await stop_event.wait()

    await adv_mgr.call_unregister_advertisement(ADV_PATH)
    await gatt_mgr.call_unregister_application(APP_PATH)
    bus.unexport(ADV_PATH)
    bus.unexport(WIFI_CHAR_PATH)
    bus.unexport(CHAR_PATH)
    bus.unexport(SERVICE_PATH)
    bus.unexport(APP_PATH)
    bus.disconnect()
    print("Advertising stopped.")


if __name__ == "__main__":
    asyncio.run(main())
