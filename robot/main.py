import asyncio
from pathlib import Path
import signal
import socket
from typing import Any

from dbus_fast import BusType
from dbus_fast.aio import MessageBus

from avahi import restart_avahi
from gatt.advertisement import Advertisement
from gatt.characteristics.network_credentials import NetworkCredentialsCharacteristic
from gatt.characteristics.network_state import NetworkStateCharacteristic
from gatt.config import APP_PATH, DEVICE_ID_PATH, NETWORK_STATE_CHAR_UUID, SERVICE_PATH
from gatt.constants import (
    BLUEZ_SERVICE,
    GATT_MANAGER_IFACE,
    LE_ADV_MANAGER_IFACE,
    NM_IFACE,
    NM_PATH,
    NM_SERVICE,
    OBJ_MANAGER_IFACE,
)
from gatt.service import Service


async def find_adapter_path(bus: MessageBus) -> str:
    intro = await bus.introspect(BLUEZ_SERVICE, "/")
    obj = bus.get_proxy_object(BLUEZ_SERVICE, "/", intro)
    manager = obj.get_interface(OBJ_MANAGER_IFACE)
    managed: dict[str, dict[str, Any]] = await manager.call_get_managed_objects()
    for path, ifaces in managed.items():
        if GATT_MANAGER_IFACE in ifaces and LE_ADV_MANAGER_IFACE in ifaces:
            return path
    raise RuntimeError("No BLE adapter with GATT + LE advertising manager found")


async def get_ssid():
    try:
        proc = await asyncio.create_subprocess_exec(
            "sudo",
            "iw",
            "dev",
            "wlan0",
            "link",
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )

        stdout, _ = await proc.communicate()
        output = stdout.decode()
        ssid = next(
            (
                s.split("SSID:", 1)[1].strip()
                for s in output.splitlines()
                if "SSID:" in s
            ),
            "",
        )
        return ssid
    except Exception as e:
        print("ERROR [get_ssid]:", e)


async def get_private_ip():
    with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
        try:
            s.connect(("10.255.255.255", 1))
            return s.getsockname()[0]
        except Exception:
            pass

    proc = await asyncio.create_subprocess_shell(
        "hostname -I | awk '{print $1}'",
        stdin=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE,
    )

    try:
        out, err = await proc.communicate()
        if proc.returncode == 0:
            return out.decode().strip()
        else:
            print("ERROR [get_private_ip]:", err.decode())
            return None

    except asyncio.CancelledError:
        proc.terminate()
        await proc.wait()
        raise


class NetworkStateUpdater:
    def __init__(
        self,
        bus: MessageBus,
        advertisement: Advertisement,
        net_state_char: NetworkStateCharacteristic,
        device_id: str,
    ):
        self.bus = bus
        self.advertisement = advertisement
        self.net_state_char = net_state_char
        self.network_state_counter = -1
        self.device_id = device_id

    def on_properties_changed(
        self, ifname: str, changed_props: dict, invalid_props: dict
    ):
        if ifname != NM_IFACE or "State" not in changed_props:
            return

        new_state = changed_props["State"].value
        # 70 = CONNECTED_GLOBAL (IP assigned), 20 = DISCONNECTED, 30 = DISCONNECTING
        if new_state in (70, 20, 30):
            asyncio.create_task(self.on_network_state_changed())

    async def on_network_state_changed(self):
        self.network_state_counter += 1
        ssid = await get_ssid()
        host = await get_private_ip()
        await restart_avahi(self.device_id)
        print(f"{ssid} - {host}")
        self.net_state_char.set_payload(ssid, host, self.network_state_counter)
        self.advertisement.set_network_state(self.network_state_counter)
        self.advertisement.emit_properties_changed(
            {"ManufacturerData": self.advertisement.ManufacturerData}
        )

    async def __aenter__(self):
        nm_intro = await self.bus.introspect(NM_SERVICE, NM_PATH)
        nm_obj = self.bus.get_proxy_object(NM_SERVICE, NM_PATH, nm_intro)
        props_iface = nm_obj.get_interface("org.freedesktop.DBus.Properties")
        props_iface.on_properties_changed(self.on_properties_changed)
        return self

    async def __aexit__(self, exc_type, exc, tb):
        pass


def read_device_id() -> str:
    try:
        return Path(DEVICE_ID_PATH).read_text(encoding="utf-8").strip()
    except OSError:
        return ""


async def main():
    bus = await MessageBus(bus_type=BusType.SYSTEM).connect()
    adapter_path = await find_adapter_path(bus)
    device_id = read_device_id()
    print("Using adapter", adapter_path)

    service = Service()
    advertisement = Advertisement("MORPH")
    net_creds_char = NetworkCredentialsCharacteristic()
    net_state_char = NetworkStateCharacteristic(SERVICE_PATH, NETWORK_STATE_CHAR_UUID)
    chars = [net_creds_char, net_state_char]

    async with NetworkStateUpdater(
        bus, advertisement, net_state_char, device_id
    ) as network_listener:
        await network_listener.on_network_state_changed()

        bus.export(SERVICE_PATH, service)
        ADV_PATH = f"{APP_PATH}/advertisement0"
        bus.export(ADV_PATH, advertisement)
        for i, char in enumerate(chars):
            bus.export(f"{SERVICE_PATH}/char{i}", char)

        adapter_intro = await bus.introspect(BLUEZ_SERVICE, adapter_path)
        adapter_obj = bus.get_proxy_object(BLUEZ_SERVICE, adapter_path, adapter_intro)
        gatt_mgr = adapter_obj.get_interface(GATT_MANAGER_IFACE)
        adv_mgr = adapter_obj.get_interface(LE_ADV_MANAGER_IFACE)

        await gatt_mgr.call_register_application(APP_PATH, {})
        await adv_mgr.call_register_advertisement(ADV_PATH, {})

        print("Registered")

        stop_event = asyncio.Event()
        loop = asyncio.get_running_loop()
        loop.add_signal_handler(signal.SIGINT, stop_event.set)
        loop.add_signal_handler(signal.SIGTERM, stop_event.set)
        await stop_event.wait()

        await adv_mgr.call_unregister_advertisement(ADV_PATH)
        await gatt_mgr.call_unregister_application(APP_PATH)
        bus.unexport(SERVICE_PATH)
        bus.unexport(ADV_PATH)
        for i in range(len(chars)):
            bus.unexport(f"{SERVICE_PATH}/char{i}")
        bus.disconnect()

        print("Advertising stopped.")


if __name__ == "__main__":
    asyncio.run(main())
