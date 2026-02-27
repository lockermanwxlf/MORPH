import asyncio
from dataclasses import dataclass
import json
import time
from bleak import BleakScanner
from bleak.backends.device import BLEDevice
from bleak.backends.scanner import AdvertisementData

SERVICE_UUID = "a14ddb44-90a8-4b95-a604-66bdafe8a0fa"
DISAPPEAR_TIMEOUT_SECONDS = 8.0
CHECK_INTERVAL_SECONDS = 0.5

seen_devices: dict[str, dict] = {}


def publish_event(event_type: str, payload: dict) -> None:
    print(json.dumps({"event": event_type, **payload}), flush=True)


@dataclass
class ManufacturerData:
    device_id: str | None
    network_state: int | None


def extract_advertisement_info(
    advertisement_data: AdvertisementData,
) -> ManufacturerData:
    if (
        not advertisement_data.manufacturer_data
        or 0xFFFF not in advertisement_data.manufacturer_data
    ):
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
        device_id=data.get("device_id"),
        network_state=int(data["network_state"]) if "network_state" in data else None,
    )


def callback(device: BLEDevice, advertisement_data: AdvertisementData) -> None:
    service_uuids = [u.lower() for u in (advertisement_data.service_uuids or [])]
    if SERVICE_UUID.lower() not in service_uuids:
        return

    now = time.monotonic()
    address = device.address
    manufacturer_data = extract_advertisement_info(advertisement_data)
    device_id = manufacturer_data.device_id
    network_state = manufacturer_data.network_state

    if address not in seen_devices:
        publish_event(
            "add",
            {
                "name": device.name or device.address,
                "address": address,
                "rssi": advertisement_data.rssi,
                "device_id": device_id,
                "network_state": network_state,
            },
        )
    elif (
        seen_devices[address]["rssi"] != advertisement_data.rssi
        or seen_devices[address]["name"] != (device.name or device.address)
        or seen_devices[address]["device_id"] != device_id
        or seen_devices[address].get("network_state") != network_state
    ):
        publish_event(
            "update",
            {
                "name": device.name or device.address,
                "address": address,
                "rssi": advertisement_data.rssi,
                "device_id": device_id,
                "network_state": network_state,
            },
        )

    seen_devices[address] = {
        "name": device.name or device.address,
        "address": address,
        "rssi": advertisement_data.rssi,
        "device_id": device_id,
        "network_state": network_state,
        "last_seen": now,
    }


async def monitor_disappeared_devices() -> None:
    while True:
        now = time.monotonic()
        disappeared = []

        for address, data in seen_devices.items():
            if now - data["last_seen"] > DISAPPEAR_TIMEOUT_SECONDS:
                disappeared.append(address)

        for address in disappeared:
            data = seen_devices.pop(address)
            publish_event(
                "remove",
                {
                    "name": data["name"],
                    "address": data["address"],
                    "rssi": data["rssi"],
                    "device_id": data["device_id"],
                    "network_state": data.get("network_state"),
                },
            )

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


async def main() -> None:
    async with BleakScanner(detection_callback=callback):
        await monitor_disappeared_devices()


if __name__ == "__main__":
    asyncio.run(main())
