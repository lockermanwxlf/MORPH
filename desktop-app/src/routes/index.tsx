import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<section className="mx-auto flex w-full flex-1 flex-col rounded-2xl border border-[var(--line)] bg-[var(--surface)] shadow-[0_18px_40px_rgba(2,8,18,0.35)] backdrop-blur-md">
				<div className="flex flex-1 flex-col gap-3">
					<Link
						to="/lesson"
						className="flex flex-1 items-center justify-center rounded-xl bg-[rgba(10,18,31,0.35)] text-3xl font-semibold tracking-tight text-[var(--ink-0)] transition-colors hover:bg-[rgba(36,199,184,0.14)]"
					>
						Lessons
					</Link>
					<Link
						to="/control-panel"
						className="flex flex-1 items-center justify-center rounded-xl bg-[rgba(10,18,31,0.48)] text-3xl font-semibold tracking-tight text-[var(--ink-0)] transition-colors hover:bg-[rgba(36,199,184,0.22)]"
					>
						Control Panel
					</Link>
				</div>
			</section>
		</div>
	);
}
