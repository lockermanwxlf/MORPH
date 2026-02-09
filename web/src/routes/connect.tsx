import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { robotConnection } from "@/robot-connection";

export const Route = createFileRoute("/connect")({
	component: App,
});

interface Robot {
	host: string;
	port: number;
}

function App() {
	const [host, setHost] = useState("");
	const [port, setPort] = useState("");
	const [selectedRobot, setSelectedRobot] = useState<Robot | null>(null);
	const [isRobotConnecting, setIsRobotConnecting] = useState(false);
	const [robotConnectError, setRobotConnectError] = useState<string | null>(
		null,
	)
	const queryClient = useQueryClient();
	const navigate = useNavigate();

	const getConnectErrorMessage = (response: unknown): string | null => {
		if (!response || typeof response !== "object") return null;
		if ("status" in response) {
			const status = (response as { status?: string }).status;
			if (status === "error") {
				const message = (response as { message?: string }).message;
				return typeof message === "string" && message.length > 0
					? message
					: "Failed to connect";
			}
			return null;
		}
		if ("ok" in response) {
			const ok = (response as { ok?: boolean }).ok;
			if (ok === false) {
				const message =
					(response as { error?: string; message?: string }).error ??
					(response as { message?: string }).message;
				return typeof message === "string" && message.length > 0
					? message
					: "Failed to connect";
			}
			return null;
		}
		return null;
	}

	// Fetch robots
	const {
		data: robots,
		isLoading,
		error,
	} = useQuery<{ robots: Robot[] }>({
		queryKey: ["robots"],
		queryFn: async () => {
			const response = await fetch("/api/robots");
			if (!response.ok) throw new Error("Failed to fetch robots");
			return response.json();
		},
	})

	// Connect to robot
	const connectMutation = useMutation<
		{ robots: Robot[] },
		Error,
		{ host: string; port: number }
	>({
		mutationFn: async (variables) => {
			const response = await fetch("/api/robot/connect", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(variables),
			})
			if (!response.ok) throw new Error("Failed to connect");
			return response.json();
		},
		onSuccess: (data) => {
			// Update the robots list with the response from POST
			queryClient.setQueryData(["robots"], data);
			// Clear the form
			setHost("");
			setPort("");
		},
	})

	const handleConnect = () => {
		connectMutation.mutate({ host, port: parseInt(port, 10) });
	}

	const handleRobotConnect = async () => {
		if (!selectedRobot) return;
		setIsRobotConnecting(true);
		setRobotConnectError(null);
		try {
			const res = await robotConnection.connect(selectedRobot.host, selectedRobot.port);
			const errorMessage = getConnectErrorMessage(res);
			if (errorMessage) {
				setRobotConnectError(errorMessage);
				return
			}
			navigate({ to: "/dashboard" });
		} catch (err) {
			setRobotConnectError(
				err instanceof Error ? err.message : "Failed to connect",
			)
		} finally {
			setIsRobotConnecting(false);
		}
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
			{/* Header */}
			<div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
				<div className="max-w-6xl mx-auto px-4 py-6">
					<h1 className="text-3xl font-bold">Robot Control Center</h1>
					<p className="text-slate-400 mt-2">Connect and manage your robots</p>
				</div>
			</div>

			<div
				className={`max-w-6xl mx-auto px-4 pt-6 transition-all duration-300 ease-out ${robotConnectError
					? "opacity-100 translate-y-0"
					: "opacity-0 -translate-y-2 pointer-events-none h-0 pt-0"
					}`}
			>
				{robotConnectError && (
					<div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm shadow-lg animate-pulse">
						{robotConnectError}
					</div>
				)}
			</div>

			{/* Main Content */}
			<div className="max-w-6xl mx-auto px-4 py-12 grid lg:grid-cols-2 gap-8">
				{/* Connect Section */}
				<section className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
					<h2 className="text-2xl font-bold mb-6">Add Robot</h2>
					<div className="space-y-4">
						<div>
							<div className="block text-sm font-medium text-slate-300 mb-2">
								Host
							</div>
							<input
								type="text"
								value={host}
								onChange={(e) => setHost(e.target.value)}
								placeholder="e.g., 192.168.1.100"
								className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
								required
							/>
						</div>

						<div>
							<div className="block text-sm font-medium text-slate-300 mb-2">
								Port
							</div>
							<input
								type="number"
								value={port}
								onChange={(e) => setPort(e.target.value)}
								placeholder="e.g., 8765"
								className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition"
								required
							/>
						</div>

						<button
							onClick={handleConnect}
							type="button"
							disabled={connectMutation.isPending}
							className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-2 rounded-lg font-medium transition mt-6"
						>
							{connectMutation.isPending
								? "Server is connecting..."
								: "Add to Server"}
						</button>

						{connectMutation.isError && (
							<div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
								Connection failed: {(connectMutation.error as Error).message}
							</div>
						)}

						{connectMutation.isSuccess && (
							<div className="bg-green-900/30 border border-green-700 text-green-200 px-4 py-2 rounded-lg text-sm">
								Connected successfully!
							</div>
						)}
					</div>
				</section>

				{/* Robots List Section */}
				<section className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
					<h2 className="text-2xl font-bold mb-6">Connected Robots</h2>

					{isLoading && (
						<div className="text-slate-400 py-8 text-center">
							<div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent"></div>
							<p className="mt-2">Loading robots...</p>
						</div>
					)}

					{error && (
						<div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
							Failed to load robots
						</div>
					)}

					{robots?.robots && robots.robots.length > 0 ? (
						<div className="space-y-3">
							{robots.robots.map((robot: { host: string; port: number }) => (
								<button
									key={`${robot.host}-${robot.port}`}
									type="button"
									onClick={() => setSelectedRobot(robot)}
									className={`w-full text-left border-2 rounded-lg p-4 transition ${selectedRobot === robot
										? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
										: "border-slate-600 bg-slate-700/50 hover:border-blue-500/50"
										}`}
								>
									<h3
										className={`font-semibold ${selectedRobot === robot
											? "text-blue-300"
											: "text-blue-400"
											}`}
									>
										{robot.host}:{robot.port}
									</h3>
								</button>
							))}
						</div>
					) : !isLoading && !error ? (
						<div className="text-slate-400 py-8 text-center">
							<p>No robots connected yet</p>
							<p className="text-sm mt-1">
								Connect one using the form on the left
							</p>
						</div>
					) : null}
				</section>
			</div>

			{/* Connect Button */}
			<div
				className={`max-w-6xl mx-auto px-4 pb-12 transition-all duration-500 ease-out ${selectedRobot
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-4 pointer-events-none h-0 pb-0"
					}`}
			>
				{selectedRobot && (
					<button
						onClick={handleRobotConnect}
						disabled={isRobotConnecting}
						type="button"
						className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed px-6 py-4 rounded-lg font-medium text-lg transition shadow-lg"
						aria-busy={isRobotConnecting}
					>
						{isRobotConnecting
							? "Connecting..."
							: `Connect to ${selectedRobot.host}:${selectedRobot.port}`}
					</button>
				)}
			</div>
		</div>
	)
}
