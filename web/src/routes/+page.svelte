<svelte:head>
	<title>MORPH | Robotics, Made Approachable</title>
	<meta
		name="description"
		content="MORPH is a modular, open-source robotics platform with curriculum tailored to learners at different education levels."
	/>
</svelte:head>

<div class="min-h-dvh text-[color:var(--page-text)]">
	<section
		class="relative isolate mt-6 overflow-hidden border-y px-6 py-10 sm:mt-8 sm:px-10 sm:py-12 lg:mt-10 lg:px-16 lg:py-14"
		style:border-color="var(--border-soft)"
		style:background="var(--page-bg)"
	>
		<div class="relative mx-auto flex min-h-[48vh] w-full max-w-7xl items-center">
			<div class="grid w-full gap-12 lg:grid-cols-[minmax(0,1.25fr)_360px] lg:items-center">
				<div class="max-w-3xl">
					<h1
						class="text-5xl font-semibold leading-none tracking-[-0.04em] text-balance sm:text-6xl lg:text-7xl"
					>
						MORPH
					</h1>

					<p
						class="mt-6 max-w-2xl text-lg leading-8 sm:text-xl"
						style:color="var(--muted-text)"
					>
						MORPH is an open-source robotics platform designed to grow with the learner.
						Its modular system makes it easy to build, adapt, and experiment, while its
						curriculum is tailored to different education levels so students can meet
						robotics at the right depth.
					</p>
				</div>

				<div class="w-full max-w-sm">
					<div
						class="rounded-4xl p-4 shadow-2xl backdrop-blur-xl sm:p-5"
						style:background="var(--glass-strong)"
						style:box-shadow="0 24px 60px var(--panel-shadow)"
					>
						<div
							class="rounded-[1.6rem] p-3"
							style:background="var(--glass)"
						>
							<a
								href="/control-hub"
								class="group flex w-full items-center justify-between rounded-[1.35rem] border px-5 py-5 text-left transition duration-200"
								style:border-color="color-mix(in srgb, var(--accent) 32%, transparent)"
								style:background="var(--accent-soft)"
							>
								<span class="flex items-center gap-4">
									<span
										class="flex h-12 w-12 items-center justify-center rounded-2xl"
										style:background="color-mix(in srgb, var(--accent) 18%, transparent)"
										style:color="var(--accent)"
									>
										<svg
											viewBox="0 0 24 24"
											class="h-6 w-6"
											fill="none"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
										>
											<rect x="3.5" y="4.5" width="17" height="15" rx="3"></rect>
											<path d="M8 9h3"></path>
											<path d="M8 13h3"></path>
											<path d="M15.5 10.5h.01"></path>
											<path d="M18 13h.01"></path>
											<path d="M15.5 15.5h.01"></path>
										</svg>
									</span>
									<span>
										<span class="block text-xl font-semibold">Control Hub</span>
										<span class="mt-1 block text-sm" style:color="var(--muted-text)">
											Jump into the main MORPH command center.
										</span>
									</span>
								</span>
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5 transition group-hover:translate-x-1"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									style:color="var(--accent)"
									aria-hidden="true"
								>
									<path d="M5 12h14"></path>
									<path d="m13 6 6 6-6 6"></path>
								</svg>
							</a>

							<a
								href="#learn-more"
								class="mt-3 group flex w-full items-center justify-between rounded-[1.35rem] border px-5 py-5 text-left transition duration-200"
								style:border-color="var(--border-soft)"
								style:background="var(--glass)"
							>
								<span class="flex items-center gap-4">
									<span
										class="flex h-12 w-12 items-center justify-center rounded-2xl"
										style:background="color-mix(in srgb, var(--page-text) 10%, transparent)"
									>
										<svg
											viewBox="0 0 24 24"
											class="h-6 w-6"
											fill="none"
											stroke="currentColor"
											stroke-width="1.8"
											stroke-linecap="round"
											stroke-linejoin="round"
											aria-hidden="true"
										>
											<circle cx="12" cy="12" r="9"></circle>
											<path d="M12 10v5"></path>
											<path d="M12 7.5h.01"></path>
										</svg>
									</span>
									<span>
										<span class="block text-xl font-semibold">Learn More</span>
										<span class="mt-1 block text-sm" style:color="var(--muted-text)">
											Explore the modular system, open-source tools, and curriculum.
										</span>
									</span>
								</span>
								<svg
									viewBox="0 0 24 24"
									class="h-5 w-5 transition group-hover:translate-y-1"
									fill="none"
									stroke="currentColor"
									stroke-width="1.8"
									stroke-linecap="round"
									stroke-linejoin="round"
									aria-hidden="true"
								>
									<path d="M12 5v14"></path>
									<path d="m18 13-6 6-6-6"></path>
								</svg>
							</a>
						</div>
					</div>
				</div>
			</div>
		</div>
	</section>

	<section
		id="learn-more"
		class="mx-auto grid w-full max-w-7xl gap-6 px-6 py-14 sm:px-10 lg:grid-cols-3 lg:px-16"
	>
		<div
			class="rounded-[1.75rem] border p-6 backdrop-blur-sm"
			style:border-color="var(--border-soft)"
			style:background="var(--glass)"
		>
			<div class="text-sm font-semibold uppercase tracking-[0.2em]" style:color="var(--accent)">
				Modular
			</div>
			<h2 class="mt-3 text-2xl font-semibold">Built to be reconfigured</h2>
			<p class="mt-3 text-base leading-7" style:color="var(--muted-text)">
				MORPH is designed as a flexible system, making it easier to adapt projects,
				experiment with new ideas, and support different classroom goals.
			</p>
		</div>

		<div
			class="rounded-[1.75rem] border p-6 backdrop-blur-sm"
			style:border-color="var(--border-soft)"
			style:background="var(--glass)"
		>
			<div class="text-sm font-semibold uppercase tracking-[0.2em]" style:color="var(--accent)">
				Open Source
			</div>
			<h2 class="mt-3 text-2xl font-semibold">Made to be explored</h2>
			<p class="mt-3 text-base leading-7" style:color="var(--muted-text)">
				Because MORPH is open source, learners and educators can look under the hood,
				modify the platform, and build on top of it with confidence.
			</p>
		</div>

		<div
			class="rounded-[1.75rem] border p-6 backdrop-blur-sm"
			style:border-color="var(--border-soft)"
			style:background="var(--glass)"
		>
			<div class="text-sm font-semibold uppercase tracking-[0.2em]" style:color="var(--accent)">
				Curriculum
			</div>
			<h2 class="mt-3 text-2xl font-semibold">Tailored to every level</h2>
			<p class="mt-3 text-base leading-7" style:color="var(--muted-text)">
				MORPH includes curriculum paths shaped for different education levels, helping
				learners progress from first concepts to more advanced robotics work.
			</p>
		</div>
	</section>
</div>
