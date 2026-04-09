<script lang="ts">
    import WASDController from '$lib/components/WASDController.svelte';
    import { getRobotConnectionContext } from '$lib/robot-connection.svelte.js';

    let page = $state(0);
    const pages = [
        page1,
        page2
    ];
    const robotConnection = getRobotConnectionContext()
</script>

{#snippet page1()}
            <h1 class="font-semibold text-2xl">Lesson 1: Learning to Drive</h1>
            <p class="mt-4">
                By the end of this lesson, you should be able to:
            </p>

            <ul class="list-disc list-inside">
                <li>Drive the robot using the W, A, S, D keys,</li>
                <li>
                    Explain how rotating the wheels in different combinations
                    leads to movement in the robot,
                </li>
                <li>Understand how speeds are communicated to the robot.</li>
            </ul>
{/snippet}

{#snippet page2()}
    <h1>
        Getting Familiar
    </h1>

    <p class="mt-4">
        Right now, you're connected to the robot at: {robotConnection.host}.
    </p>
    <p class="mt-4">
        Below is a WASD controller. Pressing down on any of those keys on
        your keyboard will send a movement command to the robot.
    </p>
    <div class="p-2 bg-(--surface-soft) w-min">
    <WASDController />
    </div>
    <p class="mt-8">
        Try different keys at a time, and see if you can move your robot
        throughout your room.
    </p>
    
{/snippet}

<div class="flex-1 w-auto flex justify-center items-center">
    <div
        class="m-5 bg-(--accent-soft) flex flex-col rounded-2xl p-6 transition-all min-h-80 min-w-160"
    >
        <div class="flex-1">
            {@render pages[page]()}
        </div>
        <div class="flex flex-row justify-between mt-20 gap-4">
            <button
                disabled={page === 0}
                onclick={() => page--}
                class="px-4 py-2 rounded-lg font-medium transition-transform duration-150 disabled:invisible hover:not-disabled:scale-105 active:not-disabled:scale-95"
                style:background="var(--accent)"
                style:color="var(--surface-solid)"
            >
                Previous
            </button>
            <button
                disabled={page + 1 === pages.length}
                onclick={() => page++}
                class="px-4 py-2 rounded-lg font-medium transition-transform duration-150 disabled:invisible hover:not-disabled:scale-105 active:not-disabled:scale-95"
                style:background="var(--accent)"
                style:color="var(--surface-solid)"
            >
                Next
            </button>
        </div>
    </div>
</div>

<style>
	h1 {
		font-weight: bold;
		font-size: 1.5rem;
	}
</style>