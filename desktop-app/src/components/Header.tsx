import { Link } from "@tanstack/react-router";
import { Home, Menu, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";

import { requireBluetoothAPI } from "../utils/preload-apis";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const [devices, setDevices] = useState<BluetoothDevice[]>([]);

	useEffect(() => {
		let unsubscribeAdded: (() => void) | null = null;
		let unsubscribeUpdated: (() => void) | null = null;
		let unsubscribeRemoved: (() => void) | null = null;

		try {
			const bluetoothAPI = requireBluetoothAPI();
			void bluetoothAPI.getBluetoothDevices().then(setDevices);

			unsubscribeAdded = bluetoothAPI.onBluetoothDeviceAdded((device) => {
				setDevices((prev) => {
					if (prev.some((d) => d.address === device.address)) {
						return prev.map((d) => (d.address === device.address ? device : d));
					}
					return [...prev, device];
				});
			});

			unsubscribeUpdated = bluetoothAPI.onBluetoothDeviceUpdated(
				(updatedDevice) => {
					setDevices((prev) =>
						prev.map((device) =>
							device.address === updatedDevice.address ? updatedDevice : device,
						),
					);
				},
			);

			unsubscribeRemoved = bluetoothAPI.onBluetoothDeviceRemoved(
				(removedDevice) => {
					setDevices((prev) =>
						prev.filter((device) => device.address !== removedDevice.address),
					);
				},
			);
		} catch {
			setDevices([]);
		}

		return () => {
			unsubscribeAdded?.();
			unsubscribeUpdated?.();
			unsubscribeRemoved?.();
		};
	}, []);

	const deviceLabel = useMemo(() => {
		if (devices.length === 0) {
			return "Device: Unconnected";
		}
		return `Device: ${devices[0]?.name ?? "Connected"}`;
	}, [devices]);

	return (
		<>
			<header className="relative z-20 mx-4 mt-4 flex items-center rounded-2xl border border-[var(--line)] bg-[var(--surface)] px-4 py-3 text-white shadow-[0_20px_50px_rgba(2,8,18,0.45)] backdrop-blur-md">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="rounded-xl border border-[var(--line)] bg-white/5 p-2 transition-colors hover:bg-white/10"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-xl font-semibold tracking-wide">
					<Link to="/">
						<img
							src="/morph-word-logo-white.png"
							alt="MORPH Logo"
							className="h-9"
						/>
					</Link>
				</h1>
				<div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 group">
					<div className="cursor-default rounded-xl border border-[var(--line)] bg-white/5 px-4 py-2 text-sm font-medium text-[var(--ink-0)]">
						{deviceLabel}
					</div>
					<div className="pointer-events-none absolute left-1/2 top-full w-48 -translate-x-1/2 rounded-xl border border-[var(--line)] bg-[var(--surface)] p-1 opacity-0 shadow-xl backdrop-blur-md transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
						<Link
							to="/devices"
							className="block w-full rounded-lg px-3 py-2 text-left text-sm text-[var(--ink-0)] transition-colors hover:bg-white/10"
						>
							Show device list
						</Link>
					</div>
				</div>
			</header>

			<aside
				className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-[var(--line)] bg-[rgba(6,12,22,0.96)] text-white shadow-2xl transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between border-b border-[var(--line)] p-4">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="rounded-lg p-2 transition-colors hover:bg-white/10"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/10"
						activeProps={{
							className:
								"mb-2 flex items-center gap-3 rounded-lg border border-transparent bg-[var(--brand-soft)] p-3 text-white transition-colors hover:bg-[var(--brand)]",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					{/* Demo Links Start */}

					{/* Demo Links End */}
				</nav>
			</aside>
		</>
	);
}
