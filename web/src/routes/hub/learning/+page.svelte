<script lang="ts">
    import { getPublishedLessons } from "$lib/lessons/catalog.js";

    const lessons = getPublishedLessons();

	function formatDifficulty(difficulty: string) {
        return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
</script>

<svelte:head>
	<title>Learning | MORPH</title>
	<meta
		name="description"
		content="View MORPH learning resources and curriculum."
	/>
</svelte:head>

<div class="grid grid-cols-1 p-4 md:grid-cols-2 xl:grid-cols-3 gap-4">
	{#each lessons as lesson}
		<a
			href={`/hub/lesson/${lesson.slug}`}
			class="bg-(--accent-soft) p-5 rounded-2xl flex flex-col gap-3 hover:opacity-90 transition-opacity"
		>
			<div class="flex items-center justify-between gap-3">
				<h2 class="font-semibold text-lg">{lesson.title}</h2>
				<span class="text-xs uppercase tracking-wide px-2 py-1 rounded-full bg-(--surface-solid) text-(--accent)">
					{formatDifficulty(lesson.difficulty)}
				</span>
			</div>
			<p class="text-sm opacity-85">{lesson.description}</p>
			<div class="flex flex-wrap gap-2 text-xs">
				{#if lesson.requiresRobot}
					<span class="px-2 py-1 rounded-full bg-(--surface-soft)">Requires Robot</span>
				{/if}
			</div>
		</a>
	{/each}
</div>