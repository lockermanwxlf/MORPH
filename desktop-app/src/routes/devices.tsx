import { createFileRoute } from "@tanstack/react-router";
import { Info } from "lucide-react";
import { useCallback, useId, useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";
import { requireBluetoothAPI } from "@/utils/preload-apis";
import { useBluetoothDevices } from "@/utils/useBluetoothDevices";
import { type MorphDevice, useMorphDevices } from "@/utils/useMorphDevices";
import { usePlatformCapabilities } from "@/utils/usePlatformCapabilites";

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
	const capabilities = usePlatformCapabilities();
	const bluetoothApi = requireBluetoothAPI();

	function ssidToLabel(ssid: string | null) {
		if (ssid === null) return "Loading...";
		if (ssid.length === 0) return "Not connected";
		return ssid;
	}

	function openHotspotSettings() {
		bluetoothApi.openHotspotSettings();
	}

	function openBluetoothSettings() {
		bluetoothApi.openBluetoothSettings();
	}

	return (
		<div className="flex flex-col group rounded-xl border border-(--line) bg-black/20 p-4 transition-colors hover:bg-black/30">
			<div className="flex flex-col">
				<p className="truncate text-base font-semibold">{device.name}</p>
				<p>SSID: {ssidToLabel(device.networkSSID)}</p>
				<p>RSSI: {device.rssi}</p>
			</div>
			<div className="group-hover:mt-4 opacity-0 overflow-hidden max-h-0 group-hover:max-h-none transition-all duration-200 group-hover:opacity-100">
				<button
					type="button"
					className="w-full rounded-lg border border-(--line) bg-white/8 text-xs font-medium transition-colors hover:bg-white/16 px-3 py-2 text-(--ink-0)"
					onClick={() => {
						openWifiDialogue();
					}}
				>
					Change Device WiFi
				</button>
			</div>
			<div className="group-hover:mt-4 opacity-0 overflow-hidden max-h-0 group-hover:max-h-none transition-all duration-200 group-hover:opacity-100">
				<button
					type="button"
					className="w-full rounded-lg border border-(--line) bg-white/8 text-xs font-medium transition-colors hover:bg-white/16 px-3 py-2 text-(--ink-0)"
					onClick={() => {
						openHotspotSettings();
					}}
				>
					Hotspot/Tethering Settings
				</button>
			</div>
			{capabilities.supportsBluetoothTethering && (
				<div className="group-hover:mt-4 opacity-0 overflow-hidden max-h-0 group-hover:max-h-none transition-all duration-200 group-hover:opacity-100">
					<button
						type="button"
						className="w-full rounded-lg border border-(--line) bg-white/8 text-xs font-medium transition-colors hover:bg-white/16 px-3 py-2 text-(--ink-0)"
						onClick={() => {
							openBluetoothSettings();
						}}
					>
						Bluetooth Settings
					</button>
				</div>
			)}
		</div>
	);
}

function WifiDeviceComponent({ device }: { device: MorphDevice }) {
	return (
		<div className="flex flex-col group rounded-xl border border-(--line) bg-black/20 p-4 transition-colors hover:bg-black/30">
			<div className="flex flex-col">
				<p className="truncate text-base font-semibold">{device.deviceId}</p>
				<p>ID: {device.deviceId}</p>
				<p>Address: {device.host}</p>
			</div>
			<div className="group-hover:mt-4 opacity-0 overflow-hidden max-h-0 group-hover:max-h-none transition-all duration-200 group-hover:opacity-100">
				<button
					type="button"
					className="w-full rounded-lg border border-(--line) bg-white/8 text-xs font-medium transition-colors hover:bg-white/16 px-3 py-2 text-(--ink-0)"
					onClick={() => {}}
				>
					Connect to Device
				</button>
			</div>
		</div>
	);
}

