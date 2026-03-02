import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useId, useState } from "react";
import { DPad } from "@/components/DPad";
import { useConnectedDevice } from "@/utils/useConnectedDevice";
import { useMorphDevices } from "@/utils/useMorphDevices";
import { useSocket } from "@/utils/useSocket";

export const Route = createFileRoute("/control-panel")({
	component: RouteComponent,
});

interface LogLine {
	id: number;
	message: string;
}

function RouteComponent() {
	const navigate = useNavigate();
	const robotSelectId = useId();
	const { socket } = useSocket();
	const { devices } = useMorphDevices();
	const { connectedDevice, connect } = useConnectedDevice();
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("");
	const [isConnecting, setIsConnecting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [disconnected, setDisconnected] = useState(false);
	const [logs, setLogs] = useState<LogLine[]>([]);

	const isSocketConnected = socket?.connected ?? false;
	const selectedDevice =
		devices.find((d) => d.deviceId === selectedDeviceId) ?? null;

	const connectToDevice = async () => {
		if (!selectedDevice) return;
		setIsConnecting(true);
		setError(null);
		try {
			connect(selectedDevice);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Connection failed");
		} finally {
			setIsConnecting(false);
		}
	};

	useEffect(() => {
		if (!socket) {
			return;
		}

		const handleDisconnect = () => {
			setDisconnected(true);
		};

		const handleLog = (payload: { message?: string }) => {
			if (!payload?.message) {
				return;
			}
			setLogs((prev) => [
				...prev,
				{ id: Date.now(), message: payload.message || "" },
			]);
		};

		socket.on("disconnect", handleDisconnect);
		socket.on("log", handleLog);

		return () => {
			socket.off("disconnect", handleDisconnect);
			socket.off("log", handleLog);
		};
	}, [socket]);

	useEffect(() => {
		if (!disconnected) {
			return;
		}
		const timeoutId = setTimeout(() => {
			navigate({ to: "/devices" });
		}, 3000);
		return () => {
			clearTimeout(timeoutId);
		};
	}, [disconnected, navigate]);

	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<section className="mx-auto flex w-full max-w-7xl flex-1 flex-col rounded-2xl border border-(--line) bg-(--surface) p-6 shadow-[0_18px_40px_rgba(2,8,18,0.35)] backdrop-blur-md">
				<div className="mb-6 flex flex-wrap items-center justify-between gap-4">
					<div>
						<h1 className="text-2xl font-semibold tracking-tight">
							Control Panel
						</h1>
						<p className="mt-1 text-sm text-(--ink-1)">
							Drive and monitor your robot in real time
						</p>
					</div>
					<span className="rounded-full border border-(--line) bg-white/5 px-3 py-1 text-xs font-medium text-(--ink-1)">
						Socket: {isSocketConnected ? "Connected" : "Disconnected"}
					</span>
				</div>

				<div
					className={`mb-4 rounded-xl border px-4 py-3 text-sm transition-all ${
						disconnected
							? "border-[rgba(255,140,89,0.45)] bg-[rgba(255,140,89,0.14)] text-[#ffd1bc]"
							: "max-h-0 overflow-hidden border-transparent p-0 opacity-0"
					}`}
				>
					Connection to the server was lost. Redirecting to Devices...
				</div>

				<div className="mb-6 rounded-xl border border-(--line) bg-black/20 p-4">
					<div className="flex flex-wrap items-end gap-3">
						<div className="min-w-56 flex-1">
							<label
								htmlFor={robotSelectId}
								className="mb-2 block text-xs font-medium uppercase tracking-wide text-(--ink-1)"
							>
								Target Robot
							</label>
							<select
								id={robotSelectId}
								value={selectedDeviceId}
								onChange={(event) => {
									setSelectedDeviceId(event.target.value);
								}}
								className="w-full rounded-lg border border-(--line) bg-black/30 px-3 py-2 text-sm text-(--ink-0) outline-none transition-colors focus:border-(--brand)"
							>
								{devices.length === 0 ? (
									<option value="">No devices available</option>
								) : (
									devices.map((device) => (
										<option key={device.deviceId} value={device.deviceId}>
											{device.host}:{device.port}
										</option>
									))
								)}
							</select>
						</div>
						<button
							type="button"
							onClick={() => {
								void connectToDevice();
							}}
							disabled={!socket || !selectedDevice || isConnecting}
							className="rounded-lg border border-(--line) bg-[rgba(36,199,184,0.14)] px-4 py-2 text-sm font-medium text-(--ink-0) transition-colors hover:bg-[rgba(36,199,184,0.24)] disabled:cursor-not-allowed disabled:opacity-60"
						>
							{isConnecting ? "Connecting..." : "Connect Robot"}
						</button>
					</div>
					{connectedDevice ? (
						<p className="mt-3 text-xs text-(--ink-1)">
							Connected robot: {connectedDevice.host}:{connectedDevice.port}
						</p>
					) : null}
					{error ? (
						<p className="mt-2 text-xs text-[#ffb7a4]">{error}</p>
					) : null}
				</div>

				<div className="grid flex-1 gap-4 lg:grid-cols-2">
					<section className="rounded-xl border border-(--line) bg-black/20 p-6">
						<div className="mb-4 flex items-center justify-between">
							<h2 className="text-xl font-semibold tracking-tight">Logs</h2>
							<span className="rounded-full border border-(--line) bg-white/5 px-2 py-1 text-[11px] font-medium text-(--ink-1)">
								Live
							</span>
						</div>
						{logs.length === 0 ? (
							<p className="text-sm text-(--ink-1)">No logs yet.</p>
						) : (
							<ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
								{logs.map((line) => (
									<li
										key={line.id}
										className="rounded-lg border border-(--line) bg-black/30 px-3 py-2 text-sm text-(--ink-0)"
									>
										{line.message}
									</li>
								))}
							</ul>
						)}
					</section>
					<DPad socket={socket} enabled={isSocketConnected} />
				</div>
			</section>
		</div>
	);
}
