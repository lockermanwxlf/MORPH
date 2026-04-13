<script lang="ts">
    import WASDController from '$lib/components/WASDController.svelte';
    import { getRobotConnectionContext } from '$lib/robot-connection.svelte.js';

    let page = $state(0);
    const movementQuestions = [
        {
            key: 'w',
            prompt: 'What direction does your robot move when you hold W?',
            options: ['Forward', 'Backward'],
            correct: 'Forward'
        },
        {
            key: 's',
            prompt: 'What direction does your robot move when you hold S?',
            options: ['Forward', 'Backward'],
            correct: 'Backward'
        },
        {
            key: 'd',
            prompt: 'Which way does your robot turn when you hold D?',
            options: ['Right', 'Left'],
            correct: 'Right'
        },
        {
            key: 'a',
            prompt: 'Which way does your robot turn when you hold A?',
            options: ['Left', 'Right'],
            correct: 'Left'
        }
    ];
    let selectedAnswers = $state<Record<string, string>>({});
    const canProceedByPage = [
        () => true,
        () => movementQuestions.every((question) => selectedAnswers[question.key] === question.correct)
    ];
    const pages = [
        page1,
        page2,
        page3
    ];
    const robotConnection = getRobotConnectionContext();
    const nextBlocked = $derived(!canProceedByPage[page]());
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
    {@const page2CanProceed = canProceedByPage[1]()}
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
    <div class="mt-8 space-y-4">
        {#each movementQuestions as question}
            <div class="question-card">
                <p class="question-prompt">{question.prompt}</p>
                <div class="answer-row">
                    {#each question.options as option}
                        <button
                            class:selected-correct={selectedAnswers[question.key] === option && option === question.correct}
                            class:selected-wrong={selectedAnswers[question.key] === option && option !== question.correct}
                            class="answer-button"
                            onclick={() => selectedAnswers[question.key] = option}
                        >
                            {option}
                        </button>
                    {/each}
                </div>
                {#if selectedAnswers[question.key] === question.correct}
                    <p class="correct-indicator">Correct!</p>
                {/if}
            </div>
        {/each}
    </div>
    {#if !page2CanProceed}
        <p class="question-hint">Answer all four correctly to continue.</p>
    {/if}
    
{/snippet}

{#snippet page3()}
    
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
            {#if page + 1 !== pages.length}
                <button
                    disabled={nextBlocked}
                    onclick={() => page++}
                    class="px-4 py-2 rounded-lg font-medium transition-transform duration-150 hover:not-disabled:scale-105 active:not-disabled:scale-95"
                    class:opacity-50={nextBlocked}
                    class:cursor-not-allowed={nextBlocked}
                    class:scale-100={nextBlocked}
                    style:background="var(--accent)"
                    style:color="var(--surface-solid)"
                >
                    Next
                </button>
            {/if}
        </div>
    </div>
</div>

<style>
	h1 {
		font-weight: bold;
		font-size: 1.5rem;
	}

    .question-card {
        display: flex;
        flex-direction: column;
        gap: 0.75rem;
        padding: 1rem;
        border-radius: 1rem;
        background: color-mix(in srgb, var(--surface-soft) 88%, white 12%);
    }

    .question-prompt {
        font-weight: 600;
    }

    .correct-indicator {
        font-size: 0.95rem;
        font-weight: 700;
        color: color-mix(in srgb, var(--accent) 82%, black 18%);
    }

    .question-hint {
        font-weight: 600;
    }

    .answer-row {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
    }

    .answer-button {
        padding: 0.9rem 1rem;
        border: none;
        border-radius: 0.9rem;
        background: var(--surface-solid);
        color: var(--text);
        font-weight: 600;
        cursor: pointer;
        transition:
            transform 150ms ease,
            box-shadow 150ms ease,
            background 150ms ease;
    }

    .answer-button:hover {
        transform: translateY(-1px);
    }

    .selected-correct {
        background: color-mix(in srgb, var(--accent) 22%, var(--surface-solid));
        box-shadow: 0 0 0 2px color-mix(in srgb, var(--accent) 70%, white 30%), 0 0 18px color-mix(in srgb, var(--accent) 35%, transparent);
    }

    .selected-wrong {
        background: color-mix(in srgb, #ef4444 18%, var(--surface-solid));
        box-shadow: 0 0 0 2px color-mix(in srgb, #ef4444 70%, white 30%);
    }
</style>
