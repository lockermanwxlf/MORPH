import asyncio
import concurrent.futures
from dataclasses import dataclass
import json
from operator import add
import os
from re import S
import time
from typing import Literal

from bleak import BleakClient, BleakScanner
from bleak.backends.device import BLEDevice
from bleak.backends.scanner import AdvertisementData
import concurrent

DEBUG = os.environ.get("DEBUG", "0") != "0"

DEVICE_STALE_TIMEOUT = 16.0
DEVICE_REMOVAL_TIMEOUT = 1200.0
DEVICE_CHECK_INTERVAL = 1


@dataclass
class BluetoothDevice:
    address: str
    name: str
    rssi: int
    device_id: str
    network_ssid: str | None
    network_state: int
    active: bool


def publish(event: Literal["updated", "removed"], device: BluetoothDevice) -> None:
    print(
        json.dumps(
            {
                "event": event,
                "name": device.name,
                "address": device.address,
                "rssi": device.rssi,
                "deviceId": device.device_id,
                "networkSSID": device.network_ssid,
            }
        ),
        flush=True,
    )


def log_debug(msg: str) -> None:
    if DEBUG:
        print(msg, flush=True)


@dataclass
class ManufacturerData:
    device_id: str | None
    network_state: int | None


def get_manufacturer_data(advertisement_data: AdvertisementData) -> ManufacturerData:
    if (
        not advertisement_data.manufacturer_data
        or 0xFFFF not in advertisement_data.manufacturer_data
    ):
        log_debug("No manufacturer data found")
        return ManufacturerData(device_id=None, network_state=None)

    data = advertisement_data.manufacturer_data[0xFFFF]
    data = bytes(data).decode("utf-8")
    data = {
        key.strip(): value.strip()
        for (key, value) in [
            part.split("=", 1) for part in data.split(",") if "=" in part
        ]
    }
    return ManufacturerData(
        device_id=data.get("ID"),
        network_state=int(data["ST"]) if "ST" in data else None,
    )


devices: dict[str, BluetoothDevice] = {}
devices_last_seen: dict[str, float] = {}
ssid_tasks: dict[str, concurrent.futures._base.Future[None]] = {}


async def fetch_ssid_for_device(address: str) -> None:
    log_debug(f"Fetching SSID for device {address}")
    async with BleakClient(address) as client:
        try:
            wifi_status = await client.read_gatt_char(
                "a2169d6e-07aa-457e-8139-19803dbd6bfd"
            )
            wifi_status = bytes(wifi_status).decode("utf-8")
            wifi_status = json.loads(wifi_status)
            log_debug(wifi_status)
            ssid = wifi_status.get("ssid")
        except Exception as e:
            log_debug(f"Error fetching SSID for device {address}: {e}")
            ssid = None
    devices[address].network_ssid = ssid

    if (
        address not in devices_last_seen
        or time.monotonic() - devices_last_seen[address] < DEVICE_REMOVAL_TIMEOUT
    ):
        publish("updated", devices[address])


def advertisement_callback(
    ble_device: BLEDevice, advertisement_data: AdvertisementData
) -> None:
    devices_last_seen[ble_device.address] = time.monotonic()
    manufacturer_data = get_manufacturer_data(advertisement_data)
    device = devices.get(ble_device.address)
    if not device or device.network_state != manufacturer_data.network_state:
        if (
            ble_device.address not in ssid_tasks
            or ssid_tasks[ble_device.address].done()
        ):
            loop = asyncio.get_event_loop()
            ssid_tasks[ble_device.address] = asyncio.run_coroutine_threadsafe(
                fetch_ssid_for_device(ble_device.address), loop
            )

    devices[ble_device.address] = BluetoothDevice(
        address=ble_device.address,
        name=ble_device.name or "Unknown",
        rssi=advertisement_data.rssi,
        device_id=manufacturer_data.device_id or "",
        network_ssid=device.network_ssid if device else None,
        network_state=manufacturer_data.network_state or 0,
        active=True,
    )
    publish("updated", devices[ble_device.address])


def remove_stale_devices() -> None:
    now = time.monotonic()
    for address in list(devices.keys()):
        elapsed = now - devices_last_seen[address]
        if elapsed > DEVICE_STALE_TIMEOUT:
            if devices[address].active:
                devices[address].active = False
                publish("removed", devices[address])
        if elapsed > DEVICE_REMOVAL_TIMEOUT:
            del devices[address]
            del devices_last_seen[address]
            if address in ssid_tasks:
                ssid_tasks[address].cancel()
                del ssid_tasks[address]


async def main():
    async with BleakScanner(
        #        service_uuids=["a14ddb44-90a8-4b95-a604-66bdafe8a0fa"],
        service_uuids=["0000fe99-0000-1000-8000-00805f9b34fb"],
        detection_callback=advertisement_callback,
    ) as scanner:
        while True:
            await asyncio.sleep(DEVICE_CHECK_INTERVAL)
            remove_stale_devices()


if __name__ == "__main__":
    asyncio.run(main())
