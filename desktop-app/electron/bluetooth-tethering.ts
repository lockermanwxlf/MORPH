import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { OpenSettingsResult } from "../shared/ipc-types";

const execFileAsync = promisify(execFile);

async function run(
	command: string,
	args: string[],
): Promise<{ stdout: string; stderr: string; ok: boolean }> {
	try {
		const { stdout, stderr } = await execFileAsync(command, args, {
			windowsHide: true,
		});
		return { stdout, stderr, ok: true };
	} catch (error) {
		const err = error as {
			stdout?: string;
			stderr?: string;
		};
		return { stdout: err.stdout ?? "", stderr: err.stderr ?? "", ok: false };
	}
}

export async function openHotspotSettings(): Promise<OpenSettingsResult> {
	if (process.platform === "win32") {
		const result = await run("cmd", [
			"/c",
			"start",
			"",
			"ms-settings:network-mobilehotspot",
		]);
		return {
			opened: result.ok,
			detail: result.ok
				? undefined
				: "Failed to open Windows hotspot settings.",
		};
	}

	if (process.platform === "darwin") {
		const result = await run("open", [
			"x-apple.systempreferences:com.apple.preferences.sharing",
		]);
		return {
			opened: result.ok,
			detail: result.ok
				? undefined
				: "Failed to open macOS sharing settings.",
		};
	}

	if (process.platform === "linux") {
		const candidates: Array<{ cmd: string; args: string[] }> = [
			{ cmd: "gnome-control-center", args: ["wifi"] },
			{ cmd: "gnome-control-center", args: ["network"] },
			{ cmd: "nm-connection-editor", args: [] },
		];
		for (const candidate of candidates) {
			const result = await run(candidate.cmd, candidate.args);
			if (result.ok) {
				return { opened: true };
			}
		}
		return {
			opened: false,
			detail: "Could not open Linux hotspot/network settings.",
		};
	}

	return {
		opened: false,
		detail: "Unsupported platform.",
	};
}

export async function openBluetoothSettings(): Promise<OpenSettingsResult> {
	if (process.platform === "win32") {
		const result = await run("cmd", ["/c", "start", "", "ms-settings:bluetooth"]);
		return {
			opened: result.ok,
			detail: result.ok
				? undefined
				: "Failed to open Windows Bluetooth settings.",
		};
	}

	if (process.platform === "darwin") {
		const result = await run("open", [
			"x-apple.systempreferences:com.apple.BluetoothSettings",
		]);
		return {
			opened: result.ok,
			detail: result.ok
				? undefined
				: "Failed to open macOS Bluetooth settings.",
		};
	}

	if (process.platform === "linux") {
		const candidates: Array<{ cmd: string; args: string[] }> = [
			{ cmd: "gnome-control-center", args: ["bluetooth"] },
			{ cmd: "blueman-manager", args: [] },
			{ cmd: "kcmshell6", args: ["kcm_bluetooth"] },
		];
		for (const candidate of candidates) {
			const result = await run(candidate.cmd, candidate.args);
			if (result.ok) {
				return { opened: true };
			}
		}
		return {
			opened: false,
			detail: "Could not open Linux Bluetooth settings.",
		};
	}

	return {
		opened: false,
		detail: "Unsupported platform.",
	};
}
