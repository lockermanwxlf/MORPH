import type {
	BluetoothDevice,
	OpenSettingsResult,
	Unsubscribe,
} from "../../shared/ipc-types";

export interface BluetoothAPI {
	getBluetoothDevices: () => Promise<BluetoothDevice[]>;
	startBluetoothScan: () => void;
	stopBluetoothScan: () => void;
	openHotspotSettings: () => Promise<OpenSettingsResult>;
	openBluetoothSettings: () => Promise<OpenSettingsResult>;
	onBluetoothDeviceRemoved: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
	onBluetoothDeviceUpdated: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
}

export interface WifiAPI {
	getHostSSID: () => Promise<string | null>;
}

export interface ServerAPI {
	onPortChanged: (callback: (port: number) => void) => Unsubscribe;
	getPort: () => Promise<number>;
}

declare global {
	interface Window {
		bluetoothAPI?: BluetoothAPI;
		wifiAPI?: WifiAPI;
		serverAPI?: ServerAPI;
	}
}
