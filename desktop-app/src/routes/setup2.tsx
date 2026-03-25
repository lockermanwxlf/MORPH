import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/setup2")({
	component: SetupNextPage,
});

function SetupNextPage() {
	return (
		<div className="flex w-full flex-1 items-center justify-center px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<div className="rounded-xl border border-(--line) bg-(--surface) px-6 py-10 text-(--ink-0)">
				Setup step 2 placeholder
			</div>
		</div>
	)
}
