import type {
	BluetoothDevice,
	HostCapabilities,
	OpenSettingsResult,
	SetupGradeLevel,
	SetupUserProfile,
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
	sendWifiCredentials: (
		deviceId: string,
		ssid: string,
		password: string,
	) => Promise<void>;
}

export interface WifiAPI {
	getHostSSID: () => Promise<string | null>;
}

export interface ServerAPI {
	onPortChanged: (callback: (port: number) => void) => Unsubscribe;
	getPort: () => Promise<number>;
}

export interface PlatformAPI {
	getPlatformCapabilities: () => HostCapabilities;
}

export interface SetupAPI {
	getProfile: () => Promise<SetupUserProfile | null>;
	saveProfile: (gradeLevel: SetupGradeLevel) => Promise<SetupUserProfile>;
}

declare global {
	interface Window {
		bluetoothAPI?: BluetoothAPI;
		wifiAPI?: WifiAPI;
		serverAPI?: ServerAPI;
		platformAPI?: PlatformAPI;
		setupAPI?: SetupAPI;
	}
}
