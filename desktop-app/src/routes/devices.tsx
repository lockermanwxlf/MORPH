import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useConnectedDevice } from "@/utils/connected-device";
import { requireBluetoothAPI } from "@/utils/preload-apis";
import { useBluetoothDevices } from "@/utils/useBluetoothDevices";
import { useMorphDevices } from "@/utils/useMorphDevices";

export const Route = createFileRoute("/devices")({
	component: RouteComponent,
});

type UnifiedDevice =
	| {
			source: "wifi";
			deviceId: string;
			title: string;
			subtitle: string;
			detail: string;
	  }
	| {
			source: "bluetooth";
			deviceId: string;
			address: string;
			title: string;
			subtitle: string;
			detail: string;
	  };

function RouteComponent() {
	const bluetoothDevices = useBluetoothDevices();
	const { devices: robots, isLoading: isRobotsLoading } = useMorphDevices();
	const {
		connectToDevice,
		connectedDeviceId,
		isConnecting,
		error: connectError,
	} = useConnectedDevice();
	const unifiedDevices = useMemo<UnifiedDevice[]>(() => {
		const robotByDeviceId = new Set(
			robots.map((robot) => robot.deviceId).filter(Boolean),
		);

		const wifiDevices: UnifiedDevice[] = robots.map((robot) => ({
			source: "wifi",
			deviceId: robot.deviceId,
			title: robot.host,
			subtitle: `Device ID: ${robot.deviceId || "N/A"}`,
			detail: `Port: ${robot.port}`,
		}));

		const bluetoothOnly: UnifiedDevice[] = bluetoothDevices
			.filter((device) => !robotByDeviceId.has(device.deviceId))
			.map((device) => ({
				source: "bluetooth",
				deviceId: device.deviceId,
				address: device.address,
				title: device.name || "Unnamed Device",
				subtitle: `Device ID: ${device.deviceId || "N/A"}`,
				detail: `${device.address} • RSSI: ${device.rssi ?? "N/A"}`,
			}));

		return [...wifiDevices, ...bluetoothOnly];
	}, [bluetoothDevices, robots]);
	const bluetoothAPI = requireBluetoothAPI();

	const handleOpenHotspotSettings = async () => {
		const result = await bluetoothAPI.openHotspotSettings();
		if (!result.opened) {
			console.error(result.detail ?? "Unable to open hotspot settings.");
		}
	};

	const handleOpenBluetoothSettings = async () => {
		const result = await bluetoothAPI.openBluetoothSettings();
		if (!result.opened) {
			console.error(result.detail ?? "Unable to open Bluetooth settings.");
		}
	};

	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(2,8,18,0.35)] backdrop-blur-md">
				<div className="mb-6 flex items-center justify-between">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">Devices</h1>
						<p className="mt-1 text-sm text-[var(--ink-1)]">
							Merged robots and Bluetooth devices
						</p>
					</div>
					<div className="rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 text-xs font-medium text-[var(--ink-1)]">
						{unifiedDevices.length} total
					</div>
				</div>

				{isRobotsLoading ? (
					<div className="rounded-xl border border-dashed border-[var(--line)] bg-black/20 px-4 py-8 text-center text-sm text-[var(--ink-1)]">
						Loading devices...
					</div>
				) : unifiedDevices.length === 0 ? (
					<div className="rounded-xl border border-dashed border-[var(--line)] bg-black/20 px-4 py-8 text-center text-sm text-[var(--ink-1)]">
						No devices detected
					</div>
				) : (
					<ul className="grid flex-1 auto-rows-min content-start gap-4 overflow-auto sm:grid-cols-2 lg:grid-cols-3">
						{unifiedDevices.map((device) => (
							<li
								key={`${device.source}:${device.deviceId}:${device.title}`}
								className="group rounded-xl border border-[var(--line)] bg-black/20 p-4 transition-colors hover:bg-black/30"
							>
								<div className="flex items-start justify-between gap-3">
									<div className="min-w-0">
										<p className="truncate text-base font-semibold">
											{device.title}
										</p>
										<p className="mt-1 truncate text-xs text-[var(--ink-1)]">
											{device.subtitle}
										</p>
										<p className="mt-1 truncate text-xs text-[var(--ink-1)]">
											{device.detail}
										</p>
									</div>
									<span
										className={`rounded-full border border-[var(--line)] px-2 py-1 text-[11px] font-medium ${
											device.source === "wifi"
												? "bg-[rgba(67,166,255,0.15)] text-[#7ec3ff]"
												: "bg-[rgba(36,199,184,0.12)] text-[var(--brand)]"
										}`}
									>
										{device.source === "wifi" ? "WiFi" : "Bluetooth"}
									</span>
								</div>
								{device.source === "bluetooth" ? (
									<div className="mt-0 max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:mt-4 group-hover:max-h-48 group-hover:opacity-100">
										<p className="text-xs text-[var(--ink-1)]">
											To connect to this device, enable bluetooth tethering and
											pair with this device using your system's bluetooth
											settings. <br />
											<br /> This will open a communication bridge between your
											system and the morph device.
										</p>
										<div className="mt-3 flex flex-wrap gap-2">
											<button
												type="button"
												onClick={() => {
													void handleOpenHotspotSettings();
												}}
												className="rounded-lg border border-[var(--line)] bg-white/8 px-3 py-2 text-xs font-medium text-[var(--ink-0)] transition-colors hover:bg-white/16"
											>
												Hotspot Settings
											</button>
											<button
												type="button"
												onClick={() => {
													void handleOpenBluetoothSettings();
												}}
												className="rounded-lg border border-[var(--line)] bg-[rgba(36,199,184,0.12)] px-3 py-2 text-xs font-medium text-[var(--ink-0)] transition-colors hover:bg-[rgba(36,199,184,0.2)]"
											>
												Bluetooth Settings
											</button>
										</div>
									</div>
								) : (
									<div className="mt-0 max-h-0 overflow-hidden opacity-0 transition-all duration-200 group-hover:mt-4 group-hover:max-h-24 group-hover:opacity-100">
										<button
											type="button"
											disabled={isConnecting}
											onClick={() => {
												void connectToDevice(device.deviceId);
											}}
											className="rounded-lg border border-[var(--line)] bg-[rgba(67,166,255,0.15)] px-3 py-2 text-xs font-medium text-[var(--ink-0)] transition-colors hover:bg-[rgba(67,166,255,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
										>
											{isConnecting
												? "Connecting..."
												: connectedDeviceId === device.deviceId
													? "Connected"
													: "Connect"}
										</button>
									</div>
								)}
							</li>
						))}
					</ul>
				)}
				{connectError ? (
					<p className="mt-4 text-sm text-[#ffb7a4]">{connectError}</p>
				) : null}
			</section>
		</div>
	);
}
