import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { SetupGradeLevel } from "../../shared/ipc-types";
import { requireSetupAPI } from "../utils/preload-apis";

export const Route = createFileRoute("/setup")({
	component: SetupWelcomePage,
});

const GRADE_LEVELS: SetupGradeLevel[] = ["K-8", "High School", "College"];

function SetupWelcomePage() {
	const navigate = useNavigate();
	const [isSaving, setIsSaving] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const selectGradeLevel = async (gradeLevel: SetupGradeLevel) => {
		setIsSaving(true);
		setError(null);

		try {
			await requireSetupAPI().saveProfile(gradeLevel);
			navigate({ to: "/setup2" });
		} catch (saveError) {
			console.error("Failed to save setup profile:", saveError);
			setError("We couldn't save your grade level. Please try again.");
		} finally {
			setIsSaving(false);
		}
	}

	return (
		<div className="flex w-full flex-1 items-center justify-center px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<section className="w-full max-w-xl rounded-2xl border border-(--line) bg-(--surface) p-6 shadow-[0_18px_40px_rgba(2,8,18,0.35)] sm:p-8">
				<p className="text-sm uppercase tracking-[0.24em] text-white/60">Welcome</p>
				<h2 className="mt-3 text-3xl font-semibold tracking-tight text-(--ink-0)">
					What grade level are you in?
				</h2>
				<div className="mt-6 grid gap-3">
					{GRADE_LEVELS.map((gradeLevel) => (
						<button
							key={gradeLevel}
							type="button"
							className="rounded-xl border border-(--line) bg-white/5 px-4 py-3 text-left text-lg font-medium text-(--ink-0) transition-colors hover:bg-[rgba(36,199,184,0.18)] disabled:cursor-not-allowed disabled:opacity-60"
							onClick={() => selectGradeLevel(gradeLevel)}
							disabled={isSaving}
						>
							{gradeLevel}
						</button>
					))}
				</div>
				{error ? <p className="mt-4 text-sm text-red-300">{error}</p> : null}
			</section>
		</div>
	)
}
