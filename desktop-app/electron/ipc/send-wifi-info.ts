import { spawn } from "node:child_process";
import path from "node:path";
import { app } from "electron";

export function sendWifiInfo(
	deviceId: string,
	ssid: string,
	password: string,
): void {
	const cwd = path.join(app.getAppPath(), "bt-scanner");
	const child = spawn("uv", ["run", "send-wifi.py", deviceId, ssid, password], {
		cwd,
		stdio: ["ignore", "pipe", "pipe"],
		shell: process.platform === "win32",
	});

	child.stdout.on("data", (chunk: Buffer) => {
		console.log("[send-wifi-info]", chunk.toString("utf8").trim());
	});

	child.stderr.on("data", (chunk: Buffer) => {
		console.error("[send-wifi-info]", chunk.toString("utf8").trim());
	});

	child.on("close", (code) => {
		console.log(`[send-wifi-info] process exited with code ${code}`);
	});
}
