import { robotConnection } from "@/utils/robot-connection";
import { useWASDController } from "./useWASDController";

export function DPad() {
	function sendStop() {
		robotConnection.sendDiffDrive("stop");
	}

	useWASDController();

	return (
		<section className="bg-slate-800/50 border border-slate-700 rounded-lg p-8">
			<h2 className="text-2xl font-bold mb-6">D-Drive</h2>
			<div className="aspect-square max-w-xs mx-auto grid grid-cols-3 grid-rows-3 gap-2 place-items-center">
				<div />
				<DPadButton label="↑" ariaLabel="Move up" direction="forward" />
				<div />
				<DPadButton label="←" ariaLabel="Move left" direction="left" />
				<button
					type="button"
					className="h-20 w-20 rounded-full bg-slate-700 border border-slate-600 text-slate-200 font-semibold shadow-inner hover:bg-slate-600 transition"
					aria-label="Center"
					onClick={() => sendStop()}
				>
					●
				</button>
				<DPadButton label="→" ariaLabel="Move right" direction="right" />
				<div />
				<DPadButton label="↓" ariaLabel="Move down" direction="backward" />
				<div />
			</div>
		</section>
	);
}

function DPadButton({
	label,
	ariaLabel,
	direction,
}: {
	label: string;
	ariaLabel: string;
	direction: "forward" | "backward" | "left" | "right";
}) {
	function onClick() {
		robotConnection.sendDiffDrive(direction);
	}

	return (
		<button
			type="button"
			aria-label={ariaLabel}
			className="h-20 w-20 rounded-lg bg-slate-700 border border-slate-600 text-2xl text-slate-100 font-semibold shadow hover:bg-slate-600 transition"
			onClick={onClick}
		>
			{label}
		</button>
	);
}
