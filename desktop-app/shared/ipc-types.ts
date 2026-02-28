export interface BluetoothDevice {
	address: string;
	name: string;
	rssi: number;
	deviceId: string;
	networkSSID: string | null;
}

export interface OpenSettingsResult {
	opened: boolean;
	detail?: string;
}

export type Unsubscribe = () => void;

export interface HostCapabilities {
	supportsBluetoothTethering: boolean;
}