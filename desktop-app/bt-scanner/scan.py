import asyncio
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


def extract_device_id(advertisement_data: AdvertisementData) -> str | None:
    service_data = advertisement_data.service_data or {}
    for uuid, value in service_data.items():
        if uuid.lower() != SERVICE_UUID.lower():
            continue

        try:
            decoded = bytes(value).decode("utf-8", errors="ignore")
        except Exception:
            return None

        if decoded.startswith("DEVICE_ID="):
            device_id = decoded.split("=", 1)[1].strip()
            return device_id or None

        return None

    return None


def callback(device: BLEDevice, advertisement_data: AdvertisementData) -> None:
    service_uuids = [u.lower() for u in (advertisement_data.service_uuids or [])]
    if SERVICE_UUID.lower() not in service_uuids:
        return

    now = time.monotonic()
    address = device.address
    device_id = extract_device_id(advertisement_data)

    if address not in seen_devices:
        publish_event(
            "add",
            {
                "name": device.name or device.address,
                "address": address,
                "rssi": advertisement_data.rssi,
                "device_id": device_id,
            },
        )
    elif (
        seen_devices[address]["rssi"] != advertisement_data.rssi
        or seen_devices[address]["name"] != (device.name or device.address)
        or seen_devices[address]["device_id"] != device_id
    ):
        publish_event(
            "update",
            {
                "name": device.name or device.address,
                "address": address,
                "rssi": advertisement_data.rssi,
                "device_id": device_id,
            },
        )

    seen_devices[address] = {
        "name": device.name or device.address,
        "address": address,
        "rssi": advertisement_data.rssi,
        "device_id": device_id,
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
                },
            )

        await asyncio.sleep(CHECK_INTERVAL_SECONDS)


async def main() -> None:
    async with BleakScanner(detection_callback=callback):
        await monitor_disappeared_devices()


if __name__ == "__main__":
    asyncio.run(main())
