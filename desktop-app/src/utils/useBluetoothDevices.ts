import { useEffect, useState } from "react";
import type { BluetoothDevice } from "shared/ipc-types";
import { requireBluetoothAPI } from "./preload-apis";

export function useBluetoothDevices() {
	const [devices, setDevices] = useState<BluetoothDevice[]>([]);
	useEffect(() => {
		const bluetoothAPI = requireBluetoothAPI();

		let unsubscribeUpdated: (() => void) | null = null;
		let unsubscribeRemoved: (() => void) | null = null;

		unsubscribeUpdated = bluetoothAPI.onBluetoothDeviceUpdated(
			(updatedDevice) => {
				setDevices((prev) => {
					const exists = prev.some(
						(device) => device.address === updatedDevice.address,
					);
					return exists
						? prev.map((device) =>
								device.address === updatedDevice.address
									? updatedDevice
									: device,
							)
						: [...prev, updatedDevice];
				});
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
			unsubscribeUpdated?.();
			unsubscribeRemoved?.();
		};
	}, []);

	return devices;
}
