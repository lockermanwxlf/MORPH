import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { apiUrl } from "@/utils/api";
import { robotConnection } from "@/utils/robot-connection";

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
	);
	const [isDialogOpen, setIsDialogOpen] = useState(false);
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
	};

	// Fetch robots
	const {
		data: robots,
		isLoading,
		error,
	} = useQuery<{ robots: Robot[] }>({
		queryKey: ["robots"],
		queryFn: async () => {
			const response = await fetch(`${apiUrl}/robots`);
			if (!response.ok) throw new Error("Failed to fetch robots");
			return response.json();
		},
	});

	// Connect to robot
	const connectMutation = useMutation<
		{ robots: Robot[] },
		Error,
		{ host: string; port: number }
	>({
		mutationFn: async (variables) => {
			const response = await fetch(`${apiUrl}/robot/connect`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(variables),
			});
			if (!response.ok) throw new Error("Failed to connect");
			return response.json();
		},
		onSuccess: (data) => {
			// Update the robots list with the response from POST
			queryClient.setQueryData(["robots"], data);
			// Clear the form
			setHost("");
			setPort("");
			// Close the dialog
			setIsDialogOpen(false);
		},
	});

	const handleConnect = () => {
		connectMutation.mutate({ host, port: parseInt(port, 10) });
	};

	const handleRobotConnect = async () => {
		if (!selectedRobot) return;
		setIsRobotConnecting(true);
		setRobotConnectError(null);
		try {
			console.log("HI");
			const res = await robotConnection.connect(
				selectedRobot.host,
				selectedRobot.port,
			);
			console.log("HI2");

			const errorMessage = getConnectErrorMessage(res);
			if (errorMessage) {
				setRobotConnectError(errorMessage);
				return;
			}
			navigate({ to: "/dashboard" });
		} catch (err) {
			console.error("Connection error:", err);
			setRobotConnectError(
				err instanceof Error ? err.message : "Failed to connect",
			);
		} finally {
			setIsRobotConnecting(false);
		}
	};

	const robotList = robots?.robots || [];
	const hasRobots = robotList.length > 0;

	// Auto-open dialog if no robots
	if (!isLoading && !hasRobots && !isDialogOpen) {
		setIsDialogOpen(true);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 text-white">
			{/* Header */}
			<div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
				<div className="max-w-6xl mx-auto px-4 py-6 flex justify-between items-center">
					<div>
						<h1 className="text-3xl font-bold">Connect to a Robot</h1>
						<p className="text-slate-400 mt-2">Select a robot to connect</p>
					</div>
					{hasRobots && (
						<button
							onClick={() => setIsDialogOpen(true)}
							type="button"
							className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg font-medium transition"
						>
							+ Add Robot
						</button>
					)}
				</div>
			</div>

			<div
				className={`max-w-6xl mx-auto px-4 pt-6 transition-all duration-300 ease-out ${
					robotConnectError
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
			<div className="max-w-4xl mx-auto px-4 py-12">
				{isLoading ? (
					<div className="text-slate-400 py-16 text-center">
						<div className="inline-block animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent"></div>
						<p className="mt-4">Loading robots...</p>
					</div>
				) : error ? (
					<div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-center">
						Failed to load robots
					</div>
				) : hasRobots ? (
					<div className="space-y-4">
						{robotList.map(
							(robot: { host: string; port: number }, index: number) => (
								<button
									key={`${robot.host}-${robot.port}`}
									type="button"
									onClick={() => setSelectedRobot(robot)}
									className={`w-full text-left border-2 rounded-lg p-6 transition animate-float-in ${
										selectedRobot === robot
											? "border-blue-500 bg-blue-500/20 shadow-lg shadow-blue-500/20"
											: "border-slate-600 bg-slate-700/50 hover:border-blue-500/50"
									}`}
									style={{
										animationDelay: `${index * 100}ms`,
										opacity: 0,
										animationFillMode: "forwards",
									}}
								>
									<h3
										className={`font-semibold text-lg ${
											selectedRobot === robot
												? "text-blue-300"
												: "text-blue-400"
										}`}
									>
										{robot.host}:{robot.port}
									</h3>
									{selectedRobot === robot && (
										<p className="text-sm text-slate-400 mt-1">
											Click "Connect" below to connect to this robot
										</p>
									)}
								</button>
							),
						)}
					</div>
				) : (
					<div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
						<h2 className="text-2xl font-bold mb-6">Add Your First Robot</h2>
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
								{connectMutation.isPending ? "Adding Robot..." : "Add Robot"}
							</button>

							{connectMutation.isError && (
								<div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
									Failed to add robot:{" "}
									{(connectMutation.error as Error).message}
								</div>
							)}
						</div>
					</div>
				)}
			</div>

			{/* Connect Button */}
			<div
				className={`max-w-4xl mx-auto px-4 pb-12 transition-all duration-500 ease-out ${
					selectedRobot
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

			{/* Add Robot Dialog */}
			{isDialogOpen && hasRobots && (
				<>
					{/* Backdrop */}
					<div
						className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
						onClick={() => setIsDialogOpen(false)}
					/>

					{/* Dialog */}
					<div className="fixed inset-0 z-50 flex items-center justify-center p-4">
						<div className="bg-slate-800 border border-slate-700 rounded-lg p-8 max-w-md w-full shadow-2xl">
							<div className="flex justify-between items-center mb-6">
								<h2 className="text-2xl font-bold">Add Robot</h2>
								<button
									onClick={() => setIsDialogOpen(false)}
									type="button"
									className="text-slate-400 hover:text-white transition"
								>
									<svg
										className="w-6 h-6"
										fill="none"
										stroke="currentColor"
										viewBox="0 0 24 24"
									>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											strokeWidth={2}
											d="M6 18L18 6M6 6l12 12"
										/>
									</svg>
								</button>
							</div>

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
									{connectMutation.isPending ? "Adding Robot..." : "Add Robot"}
								</button>

								{connectMutation.isError && (
									<div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-2 rounded-lg text-sm">
										Failed to add robot:{" "}
										{(connectMutation.error as Error).message}
									</div>
								)}
							</div>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
