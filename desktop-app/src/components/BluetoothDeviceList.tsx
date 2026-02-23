import { useEffect, useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";

import { requireBluetoothAPI } from "../utils/preload-apis";

export function BluetoothDeviceList() {
	const [devices, setDevices] = useState<BluetoothDevice[]>([]);

	useEffect(() => {
		const bluetoothAPI = requireBluetoothAPI();
		bluetoothAPI.getBluetoothDevices().then(setDevices);
		const unsubscribes = [
			bluetoothAPI.onBluetoothDeviceAdded((device) => {
				setDevices((prev) => [...prev, device]);
			}),
			bluetoothAPI.onBluetoothDeviceUpdated((updatedDevice) => {
				setDevices((prev) =>
					prev.map((device) =>
						device.address === updatedDevice.address ? updatedDevice : device,
					),
				);
			}),
			bluetoothAPI.onBluetoothDeviceRemoved((removedDevice) => {
				setDevices((prev) =>
					prev.filter((device) => device.address !== removedDevice.address),
				);
			}),
		];

		return () => {
			unsubscribes.forEach((unsubscribe) => {
				unsubscribe();
			});
		};
	}, []);

	return (
		<section className="rounded-2xl border border-[var(--line)] bg-[var(--surface)] p-6 shadow-[0_18px_40px_rgba(2,8,18,0.35)] backdrop-blur-md">
			<div className="mb-5 flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold tracking-tight">
						Bluetooth Devices
					</h2>
					<p className="mt-1 text-sm text-[var(--ink-1)]">
						Live list from scanner events
					</p>
				</div>
				<div className="rounded-full border border-[var(--line)] bg-white/5 px-3 py-1 text-xs font-medium text-[var(--ink-1)]">
					{devices.length} active
				</div>
			</div>

			{devices.length === 0 ? (
				<div className="rounded-xl border border-dashed border-[var(--line)] bg-black/20 px-4 py-8 text-center text-sm text-[var(--ink-1)]">
					No devices connected
				</div>
			) : (
				<ul className="grid gap-3 sm:grid-cols-2">
					{devices.map((device) => (
						<li
							key={device.address}
							className="rounded-xl border border-[var(--line)] bg-black/20 p-4 transition-colors hover:bg-black/30"
						>
							<div className="flex items-start justify-between gap-3">
								<div className="min-w-0">
									<p className="truncate text-base font-semibold">
										{device.name}
									</p>
									<p className="mt-1 truncate text-xs text-[var(--ink-1)]">
										{device.address}
									</p>
								</div>
								<span className="rounded-full border border-[var(--line)] bg-[rgba(36,199,184,0.12)] px-2 py-1 text-[11px] font-medium text-[var(--brand)]">
									Connected
								</span>
							</div>
							<p className="mt-4 text-sm text-[var(--ink-1)]">
								RSSI:{" "}
								<span className="font-medium text-[var(--ink-0)]">
									{device.rssi ?? "N/A"}
								</span>
							</p>
						</li>
					))}
				</ul>
			)}
		</section>
	);
}
