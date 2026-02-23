import { type ChildProcessByStdio, spawn } from "node:child_process";
import path from "node:path";
import type { Readable } from "node:stream";
import { fileURLToPath } from "node:url";

interface BackendManagerOptions {
	onPortChanged?: (port: number) => void;
	onError?: (error: string) => void;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function createBackendManager(options: BackendManagerOptions = {}) {
	let backendProcess: ChildProcessByStdio<null, Readable, Readable> | null =
		null;
	let backendPort: number | null = null;
	let stdoutBuffer = "";
	let stderrBuffer = "";
	let startupPromise: Promise<number> | null = null;
	let resolveStartup: ((port: number) => void) | null = null;
	let rejectStartup: ((error: Error) => void) | null = null;

	const backendCwd = path.join(__dirname, "../../server");

	const clearStartup = () => {
		resolveStartup = null;
		rejectStartup = null;
		startupPromise = null;
	};

	const maybeCapturePort = (line: string) => {
		const match = line.match(/Uvicorn running on .*:(\d+)/i);
		if (!match) {
			return;
		}

		const parsedPort = Number.parseInt(match[1] ?? "", 10);
		if (Number.isNaN(parsedPort) || parsedPort === backendPort) {
			return;
		}

		backendPort = parsedPort;
		options.onPortChanged?.(backendPort);
		resolveStartup?.(backendPort);
		clearStartup();
	};

	const consumeOutput = (chunk: Buffer, isStderr: boolean) => {
		const text = chunk.toString("utf8");
		if (isStderr) {
			process.stderr.write(text);
			stderrBuffer += text;
		} else {
			process.stdout.write(text);
			stdoutBuffer += text;
		}

		const activeBuffer = isStderr ? stderrBuffer : stdoutBuffer;
		const lines = activeBuffer.split(/\r?\n/);
		const remainder = lines.pop() ?? "";
		for (const line of lines) {
			maybeCapturePort(line);
		}

		if (isStderr) {
			stderrBuffer = remainder;
		} else {
			stdoutBuffer = remainder;
		}
	};

	const resetState = () => {
		backendProcess = null;
		backendPort = null;
		stdoutBuffer = "";
		stderrBuffer = "";
		clearStartup();
	};

	return {
		start: (): Promise<number> => {
			if (backendPort !== null) {
				return Promise.resolve(backendPort);
			}
			if (startupPromise) {
				return startupPromise;
			}
			if (backendProcess) {
				return Promise.reject(
					new Error("Backend process is running but port is not available."),
				);
			}

			backendProcess = spawn(
				"uv",
				["run", "uvicorn", "main:app", "--host", "127.0.0.1", "--port", "0"],
				{
					cwd: backendCwd,
					stdio: ["ignore", "pipe", "pipe"],
					shell: process.platform === "win32",
				},
			);

			startupPromise = new Promise<number>((resolve, reject) => {
				resolveStartup = resolve;
				rejectStartup = reject;
			});

			backendProcess.stdout.on("data", (chunk: Buffer) =>
				consumeOutput(chunk, false),
			);
			backendProcess.stderr.on("data", (chunk: Buffer) =>
				consumeOutput(chunk, true),
			);
			backendProcess.on("error", (error) => {
				options.onError?.(error.message);
				rejectStartup?.(new Error(error.message));
				clearStartup();
			});
			backendProcess.on("close", (code) => {
				console.log(`Backend process exited with code ${code}`);
				rejectStartup?.(
					new Error(`Backend process exited before startup (code ${code})`),
				);
				resetState();
			});

			return startupPromise;
		},
		stop: () => {
			if (!backendProcess) {
				return;
			}
			backendProcess.kill();
		},
		dispose: () => {
			if (backendProcess) {
				backendProcess.kill();
			}
			resetState();
		},
		getPort: () => {
			if (backendPort === null) {
				throw new Error("Backend port requested before startup completed.");
			}
			return backendPort;
		},
		isRunning: () => backendProcess !== null,
	};
}
