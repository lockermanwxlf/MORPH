import path from "node:path";
import { fileURLToPath } from "node:url";
import { app, BrowserWindow, ipcMain } from "electron";

import { createBackendManager } from "./backend";
import {
	openBluetoothSettings,
	openHotspotSettings,
} from "./bluetooth-tethering";
import { createScannerManager } from "./bt-scanner";
import { sendWifiInfo } from "./ipc/send-wifi-info";

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

const scannerManager = createScannerManager({
	onDeviceUpdated(device) {
		broadcast("bluetooth:device-updated", device);
	},
	onDeviceRemoved(device) {
		broadcast("bluetooth:device-removed", device);
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

	mainWindow.webContents.on("did-fail-load", (_e, code, desc) => {
		console.error("did-fail-load", code, desc);
	});

	console.log("VITE_DEV_SERVER_URL:", VITE_DEV_SERVER_URL);
	if (VITE_DEV_SERVER_URL) {
		mainWindow.loadURL(VITE_DEV_SERVER_URL).catch((err) => {
			console.error("loadURL failed:", err);
		});
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

	ipcMain.handle("bluetooth:get-devices", () => scannerManager.getDevices());
	ipcMain.on("bluetooth:start-scan", () => scannerManager.start());
	ipcMain.on("bluetooth:stop-scan", () => scannerManager.stop());
	ipcMain.handle("bluetooth:open-hotspot-settings", () =>
		openHotspotSettings(),
	);
	ipcMain.handle("wifi:get-host-ssid", () => {
		return "";
	});
	ipcMain.handle("bluetooth:open-settings", () => openBluetoothSettings());
	ipcMain.handle("server:get-port", () => backendManager.getPort());

	ipcMain.handle(
		"bluetooth:send-wifi-credentials",
		(_event, { deviceId, ssid, password }) => {
			console.log("[main] bluetooth:send-wifi-credentials", {
				deviceId,
				ssid,
				passwordLength: typeof password === "string" ? password.length : -1,
			});
			sendWifiInfo(deviceId, ssid, password);
		},
	);
	scannerManager.start();
});

app.on("before-quit", () => {
	scannerManager.cleanup();
	backendManager.dispose();
});

app.on("window-all-closed", () => {
	backendManager.dispose();

	//if (process.platform !== "darwin") {
	app.quit();
	//}
});
