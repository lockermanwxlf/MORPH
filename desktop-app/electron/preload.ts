import { contextBridge, ipcRenderer } from "electron";
import type {
	BluetoothDevice,
	HostCapabilities,
	OpenSettingsResult,
	Unsubscribe,
} from "../shared/ipc-types";

contextBridge.exposeInMainWorld("bluetoothAPI", {
	getBluetoothDevices: () => ipcRenderer.invoke("bluetooth:get-devices"),
	startBluetoothScan: () => ipcRenderer.send("bluetooth:start-scan"),
	stopBluetoothScan: () => ipcRenderer.send("bluetooth:stop-scan"),
	openHotspotSettings: (): Promise<OpenSettingsResult> =>
		ipcRenderer.invoke("bluetooth:open-hotspot-settings"),
	openBluetoothSettings: (): Promise<OpenSettingsResult> =>
		ipcRenderer.invoke("bluetooth:open-settings"),
	onBluetoothDeviceRemoved: (
		callback: (device: BluetoothDevice) => void,
	): Unsubscribe => {
		const listener = (_event: unknown, device: BluetoothDevice) =>
			callback(device);
		ipcRenderer.on("bluetooth:device-removed", listener);
		return () =>
			ipcRenderer.removeListener("bluetooth:device-removed", listener);
	},
	onBluetoothDeviceUpdated: (
		callback: (device: BluetoothDevice) => void,
	): Unsubscribe => {
		const listener = (_event: unknown, device: BluetoothDevice) =>
			callback(device);
		ipcRenderer.on("bluetooth:device-updated", listener);
		return () =>
			ipcRenderer.removeListener("bluetooth:device-updated", listener);
	},
	sendWifiCredentials: (deviceId: string, ssid: string, password: string) => {
		console.log("Sending WiFi credentials", { deviceId, ssid, password });
		return ipcRenderer.invoke("bluetooth:send-wifi-credentials", {
			deviceId,
			ssid,
			password,
		});
	},
});

contextBridge.exposeInMainWorld("wifiAPI", {
	getHostSSID: () => ipcRenderer.invoke("wifi:get-host-ssid"),
});

contextBridge.exposeInMainWorld("serverAPI", {
	onPortChanged: (callback: (port: number) => void): Unsubscribe => {
		const listener = (_event: unknown, port: number) => callback(port);
		ipcRenderer.on("server:port-changed", listener);
		return () => ipcRenderer.removeListener("server:port-changed", listener);
	},
	getPort: () => ipcRenderer.invoke("server:get-port"),
});

contextBridge.exposeInMainWorld("platformAPI", {
	getPlatformCapabilities: (): HostCapabilities => {
		return {
			supportsBluetoothTethering: process.platform !== "darwin",
		};
	},
});
