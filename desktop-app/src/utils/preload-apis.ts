import type { BluetoothAPI, ServerAPI, SetupAPI } from "../types/electron";

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

export function requireSetupAPI(): SetupAPI {
	if (!window.setupAPI) {
		throw new Error("setupAPI is unavailable");
	}

	return window.setupAPI;
}
