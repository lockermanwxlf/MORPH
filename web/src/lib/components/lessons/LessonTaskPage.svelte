<script lang="ts">
	import type { LessonTaskContent } from "$lib/lessons/driving/types.js";

	type Props = {
		content: LessonTaskContent;
	};

	let { content }: Props = $props();
</script>

<div class="mx-auto w-full max-w-4xl p-4 sm:p-6">
	<article class="rounded-2xl border border-(--border-soft) bg-(--surface) p-5 sm:p-7 space-y-8">
		<header class="space-y-3">
			{#if content.badge}
				<p class="text-sm font-medium opacity-70">{content.badge}</p>
			{/if}
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">{content.title}</h1>
			{#if content.description}
				<p class="opacity-90">{content.description}</p>
			{/if}
		</header>

		{#each content.sections ?? [] as section}
			<section class="space-y-3">
				{#if section.title}
					<h2 class="text-xl font-semibold">{section.title}</h2>
				{/if}

				<div class="rounded-xl bg-(--surface-soft) p-4 space-y-2">
					{#each section.paragraphs ?? [] as paragraph}
						<p class="opacity-90">{paragraph}</p>
					{/each}

					{#if section.bullets?.length}
						<ul class="list-disc pl-6 space-y-1 opacity-90">
							{#each section.bullets as bullet}
								<li>{bullet}</li>
							{/each}
						</ul>
					{/if}
				</div>
			</section>
		{/each}

		{#if content.leftNav || content.rightNav}
			<nav class="pt-2 flex items-center justify-between gap-3">
				{#if content.leftNav}
					<a
						href={content.leftNav.href}
						class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border border-(--border-soft) hover:opacity-90"
					>
						{content.leftNav.label}
					</a>
				{:else}
					<div></div>
				{/if}

				{#if content.rightNav}
					{#if content.rightNav.variant === "primary"}
						<a
							href={content.rightNav.href}
							class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
							style:background="var(--accent)"
							style:color="var(--surface-solid)"
						>
							{content.rightNav.label}
						</a>
					{:else}
						<a
							href={content.rightNav.href}
							class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border border-(--border-soft) hover:opacity-90"
						>
							{content.rightNav.label}
						</a>
					{/if}
				{/if}
			</nav>
		{/if}
	</article>
</div>
