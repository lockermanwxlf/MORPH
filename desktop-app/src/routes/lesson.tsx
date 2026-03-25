import { createFileRoute } from "@tanstack/react-router";
import { DPad } from "@/components/DPad";
import { useSocket } from "@/utils/SocketContext";

export const Route = createFileRoute("/lesson")({
	component: RouteComponent,
});

function RouteComponent() {
	const { socket } = useSocket();

	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<section className="mx-auto w-full max-w-5xl rounded-2xl border border-(--line) bg-(--surface) p-6 shadow-[0_18px_40px_rgba(2,8,18,0.35)] backdrop-blur-md">
				<header className="mb-8">
					<h1 className="text-2xl font-semibold tracking-tight">
						Lesson 1: Learning How to Drive
					</h1>
					<p className="mt-2 text-sm text-(--ink-1)">
						Use the on-screen pad or W/A/S/D keys to control movement.
					</p>
				</header>

				<div className="space-y-8">
					<section className="space-y-3">
						<h2 className="text-xl font-semibold">Task 1: Test Drive</h2>
						<p className="text-sm text-(--ink-1)">
							The D-pad controls forward, backward, and turning. Press a button
							or keyboard key to send a movement command.
						</p>
						<DPad socket={socket} enabled={true} />
					</section>

					<section className="space-y-3">
						<h2 className="text-xl font-semibold">
							Task 2: Observe Wheel Motion
						</h2>
						<p className="text-sm text-(--ink-1)">
							Watch the wheels while driving and compare left/right behavior for
							turning versus moving straight.
						</p>
						<ul className="list-disc space-y-2 pl-5 text-sm text-(--ink-1)">
							<li>Forward: both wheels spin forward at similar speed.</li>
							<li>Backward: both wheels spin backward at similar speed.</li>
							<li>Turns: each side moves differently to rotate the robot.</li>
						</ul>
					</section>
				</div>
			</section>
		</div>
	)
}
