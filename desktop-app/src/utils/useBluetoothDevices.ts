import { useEffect, useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";
import { requireBluetoothAPI } from "./preload-apis";

export function useBluetoothDevices() {
	const [devices, setDevices] = useState<BluetoothDevice[]>([]);
	useEffect(() => {
		const bluetoothAPI = requireBluetoothAPI();

		let unsubscribeAdded: (() => void) | null = null;
		let unsubscribeUpdated: (() => void) | null = null;
		let unsubscribeRemoved: (() => void) | null = null;

		unsubscribeAdded = bluetoothAPI.onBluetoothDeviceAdded((device) => {
			setDevices((prev) => [...prev, device]);
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

		bluetoothAPI.getBluetoothDevices().then(setDevices);

		return () => {
			unsubscribeAdded?.();
			unsubscribeUpdated?.();
			unsubscribeRemoved?.();
		};
	}, []);

	return devices;
}
