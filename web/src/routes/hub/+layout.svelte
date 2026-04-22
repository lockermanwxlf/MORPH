<script lang="ts">
	import { page } from "$app/state";
	import { getLessonMetaBySlug } from "$lib/lessons/catalog.js";
    import { robotConnection, setRobotConnectionContext } from "$lib/robot-connection.svelte.js";

	type LayoutData = {
		user: {
			email: string | null;
			gradeLevel: string | null;
		};
	};

	const { children, data } = $props<{ children: any; data: LayoutData }>();
	const routes = [
		{ name: "Home", href: "/hub/home" },
		{ name: "My Robot", href: "/hub/my-robot" },
		{ name: "Learning", href: "/hub/learning" },
		{ name: "Profile", href: "/hub/profile" },
	];

	const lessonName = $derived.by(() => {
		const pathParts = page.url.pathname.split("/").filter(Boolean);
		const lessonSlug =
			pathParts[0] === "hub" && pathParts[1] === "lesson"
				? pathParts[2] ?? null
				: null;
		if (!lessonSlug) return null;
		const definition = getLessonMetaBySlug(lessonSlug);
		return definition ? definition.title : null;
	})
	
	setRobotConnectionContext(robotConnection);
</script>

<svelte:head>
	<title>Hub | MORPH</title>
	<meta
		name="description"
		content="Connect to a MORPH device from the Control Hub."
	/>
</svelte:head>

<div class="flex h-screen w-full bg-(--surface-soft)">
	<aside
		class="flex flex-col items-center-safe w-64 border-r p-4 overflow-y-auto sidebar rounded-r-4xl"
	>
		<a
			href="/"
			class="px-4 py-3 border border-(--border-soft) rounded-full w-full"
			style:background="linear-gradient(135deg, #0f766e 0%, #123b52 100%)"
			style:box-shadow="0 10px 24px var(--panel-shadow)"
		>
			<img
				src="/morph-word-logo-white.png"
				alt="MORPH"
				class="h-6 w-auto sm:h-7"
			/>
		</a>
		<div class="mt-10 flex flex-col gap-4 w-full">
			{#each routes as route}
				<a
					href={route.href}
					class="flex items-center gap-3 rounded-full px-4 py-2 text-sm font-medium transition-all duration-300"
					class:active={page.url.pathname === route.href}
					style:color="var(--accent)">{route.name}</a
				>
			{/each}
		</div>
	</aside>
	<div class="flex flex-col flex-1">
		<header
			class="flex items-center justify-end px-4 border-(--border-soft) border-b min-h-16 w-full"
		>
			{#if lessonName}
				<h1 class="text-lg font-bold">{lessonName}</h1>
				<div class="flex-1"></div>
			{/if}
			<div class="flex gap-6 me-6 items-center">
				{#if data.user.email}
					<span class="text-sm opacity-75">{data.user.email}</span>
					<form method="POST" action="/logout">
						<button type="submit" class="text-sm font-medium hover:underline">
							Sign out
						</button>
					</form>
				{:else}
					<a href="/login" class="text-sm font-medium hover:underline">Sign in</a>
					<a href="/register" class="text-sm font-medium hover:underline">Register</a>
				{/if}
			</div>
		</header>
		<main class="flex-1 overflow-y-auto rounded-r-2xl content flex flex-col">
			{@render children()}
		</main>
	</div>
</div>

<style>
	.sidebar {
		background-color: var(--surface-solid);
		border-color: var(--border-soft);
		color: var(--page-text);
	}

	.content {
		background-color: var(--surface-soft);
		color: var(--page-text);
	}

	:global(a.active) {
		background-color: var(--accent) !important;
		color: var(--surface-solid) !important;
	}
</style>
