import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { DPad } from "@/components/DPad";
import { robotConnection } from "@/utils/robot-connection";

export const Route = createFileRoute("/control-panel")({
	component: RouteComponent,
});

function RouteComponent() {
	const navigate = useNavigate();

	const [disconnected, setDisconnected] = useState(false);

	useEffect(() => {
		function handleDisconnect() {
			setDisconnected(true);
		}

		robotConnection.getSocket().on("disconnect", handleDisconnect);

		return () => {
			robotConnection.getSocket().off("disconnect", handleDisconnect);
		};
	}, []);

	useEffect(() => {
		if (!disconnected) return;
		const t = setTimeout(() => {
			navigate({ to: "/connect" });
		}, 3000);
		return () => clearTimeout(t);
	}, [disconnected, navigate]);

	return (
		<div className="min-h-screen bg-linear-to-br from-slate-900 to-slate-800 text-white">
			<div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
				<div className="max-w-6xl mx-auto px-4 py-6">
					<h1 className="text-3xl font-bold">Robot Dashboard</h1>
					<p className="text-slate-400 mt-2">
						Control and monitor your robot in real time
					</p>
				</div>
			</div>

			<div
				className={`max-w-6xl mx-auto px-4 pt-6 transition-all duration-300 ease-out ${disconnected ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none h-0 pt-0"}`}
			>
				{disconnected && (
					<div className="bg-teal-900/20 border border-teal-400 text-teal-100 px-4 py-3 rounded-lg text-sm shadow-lg">
						Disconnected from robot — redirecting to home...
					</div>
				)}
			</div>

			<div className="max-w-6xl mx-auto px-4 py-10 grid lg:grid-cols-2 gap-8">
				<LogsList />
				<DPad />
			</div>
		</div>
	);
}

function LogsList() {
	const [logs, setLogs] = useState<{ ts: number; message: string }[]>([]);

	useEffect(() => {
		function handleLog(log: { message: string }) {
			setLogs((prevLogs) => [
				...prevLogs,
				{ ts: Date.now(), message: log.message },
			]);
		}

		robotConnection.getSocket().on("log", handleLog);

		return () => {
			robotConnection.getSocket().off("log", handleLog);
		};
	}, []);

	return (
		<section className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
			<div className="flex items-center justify-between mb-6">
				<h2 className="text-2xl font-bold">Logs</h2>
				<span className="text-xs text-slate-400 uppercase tracking-wider">
					Live
				</span>
			</div>
			<ul className="space-y-3">
				{logs.map((log) => (
					<li
						key={log.ts}
						className="rounded-lg border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-200"
					>
						{log.message}
					</li>
				))}
			</ul>
			{logs.length === 0 && (
				<div className="text-slate-400 text-sm">No logs yet.</div>
			)}
		</section>
	);
}
