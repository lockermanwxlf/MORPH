<script lang="ts">
	import RobotConnectionDialog from "$lib/components/RobotConnectionDialog.svelte";
	import WASDController from "$lib/components/WASDController.svelte";
	import { getRobotConnectionContext } from "$lib/robot-connection.svelte";
	import { fly } from "svelte/transition";

	type DirectionAnswer = "forward" | "backward";
	type RotationAnswer = "left" | "right";
	type QuestionAnswer = DirectionAnswer | RotationAnswer;

	type Question = {
		key: "w" | "a" | "s" | "d";
		prompt: string;
		options: QuestionAnswer[];
		correct: QuestionAnswer;
	};

	type Props = {
		badge: string;
		title?: string;
		description?: string;
		backHref: string;
		nextPageHref: string;
		nextPageName: string;
		questions?: Question[];
	};

	let {
		badge,
		title = "Try it out",
		description = "Drive and answer what each key does.",
		backHref,
		nextPageHref,
		nextPageName,
		questions = [
			{
				key: "w",
				prompt: "Which direction does your robot move when you hold W?",
				options: ["forward", "backward"],
				correct: "forward",
			},
			{
				key: "a",
				prompt: "Which way does your robot rotate when you hold A?",
				options: ["left", "right"],
				correct: "left",
			},
			{
				key: "s",
				prompt: "Which direction does your robot move when you hold S?",
				options: ["forward", "backward"],
				correct: "backward",
			},
			{
				key: "d",
				prompt: "Which way does your robot rotate when you hold D?",
				options: ["left", "right"],
				correct: "right",
			},
		],
	}: Props = $props();

	const robotConnection = getRobotConnectionContext();

	let isConnectionDialogOpen = $state(false);
	let answers = $state<Partial<Record<Question["key"], QuestionAnswer>>>({});
	let currentQuestionIndex = $state(0);
	let selectedOption = $state<QuestionAnswer | null>(null);
	let feedbackStatus = $state<"correct" | "wrong" | null>(null);
	let isAnswerLocked = $state(false);
	let feedbackTimer = $state<ReturnType<typeof setTimeout> | null>(null);

	const isConnected = $derived(robotConnection.status === "connected");
	const allAnswered = $derived(currentQuestionIndex >= questions.length);
	const currentQuestion = $derived(questions[currentQuestionIndex]);
	const correctCount = $derived(
		questions.reduce((count, q) => {
			if (answers[q.key] === q.correct) {
				return count + 1;
			}
			return count;
		}, 0),
	);

	function answerCurrentQuestion(answer: QuestionAnswer) {
		if (!currentQuestion || isAnswerLocked) {
			return;
		}

		selectedOption = answer;
		isAnswerLocked = true;

		if (feedbackTimer) {
			clearTimeout(feedbackTimer);
		}

		if (answer === currentQuestion.correct) {
			feedbackStatus = "correct";
			answers = {
				...answers,
				[currentQuestion.key]: answer,
			};

			feedbackTimer = setTimeout(() => {
				selectedOption = null;
				feedbackStatus = null;
				isAnswerLocked = false;
				currentQuestionIndex += 1;
			}, 700);
			return;
		}

		feedbackStatus = "wrong";
		feedbackTimer = setTimeout(() => {
			selectedOption = null;
			feedbackStatus = null;
			isAnswerLocked = false;
		}, 700);
	}

	function skipCurrentQuestion() {
		if (!currentQuestion || isAnswerLocked) {
			return;
		}

		if (feedbackTimer) {
			clearTimeout(feedbackTimer);
		}
		selectedOption = null;
		feedbackStatus = null;
		isAnswerLocked = false;
		currentQuestionIndex += 1;
	}

	function restartQuestions() {
		if (feedbackTimer) {
			clearTimeout(feedbackTimer);
		}
		answers = {};
		currentQuestionIndex = 0;
		selectedOption = null;
		feedbackStatus = null;
		isAnswerLocked = false;
	}

	function openDialog() {
		isConnectionDialogOpen = true;
	}
</script>

