import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Bluetooth, Info, Network, Wifi } from "lucide-react";
import { useCallback, useId, useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";
import { useConnectedDevice } from "@/utils/ConnectedDeviceContext";
import { requireBluetoothAPI } from "@/utils/preload-apis";
import { useBluetoothDevices } from "@/utils/useBluetoothDevices";
import { useMorphDevices } from "@/utils/useMorphDevices";

export const Route = createFileRoute("/setup2")({
	component: SetupNextPage,
});

function SetupNextPage() {
	const navigate = useNavigate();
	const bluetoothDevices = useBluetoothDevices();
	const { devices: morphDevices } = useMorphDevices();
	const { connectedDevice, connect } = useConnectedDevice();
	const [wifiDialogueDevice, setWifiDialogueDevice] =
		useState<BluetoothDevice | null>(null);
	const closeWifiDialogue = useCallback(() => setWifiDialogueDevice(null), []);

	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			{wifiDialogueDevice ? (
				<ChangeWifiDialogueComponent
					device={wifiDialogueDevice}
					onClose={closeWifiDialogue}
				/>
			) : null}

			<section className="relative flex w-full flex-1 flex-col gap-5 overflow-hidden rounded-2xl border border-(--line) bg-(--surface) p-4 shadow-[0_18px_40px_var(--shadow-0)] sm:p-5">
				<header className="flex flex-wrap items-center justify-between gap-3">
					<div>
						<p className="text-sm uppercase tracking-[0.24em] text-white/60">
							Setup Step 2
						</p>
						<h1 className="mt-2 text-2xl font-semibold tracking-tight text-(--ink-0)">
							Connect Your Robot
						</h1>
						<p className="mt-1 text-sm text-(--ink-1)">
							Choose a MORPH device on your network or update a nearby device's
							WiFi over Bluetooth.
						</p>
					</div>
					<div className="inline-flex items-center gap-2 rounded-full border border-(--line) bg-white/5 px-3 py-1.5 text-xs text-(--ink-1)">
						<Network className="h-3.5 w-3.5" />
						{morphDevices.length} accessible
						<span className="opacity-50">|</span>
						{bluetoothDevices.length} nearby
					</div>
				</header>

				<section className="min-h-0 flex-1 space-y-4 overflow-auto pb-16">
					<div className="space-y-2">
						<div className="flex items-center justify-between">
							<p className="text-lg font-semibold text-(--ink-0)">
								Accessible MORPH Devices
							</p>
							<span className="text-xs text-(--ink-1)">
								{morphDevices.length} found
							</span>
						</div>
						<div className="grid auto-rows-min content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{morphDevices.length === 0 ? (
								<div className="rounded-xl border border-dashed border-(--line) bg-white/5 px-4 py-6 text-center text-sm text-(--ink-1)">
									No accessible devices found.
								</div>
							) : (
								morphDevices.map((device) => (
									<article
										key={device.deviceId}
										className="group rounded-2xl border border-(--line) bg-(--surface) p-4 shadow-[0_14px_30px_var(--shadow-0)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_var(--shadow-0)]"
									>
										<div className="mb-3 flex items-start justify-between gap-3">
											<div className="min-w-0">
												<p className="truncate text-base font-semibold text-(--ink-0)">
													{device.deviceId}
												</p>
												<p className="truncate text-xs text-(--ink-1)">
													Host: {device.host}
												</p>
											</div>
											<span className="inline-flex items-center gap-1 rounded-full border border-(--line) bg-white/5 px-2 py-1 text-[11px] text-(--ink-1)">
												<Wifi className="h-3.5 w-3.5" />
												WiFi
											</span>
										</div>

										<div className="space-y-1.5 text-sm text-(--ink-1)">
											<p>
												<span className="font-medium text-(--ink-0)">Device ID:</span>{" "}
												{device.deviceId}
											</p>
											<p>
												<span className="font-medium text-(--ink-0)">Address:</span>{" "}
												{device.host}
											</p>
										</div>

										<div className="mt-4">
											<button
												type="button"
												className="w-full rounded-xl border border-(--line) bg-(--brand-soft) px-3 py-2 text-xs font-semibold text-(--ink-0) transition-colors hover:brightness-105"
												onClick={() => {
													connect(device);
												}}
											>
												Connect to Device
											</button>
										</div>
									</article>
								))
							)}
						</div>
					</div>

					<div className="space-y-2">
						<div className="flex items-center justify-between gap-2">
							<div className="flex items-center gap-2">
								<p className="text-lg font-semibold text-(--ink-0)">
									Nearby Bluetooth Devices
								</p>
								<Info className="h-4 w-4 text-(--ink-1)" />
							</div>
							<span className="text-xs text-(--ink-1)">
								{bluetoothDevices.length} found
							</span>
						</div>
						<p className="rounded-xl border border-(--line) bg-white/5 px-3 py-2 text-xs leading-relaxed text-(--ink-1)">
							Nearby devices are discoverable over Bluetooth but may be on a
							different WiFi network. Use "Change Device WiFi" to move them onto
							your current network.
						</p>
						<div className="grid auto-rows-min content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
							{bluetoothDevices.length === 0 ? (
								<div className="rounded-xl border border-dashed border-(--line) bg-white/5 px-4 py-6 text-center text-sm text-(--ink-1)">
									No nearby devices found.
								</div>
							) : (
								bluetoothDevices.map((device) => (
									<BluetoothDeviceCard
										key={device.deviceId}
										device={device}
										openWifiDialogue={() => setWifiDialogueDevice(device)}
									/>
								))
							)}
						</div>
					</div>
				</section>

				<div className="pointer-events-none absolute inset-x-4 bottom-4 flex items-end justify-end gap-2 sm:inset-x-5 sm:bottom-5">
					<button
						type="button"
						className="pointer-events-auto rounded-xl border border-(--line) bg-white/8 px-4 py-2 text-sm font-medium text-(--ink-0) transition-colors hover:bg-white/15"
						onClick={() => {
							navigate({ to: "/lessons" });
						}}
					>
						Skip
					</button>
					<button
						type="button"
						className={`pointer-events-auto rounded-xl border border-(--line) bg-(--brand-soft) px-4 py-2 text-sm font-semibold text-(--ink-0) shadow-[0_8px_22px_var(--shadow-0)] transition-all duration-300 ${
							connectedDevice
								? "translate-y-0 opacity-100"
								: "pointer-events-none translate-y-2 opacity-0"
						}`}
						onClick={() => {
							navigate({ to: "/lessons" });
						}}
					>
						Continue
					</button>
				</div>
			</section>
		</div>
	);
}

