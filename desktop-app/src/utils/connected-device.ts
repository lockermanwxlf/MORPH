import { useCallback, useEffect, useMemo, useState, useSyncExternalStore } from "react";
import type { MorphDevice } from "./useMorphDevices";
import { useMorphDevices } from "./useMorphDevices";
import { connectRobot, useSocket } from "./useSocket";

interface ConnectedDeviceStore {
	connectedDeviceId: string | null;
	isConnecting: boolean;
	error: string | null;
}

const listeners = new Set<() => void>();
let store: ConnectedDeviceStore = {
	connectedDeviceId: null,
	isConnecting: false,
	error: null,
};

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot() {
	return store;
}

function updateStore(patch: Partial<ConnectedDeviceStore>) {
	store = { ...store, ...patch };
	for (const listener of listeners) {
		listener();
	}
}

function getMessage(error: unknown): string {
	return error instanceof Error ? error.message : "Failed to connect to robot";
}

export function useConnectedDevice() {
	const { devices, isLoading: isDevicesLoading, error: devicesError } =
		useMorphDevices();
	const {
		socket,
		isConnected: isSocketConnected,
		error: socketError,
	} = useSocket();
	const connectedState = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	const [selectedDeviceId, setSelectedDeviceId] = useState("");

	useEffect(() => {
		if (selectedDeviceId || devices.length === 0) {
			return;
		}
		setSelectedDeviceId(devices[0].deviceId);
	}, [devices, selectedDeviceId]);

	useEffect(() => {
		if (!connectedState.connectedDeviceId) {
			return;
		}
		const stillExists = devices.some(
			(device) => device.deviceId === connectedState.connectedDeviceId,
		);
		if (!stillExists) {
			updateStore({ connectedDeviceId: null });
		}
	}, [connectedState.connectedDeviceId, devices]);

	useEffect(() => {
		if (isSocketConnected) {
			return;
		}
		if (connectedState.connectedDeviceId || connectedState.error) {
			updateStore({ connectedDeviceId: null, isConnecting: false, error: null });
		}
	}, [
		connectedState.connectedDeviceId,
		connectedState.error,
		isSocketConnected,
	]);

	const connectedDevice = useMemo(
		() =>
			devices.find((device) => device.deviceId === connectedState.connectedDeviceId) ??
			null,
		[connectedState.connectedDeviceId, devices],
	);

	const selectedDevice = useMemo(
		() => devices.find((device) => device.deviceId === selectedDeviceId) ?? null,
		[devices, selectedDeviceId],
	);

	const connectToDevice = useCallback(
		async (device: MorphDevice | string | null = null) => {
			if (!socket) {
				updateStore({ error: "Socket is unavailable" });
				return null;
			}

			const targetDeviceId =
				typeof device === "string"
					? device
					: device?.deviceId ?? selectedDeviceId ?? "";
			if (!targetDeviceId) {
				updateStore({ error: "No target device selected" });
				return null;
			}

			const targetDevice =
				devices.find((item) => item.deviceId === targetDeviceId) ?? null;
			if (!targetDevice) {
				updateStore({ error: "Selected device is no longer available" });
				return null;
			}

			updateStore({ isConnecting: true, error: null });
			try {
				await connectRobot(targetDevice.deviceId, socket);
				updateStore({
					connectedDeviceId: targetDevice.deviceId,
					isConnecting: false,
					error: null,
				});
				setSelectedDeviceId(targetDevice.deviceId);
				return targetDevice;
			} catch (error) {
				updateStore({
					connectedDeviceId: null,
					isConnecting: false,
					error: getMessage(error),
				});
				return null;
			}
		},
		[devices, selectedDeviceId, socket],
	);

	return {
		devices,
		isDevicesLoading,
		socket,
		isSocketConnected,
		selectedDeviceId,
		selectedDevice,
		setSelectedDeviceId,
		connectToDevice,
		connectedDeviceId: connectedState.connectedDeviceId,
		connectedDevice,
		isConnecting: connectedState.isConnecting,
		error:
			connectedState.error ??
			socketError?.message ??
			(devicesError instanceof Error ? devicesError.message : null),
	};
}
