<script lang="ts">
	type PageData = {
		user: {
			email: string | null;
			gradeLevel: "k-5" | "6-12" | "uni" | null;
		};
	};

	const { data, form } = $props<{ data: PageData; form?: { error?: string; success?: boolean; gradeLevel?: string } }>();
</script>

<svelte:head>
	<title>Profile | MORPH</title>
	<meta
		name="description"
		content="View your profile and account settings."
	/>
</svelte:head>

<div class="max-w-xl mx-auto w-full px-6 py-10">
	<h1 class="text-3xl font-semibold mb-6">Profile</h1>

	{#if !data.user.email}
		<div class="rounded-2xl border p-6" style:border-color="var(--border-soft)">
			<h2 class="text-xl font-semibold mb-2">Sign in to get started</h2>
			<p class="text-sm opacity-75 mb-5">Create an account or sign in to set up your profile.</p>

			<div class="flex flex-col gap-3">
				<a
					href="/login"
					class="w-full text-center bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
				>
					Sign in
				</a>
				<a
					href="/register"
					class="w-full text-center border font-bold py-2 px-4 rounded"
					style:border-color="var(--border-soft)"
				>
					Register
				</a>
			</div>
		</div>
	{:else}
		<div class="rounded-2xl border p-5 mb-6" style:border-color="var(--border-soft)">
			<p class="text-sm opacity-70 mb-1">Email</p>
			<p class="font-medium">{data.user.email}</p>
		</div>

		<form method="POST" class="rounded-2xl border p-5" style:border-color="var(--border-soft)">
			<label for="gradeLevel" class="block text-sm font-semibold mb-2">Grade level</label>
			<select
				id="gradeLevel"
				name="gradeLevel"
				class="w-full rounded-lg border px-3 py-2"
				style:border-color="var(--border-soft)"
				style:color="var(--page-text)"
				style:background-color="var(--surface-solid)"
				required
			>
				<option value="" disabled selected={!data.user.gradeLevel && !form?.gradeLevel}>Select grade level</option>
				<option value="k-5" selected={(form?.gradeLevel ?? data.user.gradeLevel) === "k-5"}>K-5</option>
				<option value="6-12" selected={(form?.gradeLevel ?? data.user.gradeLevel) === "6-12"}>6-12</option>
				<option value="uni" selected={(form?.gradeLevel ?? data.user.gradeLevel) === "uni"}>University</option>
			</select>

			{#if form?.error}
				<p class="text-sm text-red-600 mt-3">{form.error}</p>
			{/if}
			{#if form?.success}
				<p class="text-sm text-emerald-600 mt-3">Profile updated.</p>
			{/if}

			<button
				type="submit"
				class="mt-5 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
			>
				Save profile
			</button>
		</form>
	{/if}
</div>

<style>
	select option {
		color: var(--page-text);
		background-color: var(--surface-solid);
	}
</style>