function ssidToLabel(ssid: string | null) {
	if (ssid === null) return "Loading...";
	if (ssid.length === 0) return "Not connected";
	return ssid;
}

function BluetoothDeviceCard({
	device,
	openWifiDialogue,
}: {
	device: BluetoothDevice;
	openWifiDialogue: () => void;
}) {
	const bluetoothApi = requireBluetoothAPI();

	function openHotspotSettings() {
		bluetoothApi.openHotspotSettings();
	}

	return (
		<article className="group rounded-2xl border border-(--line) bg-(--surface) p-4 shadow-[0_14px_30px_var(--shadow-0)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_var(--shadow-0)]">
			<div className="mb-3 flex items-start justify-between gap-3">
				<div className="min-w-0">
					<p className="truncate text-base font-semibold text-(--ink-0)">
						{device.name}
					</p>
					<p className="truncate text-xs text-(--ink-1)">{device.address}</p>
				</div>
				<span className="inline-flex items-center gap-1 rounded-full border border-(--line) bg-white/5 px-2 py-1 text-[11px] text-(--ink-1)">
					<Bluetooth className="h-3.5 w-3.5" />
					Bluetooth
				</span>
			</div>

			<div className="space-y-1.5 text-sm text-(--ink-1)">
				<p>
					<span className="font-medium text-(--ink-0)">SSID:</span>{" "}
					{ssidToLabel(device.networkSSID)}
				</p>
				<p>
					<span className="font-medium text-(--ink-0)">RSSI:</span> {device.rssi}
				</p>
			</div>

			<div className="mt-4 grid gap-2 opacity-90 transition-opacity group-hover:opacity-100">
				<button
					type="button"
					className="w-full rounded-xl border border-(--line) bg-(--brand-soft) px-3 py-2 text-xs font-semibold text-(--ink-0) transition-colors hover:brightness-105"
					onClick={() => {
						openWifiDialogue();
					}}
				>
					Change Device WiFi
				</button>
				<button
					type="button"
					className="w-full rounded-xl border border-(--line) bg-white/5 px-3 py-2 text-xs font-medium text-(--ink-0) transition-colors hover:bg-white/10"
					onClick={() => {
						openHotspotSettings();
					}}
				>
					Hotspot/Tethering Settings
				</button>
			</div>
		</article>
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
			await bluetoothApi.sendWifiCredentials(device.address, ssid, psk);
			onClose();
		} catch (error) {
			console.error("[setup2] failed to send wifi credentials", error);
		} finally {
			setIsSubmitting(false);
		}
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
			<form
				className="w-full max-w-md rounded-2xl border border-(--line) bg-(--surface-strong) p-5 shadow-[0_18px_40px_var(--shadow-0)]"
				onSubmit={(event) => {
					event.preventDefault();
					void submit();
				}}
			>
				<p className="text-base font-semibold text-(--ink-0)">
					Set WiFi for {device.name}
				</p>
				<p className="mt-1 text-xs text-(--ink-1)">{device.address}</p>

				<div className="mt-4">
					<label
						htmlFor={ssidId}
						className="block text-sm/6 font-medium text-(--ink-0)"
					>
						SSID
					</label>
					<div className="mt-2">
						<div className="flex items-center rounded-xl border border-(--line) bg-white/5 pl-3 outline-none focus-within:ring-2 focus-within:ring-(--focus-ring)">
							<input
								id={ssidId}
								type="text"
								name="ssid"
								value={ssid}
								onChange={(event) => setSsid(event.target.value)}
								placeholder="ssid"
								className="block min-w-0 grow bg-transparent py-2 pr-3 pl-1 text-sm text-(--ink-0) placeholder:text-(--ink-1) focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<div className="mt-4">
					<label
						htmlFor={pskId}
						className="block text-sm/6 font-medium text-(--ink-0)"
					>
						Password
					</label>
					<div className="mt-2">
						<div className="flex items-center rounded-xl border border-(--line) bg-white/5 pl-3 outline-none focus-within:ring-2 focus-within:ring-(--focus-ring)">
							<input
								id={pskId}
								type="password"
								name="psk"
								value={psk}
								onChange={(event) => setPsk(event.target.value)}
								placeholder="password"
								className="block min-w-0 grow bg-transparent py-2 pr-3 pl-1 text-sm text-(--ink-0) placeholder:text-(--ink-1) focus:outline-none"
							/>
						</div>
					</div>
				</div>

				<div className="mt-5 grid grid-cols-2 gap-2">
					<button
						type="submit"
						disabled={isSubmitting || !ssid.trim()}
						className="w-full rounded-xl border border-(--line) bg-(--brand-soft) px-3 py-2 text-sm font-semibold text-(--ink-0) transition-colors hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
					>
						{isSubmitting ? "Connecting..." : "Connect"}
					</button>
					<button
						type="button"
						className="w-full rounded-xl border border-(--line) bg-white/5 px-3 py-2 text-sm font-medium text-(--ink-0) transition-colors hover:bg-white/10"
						onClick={onClose}
					>
						Close
					</button>
				</div>
			</form>
		</div>
	);
}
