export interface BluetoothDevice {
	name: string;
	address: string;
	rssi: number | null;
	lastSeen: number;
	deviceId: string;
}

export interface OpenSettingsResult {
	opened: boolean;
	detail?: string;
}

export type Unsubscribe = () => void;
