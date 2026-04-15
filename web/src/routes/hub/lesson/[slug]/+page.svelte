<script lang="ts">
    import ConnectView from "$lib/components/ConnectView.svelte";
    import { loadLessonComponentBySlug } from "$lib/lessons/registry.js";
    import { getRobotConnectionContext } from "$lib/robot-connection.svelte";

    let { data } = $props();
    const robotConnection = getRobotConnectionContext();

    let LessonComponent = $state<any | null>(null);
    let errorMsg = $state<string | null>(null);
    let isLoading = $state(true);
    let proceedWithoutRobot = $state(false);

    const needsRobotGate = $derived(
        data.lesson.requiresRobot
            && !proceedWithoutRobot
            && robotConnection.status !== "connected",
    );

    $effect(() => {
        isLoading = true;
        errorMsg = null;
        LessonComponent = null;

        loadLessonComponentBySlug(data.slug)
            .then((result) => {
                if (!result) {
                    errorMsg = "Lesson not found.";
                    return;
                }

                LessonComponent = result.component;
            })
            .catch(() => {
                errorMsg = "Unable to load this lesson right now.";
            })
            .finally(() => {
                isLoading = false;
            });
    });
</script>

<svelte:head>
    <title>{data.lesson.title} | MORPH</title>
</svelte:head>

{#if needsRobotGate}
    <div class="flex-1 flex flex-col">
        <ConnectView
            showProceedWithoutRobot
            onProceedWithoutRobot={() => proceedWithoutRobot = true}
        />
    </div>
{:else if LessonComponent}
    <div class="flex-1 flex flex-col">
    <LessonComponent />
    </div>
{:else if errorMsg}
    <div class="p-6">
        <p>{errorMsg}</p>
    </div>
{:else if isLoading}
    <div class="p-6">
        <p>Loading lesson...</p>
    </div>
{:else}
    <div class="p-6">
        <p>Loading lesson...</p>
    </div>
{/if}
