import { Link } from "@tanstack/react-router";

const baseLinkClass =
	"rounded-xl border border-transparent px-4 py-3 text-sm font-medium text-(--ink-0) transition-colors hover:bg-(--brand-soft)";
const activeLinkClass =
	"rounded-xl border border-(--line) bg-(--brand-soft) px-4 py-3 text-sm font-medium text-(--ink-0)";

export default function Sidebar() {
	return (
		<aside className="flex w-64 shrink-0 flex-col border-r border-(--line) bg-(--surface) p-4 text-(--ink-0) shadow-[0_18px_36px_var(--shadow-0)] backdrop-blur-md">
			<h1 className="mb-6 px-2 pt-1 text-lg font-semibold tracking-wide text-(--ink-0)">
				Navigation
			</h1>
			<nav className="flex flex-col gap-2">
				<Link to="/" className={baseLinkClass} activeProps={{ className: activeLinkClass }}>
					Home
				</Link>
				<Link
					to="/devices"
					className={baseLinkClass}
					activeProps={{ className: activeLinkClass }}
				>
					Devices
				</Link>
				<Link
					to="/lesson"
					className={baseLinkClass}
					activeProps={{ className: activeLinkClass }}
				>
					Learn
				</Link>
			</nav>
		</aside>
	);
}
