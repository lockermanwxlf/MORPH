import { type ChildProcessByStdio, spawn } from "node:child_process";
import path from "node:path";
import type { Readable } from "node:stream";
import { app } from "electron";
import type { BluetoothDevice } from "../shared/ipc-types";

interface ScannerEvent {
	event: "add" | "remove" | "update";
	name: string;
	address: string;
	rssi: number;
	device_id: string;
}

interface BluetoothScannerManagerOptions {
	onDeviceAdded?: (device: BluetoothDevice) => void;
	onDeviceRemoved?: (device: BluetoothDevice) => void;
	onDeviceUpdated?: (device: BluetoothDevice) => void;
	onScanningChanged?: (active: boolean) => void;
	onError?: (error: string) => void;
}

export function createBluetoothScannerManager(
	options: BluetoothScannerManagerOptions = {},
) {
	let scannerProcess: ChildProcessByStdio<null, Readable, Readable> | null =
		null;
	let stdoutBuffer = "";
	const devices = new Map<string, BluetoothDevice>();

	const emitScanning = (active: boolean) => {
		options.onScanningChanged?.(active);
	};

	const toDevice = (event: ScannerEvent): BluetoothDevice | null => {
		if (!event.address) {
			return null;
		}

		return {
			name: event.name,
			address: event.address,
			rssi: event.rssi,
			lastSeen: Date.now(),
			deviceId: event.device_id,
		};
	};

	const parseLine = (line: string) => {
		if (!line.trim()) {
			return;
		}

		let event: ScannerEvent;
		try {
			event = JSON.parse(line) as ScannerEvent;
		} catch {
			options.onError?.(`Invalid scanner payload: ${line}`);
			return;
		}

		const device = toDevice(event);
		if (!device) {
			return;
		}

		if (event.event === "add" || event.event === "update") {
			const existing = devices.get(device.address);
			devices.set(device.address, device);
			if (existing) {
				options.onDeviceUpdated?.(device);
			} else {
				options.onDeviceAdded?.(device);
			}
		}

		if (event.event === "remove") {
			const existing = devices.get(device.address);
			if (existing) {
				devices.delete(device.address);
				options.onDeviceRemoved?.(existing);
			}
		}
	};

	const handleStdoutChunk = (chunk: Buffer) => {
		stdoutBuffer += chunk.toString("utf8");
		const lines = stdoutBuffer.split(/\r?\n/);
		stdoutBuffer = lines.pop() ?? "";
		for (const line of lines) {
			console.log(`[bt-scanner] ${line}`);
			parseLine(line);
		}
	};

	const handleScannerExit = () => {
		scannerProcess = null;
		stdoutBuffer = "";

		if (devices.size > 0) {
			for (const device of devices.values()) {
				options.onDeviceRemoved?.(device);
			}
			devices.clear();
		}

		emitScanning(false);
	};

	const scannerCwd = path.join(app.getAppPath(), "bt-scanner");
	const scannerScript = path.join(scannerCwd, "scan.py");

	return {
		start: () => {
			if (scannerProcess) {
				return;
			}

			scannerProcess = spawn("uv", ["run", scannerScript], {
				cwd: scannerCwd,
				stdio: ["ignore", "pipe", "pipe"],
				shell: process.platform === "win32",
			});

			scannerProcess.stdout.on("data", handleStdoutChunk);
			scannerProcess.stderr.on("data", (chunk: Buffer) => {
				options.onError?.(chunk.toString("utf8").trim());
			});
			scannerProcess.on("error", (error) => {
				options.onError?.(error.message);
			});
			scannerProcess.on("close", () => {
				handleScannerExit();
			});

			emitScanning(true);
		},
		stop: () => {
			if (!scannerProcess) {
				return;
			}
			scannerProcess.kill();
		},
		dispose: () => {
			if (scannerProcess) {
				scannerProcess.kill();
				scannerProcess = null;
			}
			devices.clear();
			stdoutBuffer = "";
			emitScanning(false);
		},
		getDevices: () => Array.from(devices.values()),
		isScanning: () => scannerProcess !== null,
	};
}
