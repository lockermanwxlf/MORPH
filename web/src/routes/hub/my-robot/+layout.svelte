<script lang="ts">
    import { getRobotConnectionContext } from "$lib/robot-connection.svelte.js";

    const { children } = $props();
    const robotConnection = getRobotConnectionContext();
</script>

<div class="flex flex-col flex-1">
    {#if robotConnection.status === "connected"}
        <header class="flex flex-row items-center gap-5 px-5 py-4 border-b" style:border-color="var(--border-soft)">
            <span>
                Connected to: {robotConnection.host}
            </span>

            <button
                type="button"
                class="rounded-2xl px-4 py-3 text-sm font-semibold"
                style:background="var(--accent)"
                style:color="var(--page-bg)"
                onclick={() => robotConnection.disconnect()}
            >
                Disconnect
            </button>
        </header>
    {/if}
    <main class="overflow-y-auto content flex-1">
        {@render children()}
    </main>
</div>
