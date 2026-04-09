<script lang="ts">
    import { page } from "$app/state";

    let LessonComponent = $state<any>(null);
    let errorMsg = $state<string | null>(null);

    $effect(() => {
        const slug = page.params.slug;
        import(`$lib/lessons/${slug}.svelte`)
            .then((module) => {
                LessonComponent = module.default;
            })
            .catch((error) => {
                console.error(
                    `Failed to load component for slug: ${slug}`,
                    error,
                );
                errorMsg = error
                LessonComponent = null;
            });
    });
</script>

{#if LessonComponent}
    <div class="flex-1 flex flex-col">
    <LessonComponent />
    </div>
{:else if errorMsg}
    <p>{errorMsg}</p>
{:else}
    <p>Loading lesson...</p>
{/if}
