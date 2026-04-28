<script lang="ts">
	import { getRobotConnectionContext } from "$lib/robot-connection.svelte.js";

	type PageData = {
		lessons: {
			completedCount: number;
			totalCount: number;
		};
	};

	const { data } = $props<{ data: PageData }>();
	const robotConnection = getRobotConnectionContext();

	const isConnected = $derived(robotConnection.status === "connected");
	const host = $derived(robotConnection.host || robotConnection.lastConnectedHost || "—");
</script>

<svelte:head>
	<title>Home | MORPH</title>
	<meta
		name="description"
		content="Welcome to the MORPH Control Hub!"
	/>
</svelte:head>

<div class="p-6 grid gap-6 md:grid-cols-2">
	<section class="rounded-2xl border p-5 flex flex-col h-full" style:border-color="var(--border-soft)">
		<h2 class="text-xl font-semibold mb-2">Robot connection</h2>
		<p class="text-sm opacity-75 mb-4">Connection status and active host.</p>

		<div class="space-y-2 mb-5">
			<p>
				<span class="font-medium">Status:</span>
				<span class:font-semibold={isConnected}>
					{isConnected ? "Connected" : "Not connected"}
				</span>
			</p>
			<p>
				<span class="font-medium">Host:</span>
				<span>{isConnected ? host : "—"}</span>
			</p>
		</div>

		<a
			href="/hub/my-robot"
			class="inline-block mt-auto font-bold py-2 px-4 rounded transition-transform duration-150 hover:scale-101 active:scale-95"
			style:background="var(--accent)"
			style:color="var(--surface-solid)"
		>
			{isConnected ? "View Robot" : "Connect"}
		</a>
	</section>

	<section class="rounded-2xl border p-5 flex flex-col h-full" style:border-color="var(--border-soft)">
		<h2 class="text-xl font-semibold mb-2">Lessons</h2>
		<p class="text-sm opacity-75 mb-4">Track your lesson completion progress.</p>

		<p class="text-lg mb-5">
			<span class="font-semibold">{data.lessons.completedCount}</span>
			of
			<span class="font-semibold">{data.lessons.totalCount}</span>
			completed
		</p>

		<a
			href="/hub/learning"
			class="inline-block mt-auto font-bold py-2 px-4 rounded transition-transform duration-150 hover:scale-101 active:scale-95"
			style:background="var(--accent)"
			style:color="var(--surface-solid)"
		>
			View lessons
		</a>
	</section>
</div>