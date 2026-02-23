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
	onBluetoothDeviceAdded: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
	onBluetoothDeviceRemoved: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
	onBluetoothDeviceUpdated: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
	onBluetoothDeviceFound: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
	onBluetoothDeviceLost: (
		callback: (device: BluetoothDevice) => void,
	) => Unsubscribe;
	onBluetoothScanning: (callback: (active: boolean) => void) => Unsubscribe;
}

export interface ServerAPI {
	onPortChanged: (callback: (port: number) => void) => Unsubscribe;
	getPort: () => Promise<number>;
}

declare global {
	interface Window {
		bluetoothAPI?: BluetoothAPI;
		serverAPI?: ServerAPI;
	}
}
