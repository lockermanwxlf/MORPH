import type { BluetoothAPI, ServerAPI } from "../types/electron";

export function requireBluetoothAPI(): BluetoothAPI {
	if (!window.bluetoothAPI) {
		throw new Error("bluetoothAPI is unavailable");
	}

	return window.bluetoothAPI;
}

export function requireServerAPI(): ServerAPI {
	if (!window.serverAPI) {
		throw new Error("serverAPI is unavailable");
	}

	return window.serverAPI;
}