<div class="mx-auto w-full max-w-4xl p-4 sm:p-6">
	<article class="rounded-2xl border border-(--border-soft) bg-(--surface) p-5 sm:p-7 space-y-8">
		<header class="space-y-3">
			<p class="text-sm font-medium opacity-70">{badge}</p>
			<h1 class="text-2xl sm:text-3xl font-bold tracking-tight">{title}</h1>
			<p class="opacity-90">{description}</p>
		</header>

		<section class="rounded-xl bg-(--surface-soft) p-4 space-y-3">
			{#if isConnected}
				<p class="text-sm font-medium" style:color="var(--accent)">
					Connected to {robotConnection.lastConnectedHost || robotConnection.host}
				</p>
			{:else}
				<p class="text-sm opacity-90">You are not connected to a robot.</p>
				<button
					type="button"
					onclick={openDialog}
					class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
					style:background="var(--accent)"
					style:color="var(--surface-solid)"
				>
					Open robot connection dialogue
				</button>
			{/if}
		</section>

		{#if isConnected}
			<section class="rounded-xl bg-(--surface-soft) p-4 space-y-2">
				<p class="text-sm font-medium">Drive with WASD to test each answer:</p>
				<div class="flex justify-center py-2">
					<WASDController />
				</div>
			</section>

			{#if !allAnswered}
				<section class="space-y-3">
					<p class="text-sm opacity-75">Question {currentQuestionIndex + 1} of {questions.length}</p>
					<div class="rounded-xl bg-(--surface-soft) p-5 min-h-48">
						{#key currentQuestion.key}
							<div in:fly={{ x: 22, duration: 220 }} out:fly={{ x: -22, duration: 220 }} class="space-y-4">
								<p class="text-lg font-medium">{currentQuestion.prompt}</p>
								<div class="flex flex-wrap gap-2">
									{#each currentQuestion.options as option}
										<button
											type="button"
											onclick={() => answerCurrentQuestion(option)}
											class="rounded-full px-4 py-2 text-sm font-medium border border-(--border-soft) hover:opacity-90"
											disabled={isAnswerLocked}
											class:correct={feedbackStatus === "correct" && selectedOption === option}
											class:wrong={feedbackStatus === "wrong" && selectedOption === option}
											class:shake={feedbackStatus === "wrong" && selectedOption === option}
										>
											{option === "left" || option === "right"
												? `Rotates ${option}`
												: option.charAt(0).toUpperCase() + option.slice(1)}
										</button>
									{/each}
								</div>

								{#if feedbackStatus === "correct"}
									<p class="text-sm font-medium" style:color="#16a34a">Correct! Nice job.</p>
								{:else if feedbackStatus === "wrong"}
									<p class="text-sm font-medium" style:color="#dc2626">Not quite. Try again.</p>
								{/if}

								<div class="pt-1">
									<button
										type="button"
										onclick={skipCurrentQuestion}
										class="text-sm mt-2 font-medium underline opacity-80 hover:opacity-100"
										disabled={isAnswerLocked}
									>
										Skip
									</button>
								</div>
							</div>
						{/key}
					</div>
				</section>
			{:else}
				<section class="rounded-xl bg-(--surface-soft) p-4">
					<p class="font-medium">Great work.</p>
					<p class="text-sm opacity-90 mt-1">You got {correctCount} out of {questions.length} correct.</p>
					<button
						type="button"
						onclick={restartQuestions}
						class="mt-3 rounded-full border border-(--border-soft) px-4 py-2 text-sm font-medium hover:opacity-90"
					>
						Try again
					</button>
				</section>
			{/if}
		{/if}

		<nav class="pt-2 flex items-center justify-between gap-3">
			<a
				href={backHref}
				class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border border-(--border-soft) hover:opacity-90"
			>
				← Back
			</a>

			{#if allAnswered}
				<a
					href={nextPageHref}
					class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-opacity hover:opacity-90"
					style:background="var(--accent)"
					style:color="var(--surface-solid)"
				>
					Next: {nextPageName} →
				</a>
			{:else}
				<a
					href={nextPageHref}
					class="inline-flex items-center rounded-full px-4 py-2 text-sm font-medium border border-(--border-soft) opacity-85 hover:opacity-100"
				>
					Skip to Next: {nextPageName} →
				</a>
			{/if}
		</nav>
	</article>
</div>

<RobotConnectionDialog bind:isOpen={isConnectionDialogOpen} />

<style>
	button.correct {
		background: rgba(34, 197, 94, 0.16);
		border-color: #16a34a;
		color: #166534;
	}

	button.wrong {
		background: rgba(239, 68, 68, 0.14);
		border-color: #dc2626;
		color: #991b1b;
	}

	button:disabled {
		opacity: 0.9;
	}

	button.shake {
		animation: shake 0.38s ease-in-out;
	}

	@keyframes shake {
		0%,
		100% {
			transform: translateX(0);
		}
		20% {
			transform: translateX(-5px);
		}
		40% {
			transform: translateX(5px);
		}
		60% {
			transform: translateX(-4px);
		}
		80% {
			transform: translateX(4px);
		}
	}
</style>
