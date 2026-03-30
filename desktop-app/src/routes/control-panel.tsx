import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DPad } from "@/components/DPad";
import { LidarView } from "@/components/LidarView";
import { useSocket } from "@/utils/SocketContext";

export const Route = createFileRoute("/control-panel")({
	component: RouteComponent,
});

interface LogLine {
	id: number;
	message: string;
	timestamp: string;
	variant: "default" | "alert";
}

interface DiffDriveTelemetry {
	linear_x?: number;
	angular_z?: number;
}

function RouteComponent() {
	const navigate = useNavigate();
	const { socket } = useSocket();
	const [disconnected, setDisconnected] = useState(false);
	const [logs, setLogs] = useState<LogLine[]>([]);
	const [robotStats, setRobotStats] = useState({
		linearX: 0,
		angularZ: 0,
	});

	const isSocketConnected = socket?.connected ?? false;

	useEffect(() => {
		if (!socket) {
			return;
		}

		const handleDisconnect = () => {
			setDisconnected(true);
		};

		const handleLog = (payload: { message?: string }) => {
			const message = payload?.message?.trim();
			if (!message) {
				return;
			}

			const lowered = message.toLowerCase();
			const variant =
				lowered.includes("error") ||
				lowered.includes("obstacle") ||
				lowered.includes("failed")
					? "alert"
					: "default";

			setLogs((prev) => [
				{
					id: Date.now() + prev.length,
					message,
					timestamp: new Date().toLocaleTimeString([], {
						hour: "numeric",
						minute: "2-digit",
					}),
					variant,
				},
				...prev.slice(0, 29),
			]);
		};

		const handleDiffDrive = (payload: DiffDriveTelemetry) => {
			setRobotStats((prev) => ({
				linearX:
					typeof payload?.linear_x === "number" ? payload.linear_x : prev.linearX,
				angularZ:
					typeof payload?.angular_z === "number"
						? payload.angular_z
						: prev.angularZ,
			}));
		};

		socket.on("disconnect", handleDisconnect);
		socket.on("log", handleLog);
		socket.on("diff_drive", handleDiffDrive);

		return () => {
			socket.off("disconnect", handleDisconnect);
			socket.off("log", handleLog);
			socket.off("diff_drive", handleDiffDrive);
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
							Drive and monitor lidar data in real time
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

				<div className="grid flex-1 gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.8fr)]">
					<div className="flex min-h-0 flex-col gap-4">
						<section className="flex min-h-[380px] flex-1 flex-col rounded-[32px] border border-(--line) bg-black/20 p-6">
							<div className="mb-4 flex items-center justify-between">
								<div>
									<h2 className="text-xl font-semibold tracking-tight">
										Lidar View
									</h2>
									<p className="mt-1 text-xs text-(--ink-1)">
										Live occupancy map
									</p>
								</div>
								<span className="rounded-full border border-(--line) bg-white/5 px-2 py-1 text-[11px] font-medium text-(--ink-1)">
									Live Map
								</span>
							</div>
							<div className="min-h-[320px] flex-1 overflow-hidden rounded-[24px] border border-(--line) bg-black/30 p-3">
								<div className="h-full overflow-hidden rounded-[18px] bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.06),transparent_65%)]">
									<LidarView />
								</div>
							</div>
						</section>

						<DPad
							socket={socket}
							enabled={isSocketConnected}
							className="mx-auto w-full max-w-md"
						/>
					</div>

					<div className="flex min-h-0 max-h-[calc(100dvh-11rem)] flex-col gap-4">
						<section className="rounded-[32px] border border-(--line) bg-black/20 p-5">
							<div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-(--ink-1)">
								<span className="h-2.5 w-2.5 rounded-full bg-[#6fe58d]" />
								Robot Stats
							</div>
							<div className="grid grid-cols-2 gap-3">
								<div className="rounded-2xl border border-(--line) bg-white/8 px-4 py-3">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-(--ink-1)">
										Linear X
									</p>
									<p className="mt-1 text-lg font-semibold text-(--ink-0)">
										{robotStats.linearX.toFixed(3)}
									</p>
								</div>
								<div className="rounded-2xl border border-(--line) bg-white/8 px-4 py-3">
									<p className="text-[11px] font-semibold uppercase tracking-wide text-(--ink-1)">
										Angular Z
									</p>
									<p className="mt-1 text-lg font-semibold text-(--ink-0)">
										{robotStats.angularZ.toFixed(3)}
									</p>
								</div>
							</div>
						</section>

						<section className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[32px] border border-(--line) bg-black/20 p-5">
							<div className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-(--ink-1)">
								<span className="h-2.5 w-2.5 rounded-full bg-[#6fe58d]" />
								System Log
							</div>

							<div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto pr-1">
								{logs.length === 0 ? (
									<div className="flex flex-1 items-center justify-center rounded-[28px] border border-dashed border-(--line) bg-white/4 px-6 text-center text-sm text-(--ink-1)">
										Waiting for live robot logs...
									</div>
								) : (
									logs.map((line) => (
										<article
											key={line.id}
											className={`rounded-[24px] border px-4 py-3 shadow-[0_10px_24px_rgba(2,8,18,0.18)] ${
												line.variant === "alert"
													? "border-[rgba(232,93,93,0.25)] bg-[rgba(232,93,93,0.14)]"
													: "border-(--line) bg-white/8"
											}`}
										>
											<p
												className={`text-[11px] font-semibold uppercase tracking-wide ${
													line.variant === "alert"
														? "text-[#ff8c8c]"
														: "text-(--ink-1)"
												}`}
											>
												{line.timestamp}
											</p>
											<p
												className={`mt-1 text-sm font-medium ${
													line.variant === "alert"
														? "text-[#ffd5d5]"
														: "text-(--ink-0)"
												}`}
											>
												{line.message}
											</p>
										</article>
									))
								)}
							</div>
						</section>
					</div>
				</div>
			</section>
		</div>
	);
}
