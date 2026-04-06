import asyncio
import json
from tkinter import S

from dbus_fast import PropertyAccess
from dbus_fast.service import ServiceInterface, dbus_property, method

from gatt.config import NETWORK_CREDENTIALS_CHAR_UUID, SERVICE_PATH


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


class NetworkCredentialsCharacteristic(ServiceInterface):
    def __init__(self):
        super().__init__("org.bluez.GattCharacteristic1")
        self.value = b""

    @dbus_property(access=PropertyAccess.READ)
    def Service(self) -> "o":
        return SERVICE_PATH

    @dbus_property(access=PropertyAccess.READ)
    def UUID(self) -> "s":
        return NETWORK_CREDENTIALS_CHAR_UUID

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
