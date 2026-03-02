import { Link } from "@tanstack/react-router";
import { BookOpen, Gamepad2, Home, Joystick, Menu, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useConnectedDevice } from "@/utils/useConnectedDevice";

export default function Header() {
	const [isOpen, setIsOpen] = useState(false);
	const { connectedDevice } = useConnectedDevice();

	const deviceLabel = useMemo(() => {
		return connectedDevice ? connectedDevice.deviceId : "No device connected";
	}, [connectedDevice]);

	return (
		<>
			<header className="relative z-20 mx-4 mt-4 flex items-center rounded-2xl border border-(--line) bg-(--surface) px-4 py-3 text-white shadow-[0_20px_50px_rgba(2,8,18,0.45)] backdrop-blur-md">
				<button
					type="button"
					onClick={() => setIsOpen(true)}
					className="rounded-xl border border-(--line) bg-white/5 p-2 transition-colors hover:bg-white/10"
					aria-label="Open menu"
				>
					<Menu size={24} />
				</button>
				<h1 className="ml-4 text-xl font-semibold tracking-wide">
					<Link to="/">
						<img
							src="/morph-word-logo-white.png"
							alt="MORPH Logo"
							className="h-9"
						/>
					</Link>
				</h1>
				<div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 group">
					<div className="cursor-default rounded-xl border border-(--line) bg-white/5 px-4 py-2 text-sm font-medium text-(--ink-0)">
						{deviceLabel}
					</div>
					<div className="pointer-events-none absolute left-1/2 top-full w-48 -translate-x-1/2 rounded-xl border border-(--line) bg-(--surface) p-1 opacity-0 shadow-xl backdrop-blur-md transition-opacity group-hover:pointer-events-auto group-hover:opacity-100">
						<Link
							to="/devices"
							className="block w-full rounded-lg px-3 py-2 text-left text-sm text-(--ink-0) transition-colors hover:bg-white/10"
						>
							Show device list
						</Link>
						<Link
							to="/control-panel"
							className="block w-full rounded-lg px-3 py-2 text-left text-sm text-(--ink-0) transition-colors hover:bg-white/10"
						>
							Open control panel
						</Link>
					</div>
				</div>
				<Link
					to="/control-panel"
					className="ml-auto inline-flex items-center gap-2 rounded-xl border border-(--line) bg-[rgba(36,199,184,0.14)] px-3 py-2 text-sm font-medium text-(--ink-0) transition-colors hover:bg-[rgba(36,199,184,0.24)]"
				>
					<Joystick size={16} />
					<span>Control Panel</span>
				</Link>
			</header>

			<aside
				className={`fixed left-0 top-0 z-50 flex h-full w-80 flex-col border-r border-(--line) bg-[rgba(6,12,22,0.96)] text-white shadow-2xl transition-transform duration-300 ease-in-out ${
					isOpen ? "translate-x-0" : "-translate-x-full"
				}`}
			>
				<div className="flex items-center justify-between border-b border-(--line) p-4">
					<h2 className="text-xl font-bold">Navigation</h2>
					<button
						type="button"
						onClick={() => setIsOpen(false)}
						className="rounded-lg p-2 transition-colors hover:bg-white/10"
						aria-label="Close menu"
					>
						<X size={24} />
					</button>
				</div>

				<nav className="flex-1 p-4 overflow-y-auto">
					<Link
						to="/"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/10"
						activeProps={{
							className:
								"mb-2 flex items-center gap-3 rounded-lg border border-transparent bg-(--brand-soft) p-3 text-white transition-colors hover:bg-(--brand)",
						}}
					>
						<Home size={20} />
						<span className="font-medium">Home</span>
					</Link>

					<Link
						to="/control-panel"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/10"
						activeProps={{
							className:
								"mb-2 flex items-center gap-3 rounded-lg border border-transparent bg-(--brand-soft) p-3 text-white transition-colors hover:bg-(--brand)",
						}}
					>
						<Gamepad2 size={20} />
						<span className="font-medium">Control Panel</span>
					</Link>

					<Link
						to="/lesson"
						onClick={() => setIsOpen(false)}
						className="mb-2 flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-white/10"
						activeProps={{
							className:
								"mb-2 flex items-center gap-3 rounded-lg border border-transparent bg-(--brand-soft) p-3 text-white transition-colors hover:bg-(--brand)",
						}}
					>
						<BookOpen size={20} />
						<span className="font-medium">Lesson</span>
					</Link>
				</nav>
			</aside>
		</>
	);
}
