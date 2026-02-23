import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";

import { createBackendManager } from "./backend";
import {
	openBluetoothSettings,
	openHotspotSettings,
} from "./bluetooth-tethering";
import { createBluetoothScannerManager } from "./bt-scanner";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;
const RENDERER_DIST = path.join(__dirname, "../dist");

let mainWindow: BrowserWindow | null = null;

function broadcast(channel: string, payload: unknown) {
	if (!mainWindow || mainWindow.isDestroyed()) {
		return;
	}
	mainWindow.webContents.send(channel, payload);
}

const bluetoothScanner = createBluetoothScannerManager({
	onDeviceAdded: (device) => {
		broadcast("bluetooth:device-added", device);
		broadcast("bluetooth:device-found", device);
	},
	onDeviceRemoved: (device) => {
		broadcast("bluetooth:device-removed", device);
		broadcast("bluetooth:device-lost", device);
	},
	onDeviceUpdated: (device) => {
		broadcast("bluetooth:device-updated", device);
	},
	onScanningChanged: (active) => {
		broadcast("bluetooth:scanning", active);
	},
	onError: (error) => {
		console.error("Bluetooth scanner error:", error);
	},
});

const backendManager = createBackendManager({
	onPortChanged: (port) => {
		console.log("Backend manager port changed:", port);
		broadcast("server:port-changed", port);
	},
	onError: (error) => {
		console.error("Backend manager error:", error);
	},
});

function createWindow() {
	mainWindow = new BrowserWindow({
		width: 800,
		height: 600,
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			nodeIntegration: false,
			contextIsolation: true,
			sandbox: false,
		},
	});

	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL);
		mainWindow.webContents.openDevTools();
	} else {
		mainWindow.loadFile(path.join(RENDERER_DIST, "index.html"));
	}
}

app.whenReady().then(async () => {
	try {
		const port = await backendManager.start();
		console.log(`Backend started on port ${port}`);
	} catch (error) {
		console.error("Failed to start backend before app launch:", error);
		app.quit();
		return;
	}

	createWindow();

	ipcMain.handle("bluetooth:get-devices", () => bluetoothScanner.getDevices());
	ipcMain.on("bluetooth:start-scan", () => bluetoothScanner.start());
	ipcMain.on("bluetooth:stop-scan", () => bluetoothScanner.stop());
	ipcMain.handle("bluetooth:open-hotspot-settings", () =>
		openHotspotSettings(),
	);
	ipcMain.handle("bluetooth:open-settings", () =>
		openBluetoothSettings(),
	);
	ipcMain.handle("server:get-port", () => backendManager.getPort());

	bluetoothScanner.start();
});

app.on("before-quit", () => {
	bluetoothScanner.dispose();
	backendManager.dispose();
});

app.on("window-all-closed", () => {
	backendManager.dispose();

	if (process.platform !== "darwin") {
		app.quit();
	}
});
