import { type ChildProcessByStdio, spawn } from "node:child_process";
import path from "node:path";
import type { Readable } from "node:stream";
import { app } from "electron";
import type { BluetoothDevice } from "shared/ipc-types";

interface IpcEvent {
	event: "updated" | "removed";
	name: string;
	address: string;
	rssi: number;
	deviceId: string;
	networkSSID: string | null;
}

export interface ScannerManager {
	start: () => void;
	stop: () => void;
	cleanup: () => void;
	getDevices: () => BluetoothDevice[];
}

export interface ScannerManagerOptions {
	onDeviceUpdated?: (device: BluetoothDevice) => void;
	onDeviceRemoved?: (device: BluetoothDevice) => void;
}

export function createScannerManager(
	options: ScannerManagerOptions = {},
): ScannerManager {
	let scannerProcess: ChildProcessByStdio<null, Readable, Readable> | null =
		null;
	let stdoutBuffer = "";
	const devices = new Map<string, BluetoothDevice>();

	function handleBuffer() {
		const lines = stdoutBuffer.split("\n");
		stdoutBuffer = lines.pop() || "";
		for (const line of lines) {
			if (!line.trim()) {
				continue;
			}

			console.log("[bt-scanner]", line);

			const event: IpcEvent = JSON.parse(line);
			const device = {
				name: event.name,
				address: event.address,
				rssi: event.rssi,
				deviceId: event.deviceId,
				networkSSID: event.networkSSID,
			};
			switch (event.event) {
				case "updated": {
					devices.set(event.address, device);
					options.onDeviceUpdated?.(device);
					break;
				}
				case "removed": {
					devices.delete(event.address);
					options.onDeviceRemoved?.(device);
					break;
				}
			}
		}
	}

	function start() {
		if (scannerProcess) {
			return;
		}

		const cwd = path.join(app.getAppPath(), "bt-scanner");
		scannerProcess = spawn("uv", ["run", "scanner.py"], {
			cwd,
			stdio: ["ignore", "pipe", "pipe"],
			shell: process.platform === "win32",
		});

		scannerProcess.stdout.on("data", (chunk: Buffer) => {
			stdoutBuffer += chunk.toString("utf8");
			handleBuffer();
		});
	}

	function stop() {
		cleanup();
	}

	function cleanup() {
		if (scannerProcess) {
			scannerProcess.kill();
			scannerProcess = null;
		}
		devices.clear();
	}

	function getDevices() {
		return [...devices.values()];
	}

	return {
		start,
		stop,
		cleanup,
		getDevices,
	};
}
