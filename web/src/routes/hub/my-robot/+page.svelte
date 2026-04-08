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
	<div class="p-6">
		<div class="grid grid-cols-3 grid-rows-3">
			<div class="flex flex-col gap-2 items-center">
				<div class="p-6 rounded-2xl bg-(--accent-soft) col-span-1">
					<LidarView />
				</div>
				<div class="p-6 rounded-2xl bg-(--accent-soft) w-full flex justify-center col-span-1">
					<WASDController />
				</div>
			</div>
		</div>
	</div>
{/if}
