#!/usr/bin/env python3
"""BlueZ GATT service + LE advertisement for Debian/Linux."""

import asyncio
import json
import signal
import socket
from pathlib import Path
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

NM_SERVICE = "org.freedesktop.NetworkManager"
NM_PATH = "/org/freedesktop/NetworkManager"
NM_IFACE = "org.freedesktop.NetworkManager"

SERVICE_UUID = "a14ddb44-90a8-4b95-a604-66bdafe8a0fa"
CHAR_UUID = "a14ddb44-90a8-4b95-a604-66bdafe8a0fb"
# Advertising interval in milliseconds (BlueZ accepts 20ms to 10,485s).
# Use equal values for near-fixed cadence, or a small range.
ADV_MIN_INTERVAL_MS = 200
ADV_MAX_INTERVAL_MS = 300
DEVICE_ID_PATH = Path("/etc/morph/device_id")

# Global network state counter
network_state_counter = 0

# avahi-publish process handle
avahi_proc: asyncio.subprocess.Process | None = None

# Wifi hotspot stuff
WIFI_CHAR_UUID = "eaf9ab55-aea7-4b8a-98b1-5b9b139f41e3"
WIFI_CHAR_PATH = "/com/morph/app/service0/char1"


# ssid request
WIFI_STATUS_CHAR_UUID = "a2169d6e-07aa-457e-8139-19803dbd6bfd"
WIFI_STATUS_CHAR_PATH = "/com/morph/app/service0/char2"


class WifiStatusCharacteristic(ServiceInterface):
    def __init__(self) -> None:
        super().__init__("org.bluez.GattCharacteristic1")
        self.cached_network_state = None
        self.cached_payload = b""

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":
        return SERVICE_PATH

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return WIFI_STATUS_CHAR_UUID

    @dbus_property(access=PropertyAccess.READ)
    def Flags(self) -> "as":
        return ["read"]

    async def update_cached_value(self) -> None:
        if self.cached_network_state != network_state_counter:
            ssid = ""
            try:
                proc = await asyncio.create_subprocess_exec(
                    "nmcli",
                    "-t",
                    "-f",
                    "active,ssid",
                    "device",
                    "wifi",
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                )
                stdout, _ = await proc.communicate()

                if proc.returncode == 0:
                    lines = stdout.decode().strip().splitlines()
                    ssid = next(
                        (line[4:] for line in lines if line.startswith("yes:")), ""
                    )
            except Exception as e:
                print(f"Error fetching current WiFi SSID: {e}")
            self.cached_network_state = network_state_counter
            self.cached_payload = json.dumps(
                {"ssid": ssid, "st": network_state_counter}
            ).encode("utf-8")

    @method()
    async def ReadValue(self, _options: "a{sv}") -> "ay":
        return self.cached_payload


async def _restart_avahi(device_id: str) -> None:
    """Kill any running avahi-publish and start a fresh one if WiFi is up."""
    global avahi_proc

    # Kill the existing process
    if avahi_proc is not None and avahi_proc.returncode is None:
        try:
            avahi_proc.terminate()
            await avahi_proc.wait()
        except Exception as e:
            print(f"Error stopping avahi-publish: {e}")
    avahi_proc = None

    # Check whether there is an active WiFi connection
    check = await asyncio.create_subprocess_exec(
        "nmcli",
        "-t",
        "-f",
        "active,ssid",
        "device",
        "wifi",
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.DEVNULL,
    )
    stdout, _ = await check.communicate()
    connected = any(
        line.startswith("yes:") for line in stdout.decode().strip().splitlines()
    )

    if not connected:
        print("avahi-publish: no active WiFi — not starting", flush=True)
        return

    hostname = socket.gethostname()
    service_name = f"MORPH-{hostname}"
    txt = f"DEVICE_ID={device_id}" if device_id else ""
    cmd = ["avahi-publish", "-s", service_name, "_morph-ws._tcp", "8765"]
    if txt:
        cmd.append(txt)
    print(f"Starting avahi-publish: {' '.join(cmd)}", flush=True)
    avahi_proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )


