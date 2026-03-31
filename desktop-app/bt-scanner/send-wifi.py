import asyncio
import json
import argparse
from bleak import BleakClient

WIFI_CHAR_UUID = "eaf9ab55-aea7-4b8a-98b1-5b9b139f41e3"


def ipc_out(out: str):
    print(out, flush=True)


async def provide_wifi_credentials(target_device: str, ssid: str, psk: str) -> None:
    # The hotspot details you want the Debian board to connect to
    wifi_payload = {"ssid": ssid, "psk": psk}

    payload_bytes = json.dumps(wifi_payload).encode("utf-8")

    ipc_out(json.dumps({"event": "connecting"}))

    async with BleakClient(target_device) as client:
        if client.is_connected:
            ipc_out(json.dumps({"event": "sending"}))
            await client.write_gatt_char(WIFI_CHAR_UUID, payload_bytes, response=True)
            ipc_out(json.dumps({"event": "success"}))
        else:
            ipc_out(json.dumps({"event": "failed"}))


def main():
    parser = argparse.ArgumentParser(
        description="Send WiFi credentials to a device via Bluetooth LE"
    )
    parser.add_argument(
        "device",
        help="The Bluetooth device address (MAC address on Windows/Linux, CoreBluetooth UUID on macOS)",
    )
    parser.add_argument("ssid", help="WiFi network SSID")
    parser.add_argument("psk", help="WiFi network password")

    args = parser.parse_args()
    asyncio.run(provide_wifi_credentials(args.device, args.ssid, args.psk))


if __name__ == "__main__":
    main()
