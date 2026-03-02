import type { Socket } from "socket.io-client";
import { useWASDController } from "./useWASDController";

interface DPadProps {
	socket: Socket | null;
	enabled?: boolean;
}

export function DPad({ socket, enabled = true }: DPadProps) {
	useWASDController({ enabled });

	const isDisabled = !enabled || !socket;

	return (
		<section className="rounded-xl border border-(--line) bg-black/20 p-6">
			<div className="mb-4 flex items-end justify-between">
				<div>
					<h2 className="text-xl font-semibold tracking-tight">Drive Pad</h2>
					<p className="mt-1 text-xs text-(--ink-1)">
						Use buttons or keyboard controls (W/A/S/D)
					</p>
				</div>
				<span className="rounded-full border border-(--line) bg-white/5 px-2 py-1 text-[11px] font-medium text-(--ink-1)">
					{isDisabled ? "Idle" : "Live"}
				</span>
			</div>

			<div className="mx-auto grid aspect-square w-full max-w-68 grid-cols-3 grid-rows-3 place-items-center gap-2">
				<div />
				<DPadButton
					label="↑"
					ariaLabel="Move forward"
					direction="forward"
					socket={socket}
					disabled={isDisabled}
				/>
				<div />
				<DPadButton
					label="←"
					ariaLabel="Turn left"
					direction="left"
					socket={socket}
					disabled={isDisabled}
				/>
				<button
					type="button"
					className="h-16 w-16 rounded-full border border-(--line) bg-white/8 text-lg font-semibold text-(--ink-0) transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
					aria-label="Stop"
					disabled={isDisabled}
					onClick={() => {
						if (!socket) {
							return;
						}
					}}
				>
					Stop
				</button>
				<DPadButton
					label="→"
					ariaLabel="Turn right"
					direction="right"
					socket={socket}
					disabled={isDisabled}
				/>
				<div />
				<DPadButton
					label="↓"
					ariaLabel="Move backward"
					direction="backward"
					socket={socket}
					disabled={isDisabled}
				/>
				<div />
			</div>
		</section>
	);
}

function DPadButton({
	label,
	ariaLabel,
	direction: _direction,
	socket,
	disabled,
}: {
	label: string;
	ariaLabel: string;
	direction: "forward" | "backward" | "left" | "right";
	socket: Socket | null;
	disabled: boolean;
}) {
	return (
		<button
			type="button"
			aria-label={ariaLabel}
			disabled={disabled}
			className="h-16 w-16 rounded-xl border border-(--line) bg-white/8 text-2xl text-(--ink-0) font-semibold shadow-[0_8px_20px_rgba(2,8,18,0.2)] transition-colors hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
			onClick={() => {
				if (!socket) {
					return;
				}
			}}
		>
			{label}
		</button>
	);
}
