<script lang="ts">
	import { goto } from "$app/navigation";
	import ConnectView from "$lib/components/ConnectView.svelte";
	import LidarView from "$lib/components/LidarView.svelte";
	import WASDController from "$lib/components/WASDController.svelte";
	import { getRobotConnectionContext } from "$lib/robot-connection.svelte";

	const robotConnection = getRobotConnectionContext();

	function disconnect() {
		robotConnection.disconnect();
	}
</script>

<svelte:head>
	<title>Live Control Hub | MORPH</title>
	<meta
		name="description"
		content="Live MORPH robot connection status and available robot topics."
	/>
</svelte:head>

{#if robotConnection.status == "disconnected" || robotConnection.status == "idle"}
	<ConnectView />
{:else}
	<div class="min-h-dvh px-6 py-6 sm:px-10 sm:py-8 lg:px-16 lg:py-10">
		<div class="mx-auto flex w-full max-w-6xl flex-col gap-6">
			<section
				class="rounded-4xl border p-6 sm:p-8"
				style:border-color="var(--border-soft)"
				style:background="var(--surface-solid)"
			>
				<div
					class="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"
				>
					<div>
						<p
							class="text-sm font-semibold uppercase tracking-[0.24em]"
							style:color="var(--accent)"
						>
							Live Session
						</p>
						<h1
							class="mt-3 text-4xl font-semibold tracking-[-0.04em]"
						>
							Robot Connected
						</h1>
						<p
							class="mt-3 max-w-2xl text-base leading-7"
							style:color="var(--muted-text)"
						>
							The Foxglove connection is active. This session can
							now own map, odometry, scan, and control state from
							the robot.
						</p>
					</div>

					<div class="flex gap-3">
						<a
							href="/hub"
							class="rounded-2xl px-4 py-3 text-sm font-medium"
							style:background="var(--surface-soft)"
						>
							Connection Setup
						</a>
						<button
							type="button"
							class="rounded-2xl px-4 py-3 text-sm font-semibold"
							style:background="var(--accent)"
							style:color="var(--page-bg)"
							onclick={disconnect}
						>
							Disconnect
						</button>
					</div>
				</div>
			</section>

			<section class="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
				<div
					class="rounded-4xl border p-6 sm:p-8"
					style:border-color="var(--border-soft)"
					style:background="var(--surface-solid)"
				>
					<h2 class="text-2xl font-semibold">Connection State</h2>
					<div class="mt-5 grid gap-4 sm:grid-cols-2">
						<div
							class="rounded-3xl border px-4 py-4"
							style:border-color="var(--border-soft)"
							style:background="var(--surface-soft)"
						>
							<div
								class="text-xs font-semibold uppercase tracking-[0.2em]"
								style:color="var(--muted-text)"
							>
								Status
							</div>
							<div class="mt-2 text-lg font-semibold">
								{robotConnection.status}
							</div>
						</div>
						<div
							class="rounded-3xl border px-4 py-4"
							style:border-color="var(--border-soft)"
							style:background="var(--surface-soft)"
						>
							<div
								class="text-xs font-semibold uppercase tracking-[0.2em]"
								style:color="var(--muted-text)"
							>
								Host
							</div>
							<div class="mt-2 break-all text-lg font-semibold">
								{robotConnection.lastConnectedHost}
							</div>
						</div>
					</div>
				</div>

				<div
					class="rounded-4xl border p-6 sm:p-8"
					style:border-color="var(--border-soft)"
					style:background="var(--surface-solid)"
				>
					<h2 class="text-2xl font-semibold">Capabilities</h2>
					<p
						class="mt-3 text-sm leading-6"
						style:color="var(--muted-text)"
					>
						These are the topics the bridge has advertised so far.
						This is the right place to gate the rest of the app
						before enabling map, teleop, and diagnostics.
					</p>

					{#if robotConnection.advertisedTopics.length > 0}
						<div class="mt-5 flex flex-wrap gap-2">
							{#each robotConnection.advertisedTopics as topic}
								<span
									class="rounded-full border px-3 py-2 text-sm font-medium"
									style:border-color="var(--border-soft)"
									style:background="var(--accent-soft)"
									style:color="var(--accent)"
								>
									{topic}
								</span>
							{/each}
						</div>
					{:else}
						<div
							class="mt-5 rounded-3xl border border-dashed px-4 py-5 text-sm"
							style:border-color="var(--border-soft)"
							style:color="var(--muted-text)"
						>
							Waiting for the bridge to advertise channels.
						</div>
					{/if}
				</div>
			</section>
			<LidarView />
			<WASDController />
		</div>
	</div>
{/if}