async def _apply_wifi(ssid: str, psk: str) -> None:
    """Rescan, delete any existing profile, then connect."""
    # Trigger a fresh scan so nmcli doesn't fail with "No network with SSID found"
    # when its cache is stale (e.g. device just powered on or moved networks).
    print(f"Rescanning WiFi before connecting to '{ssid}'...", flush=True)
    rescan_proc = await asyncio.create_subprocess_exec(
        "nmcli",
        "device",
        "wifi",
        "rescan",
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await rescan_proc.wait()
    # Give the adapter a moment to populate scan results
    await asyncio.sleep(3)

    delete_proc = await asyncio.create_subprocess_exec(
        "nmcli",
        "connection",
        "delete",
        ssid,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
    await delete_proc.wait()
    proc = await asyncio.create_subprocess_exec(
        "nmcli",
        "device",
        "wifi",
        "connect",
        ssid,
        "password",
        psk,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode == 0:
        print(f"Successfully connected to WiFi network '{ssid}'")
    else:
        print(f"Failed to connect to WiFi network '{ssid}': {stderr.decode()}")


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
    async def WriteValue(self, value: "ay", _options: "a{sv}") -> None:
        self.value = bytes(value)
        try:
            payload = json.loads(self.value.decode("utf-8"))
            ssid = payload.get("ssid")
            psk = payload.get("psk")
            if ssid and psk:
                print(f"Received WiFi provisioning data: SSID={ssid}, PSK={psk}")
                asyncio.create_task(_apply_wifi(ssid, psk))
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
            WIFI_STATUS_CHAR_PATH: {
                "org.bluez.GattCharacteristic1": {
                    "Service": Variant("o", SERVICE_PATH),
                    "UUID": Variant("s", WIFI_STATUS_CHAR_UUID),
                    "Flags": Variant("as", ["read"]),
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

    def increment_network_state(self) -> None:
        global network_state_counter
        network_state_counter += 1

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
        payload_bytes = f"ID={self.device_id},ST={network_state_counter}".encode(
            "utf-8"
        )
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
    wifi_status_ch = WifiStatusCharacteristic()

    # Fetch initial wifi state
    print("Fetching initial WiFi state...", flush=True)
    await wifi_status_ch.update_cached_value()
    await _restart_avahi(device_id)

    bus.export(APP_PATH, app)
    bus.export(SERVICE_PATH, svc)
    bus.export(CHAR_PATH, ch)
    bus.export(WIFI_CHAR_PATH, wifi_ch)
    bus.export(ADV_PATH, adv)
    bus.export(WIFI_STATUS_CHAR_PATH, wifi_status_ch)

    adapter_intro = await bus.introspect(BLUEZ_SERVICE, adapter_path)
    adapter_obj = bus.get_proxy_object(BLUEZ_SERVICE, adapter_path, adapter_intro)
    gatt_mgr = adapter_obj.get_interface(GATT_MANAGER_IFACE)
    adv_mgr = adapter_obj.get_interface(LE_ADV_MANAGER_IFACE)

    # Listen for network changes
    nm_intro = await bus.introspect(NM_SERVICE, NM_PATH)
    nm_obj = bus.get_proxy_object(NM_SERVICE, NM_PATH, nm_intro)
    props_iface = nm_obj.get_interface("org.freedesktop.DBus.Properties")

    def on_network_state_changed(
        interface_name: str, changed_properties: dict, invalidated_properties: list
    ) -> None:
        if interface_name == "org.freedesktop.NetworkManager":
            if "State" in changed_properties:
                new_state = changed_properties["State"].value
                print(f"NetworkManager State changed to: {new_state}", flush=True)

                async def sync_network_state():
                    global network_state_counter
                    network_state_counter += 1
                    await wifi_status_ch.update_cached_value()
                    await _restart_avahi(device_id)
                    if "PrimaryConnection" in changed_properties:
                        adv.emit_properties_changed(
                            {"ManufacturerData": adv.ManufacturerData}
                        )

                # 70 = CONNECTED_GLOBAL (IP assigned), 20 = DISCONNECTED, 30 = DISCONNECTING
                if new_state in (70, 20, 30):
                    asyncio.create_task(sync_network_state())

    props_iface.on_properties_changed(on_network_state_changed)

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

    # Stop avahi-publish on shutdown
    if avahi_proc is not None and avahi_proc.returncode is None:
        avahi_proc.terminate()
        await avahi_proc.wait()

    await adv_mgr.call_unregister_advertisement(ADV_PATH)
    await gatt_mgr.call_unregister_application(APP_PATH)
    bus.unexport(ADV_PATH)
    bus.unexport(WIFI_CHAR_PATH)
    bus.unexport(WIFI_STATUS_CHAR_PATH)
    bus.unexport(CHAR_PATH)
    bus.unexport(SERVICE_PATH)
    bus.unexport(APP_PATH)
    bus.disconnect()
    print("Advertising stopped.")


if __name__ == "__main__":
    asyncio.run(main())