function ChangeWifiDialogueComponent({
	device,
	onClose,
}: {
	device: BluetoothDevice;
	onClose: () => void;
}) {
	const bluetoothApi = requireBluetoothAPI();

	const [ssid, setSsid] = useState("");
	const [psk, setPsk] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	const ssidId = useId();
	const pskId = useId();

	async function submit() {
		if (!ssid.trim()) {
			return;
		}
		setIsSubmitting(true);
		try {
			console.log("[devices] submit wifi credentials", {
				address: device.address,
				ssid,
				pskLength: psk.length,
			});
			await bluetoothApi.sendWifiCredentials(device.address, ssid, psk);
			onClose();
		} catch (error) {
			console.error("[devices] failed to send wifi credentials", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="absolute inset-0 bg-black/85 flex items-center justify-center">
			<form
				className="bg-white/8 rounded-lg p-4 shadow-lg"
				onSubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				<p>
					Set WiFi for {device.name} ({device.address})
				</p>

				<div className="mt-4">
					<label
						htmlFor={ssidId}
						className="block text-sm/6 font-medium text-white"
					>
						SSID
					</label>
					<div className="mt-2">
						<div className="flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-white/10 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-500">
							<input
								id={ssidId}
								type="text"
								name="ssid"
								value={ssid}
								onChange={(event) => setSsid(event.target.value)}
								placeholder="ssid"
								className="block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6"
							/>
						</div>
					</div>
				</div>

				<div className="mt-4">
					<label
						htmlFor={pskId}
						className="block text-sm/6 font-medium text-white"
					>
						Password
					</label>
					<div className="mt-2">
						<div className="flex items-center rounded-md bg-white/5 pl-3 outline-1 -outline-offset-1 outline-white/10 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-500">
							<input
								id={pskId}
								type="password"
								name="psk"
								value={psk}
								onChange={(event) => setPsk(event.target.value)}
								placeholder="password"
								className="block min-w-0 grow bg-transparent py-1.5 pr-3 pl-1 text-base text-white placeholder:text-gray-500 focus:outline-none sm:text-sm/6"
							/>
						</div>
					</div>
				</div>

				<button
					type="submit"
					disabled={isSubmitting || !ssid.trim()}
					className="w-full rounded-lg bg-green-500/80 mt-4 py-1 font-medium transition-colors hover:bg-green-500 border border-(--line) disabled:opacity-50 disabled:cursor-not-allowed"
				>
					{isSubmitting ? "Connecting..." : "Connect"}
				</button>
				<button
					type="button"
					className="mt-2 rounded-lg border border-(--line) bg-white/8 text-xs font-medium transition-colors hover:bg-white/16 px-3 py-2 text-(--ink-0)"
					onClick={onClose}
				>
					Close
				</button>
			</form>
		</div>
	);
}

function RouteComponent() {
	const bluetoothDevices = useBluetoothDevices();
	const [wifiDialogueDevice, setWifiDialogueDevice] =
		useState<BluetoothDevice | null>(null);
	const closeWifiDialogue = useCallback(() => setWifiDialogueDevice(null), []);
	const { devices: morphDevices } = useMorphDevices();

	return (
		<div className="flex flex-col w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			{wifiDialogueDevice ? (
				<ChangeWifiDialogueComponent
					device={wifiDialogueDevice as BluetoothDevice}
					onClose={closeWifiDialogue}
				/>
			) : null}
			<p className="text-lg font-semibold">Accessible Devices</p>
			<div className="grid flex-1 bg-black/50 p-5 auto-rows-min content-start gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
				{bluetoothDevices.length === 0 ? (
					<p className="text-center text-sm opacity-50">No devices found</p>
				) : (
					morphDevices.map((device) => (
						<WifiDeviceComponent key={device.deviceId} device={device} />
					))
				)}
			</div>
			<br />
			<div className="text-lg font-semibold flex items-center gap-2">
				<p>Inaccessible Devices</p>
				<div className="group relative">
					<Info className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
					<span className="absolute w-120 -translate-y-full bg-black/80 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
						These devices are nearby, but are not accessible through this
						computer's wifi network. They may be on a different network, or your
						network may block local device communication. <br />
						<br />
						First, ensure the device is on the same wifi as you. If your network
						is blocking local communication, you can connect both devices to a
						mobile hotspot, or you can enable bluetooth tethering and connect to
						the device over bluetooth, or you can start a mobile hotspot on this
						computer and connect the device to it. <br />
						<br /> Hover over a device for more information.
					</span>
				</div>
			</div>
			<div className="grid flex-1 bg-black/30 border border-white/8 rounded-xl auto-rows-min gap-4 sm:grid-cols-2 lg:grid-cols-3 p-3 overflow-auto content-start">
				{bluetoothDevices.length === 0 ? (
					<p className="text-center text-sm opacity-50">No devices found</p>
				) : (
					bluetoothDevices.map((device) => (
						<BluetoothDeviceComponent
							key={device.deviceId}
							device={device}
							openWifiDialogue={() => setWifiDialogueDevice(device)}
						/>
					))
				)}
			</div>
		</div>
	);
}
