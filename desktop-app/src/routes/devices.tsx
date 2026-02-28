import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";
import { useBluetoothDevices } from "@/utils/useBluetoothDevices";
import { useHostSSID } from "@/utils/useHostSSID";

export const Route = createFileRoute("/devices")({
	component: RouteComponent,
});

function BluetoothDeviceComponent({
	device,
	openWifiDialogue,
}: {
	device: BluetoothDevice;
	openWifiDialogue: () => void;
}) {
	const hostSSID = useHostSSID();

	function ssidToLabel(ssid: string | null) {
		if (ssid === null) return "Loading...";
		if (ssid.length === 0) return "Not connected";
		return ssid;
	}

	return (
		<div className="flex flex-col group rounded-xl border border-[--line] bg-black/20 p-4 transition-colors hover:bg-black/30">
			<div className="flex flex-col">
				<p className="truncate text-base font-semibold">{device.name}</p>
				<p>SSID: {ssidToLabel(device.networkSSID)}</p>
				<p>RSSI: {device.rssi}</p>
			</div>
			<div className="opacity-0 overflow-hidden max-h-0 group-hover:max-h-none transition-all duration-200 group-hover:opacity-100">
				<p>
					Communication with devices is done over wifi protocols. This device is
					nearby, but is either on a different network, or your network blocks
					local peer-to-peer communication. <br /> <br /> To use this device,
					you must establish a bridge through wifi tethering, bluetooth
					tethering, or a mobile hotspot.
				</p>
				<br />
				<p>
					You can connect this device to a wifi network by providing the SSID
					and password here.
				</p>
				<button
					type="button"
					className="rounded-lg border border-[--line] bg-white/8 text-xs font-medium transition-colors hover:bg-white/16 px-3 py-2 text-[--ink-0]"
					onClick={() => {
						openWifiDialogue();
					}}
				>
					Connect to WiFi
				</button>
			</div>
		</div>
	);
}

function ChangeWifiDialogueComponent({ device }: { device: BluetoothDevice }) {
	const [ssid, setSsid] = useState("");
	const [password, setPassword] = useState("");

	return (
		<div className="absolute w-full h-full">
			<p>
				Set WiFi for {device.name} ({device.address})
			</p>
		</div>
	);
}

function RouteComponent() {
	const bluetoothDevices = useBluetoothDevices();

	const [wifiDialogueDevice, setWifiDialogueDevice] =
		useState<BluetoothDevice | null>(null);

	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			{wifiDialogueDevice ? (
				<ChangeWifiDialogueComponent
					device={wifiDialogueDevice as BluetoothDevice}
				/>
			) : null}
			<div className="grid flex-1 auto-rows-min content-start gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
				{bluetoothDevices.map((device) => (
					<BluetoothDeviceComponent
						key={device.deviceId}
						device={device}
						openWifiDialogue={() => setWifiDialogueDevice(device)}
					/>
				))}
			</div>
		</div>
	);
}
