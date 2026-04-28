<script lang="ts">
	const { form } = $props();
</script>

<div class="w-auto flex-1 flex flex-col items-center justify-center">
    <h1 class="text-4xl font-semibold">Sign in</h1>
    <div class="w-full max-w-xs">
        <form method="POST" class="rounded px-8 pt-6 pb-8 mb-4">
            <div class="mb-4">
                <label
                    class="block text-sm font-bold mb-2"
                    for="email"
                >
                    Email
                </label>
                <input
                    class="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="email"
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    value={form?.email ?? ""}
                />
            </div>
            <div class="">
                <label
                    class="block text-sm font-bold mb-2"
                    for="password"
                >
                    Password
                </label>
                <input
                    class="shadow appearance-none border border-red-500 rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
                    id="password"
                    name="password"
                    type="password"
                    placeholder="******************"
                    required
                />
            </div>
            {#if form?.error}
                <p class="text-sm text-red-600 mb-4">{form.error}</p>
            {/if}
            <div class="flex items-center justify-between mb-6">
                <a
                    class="inline-block align-baseline font-semibold text-sm text-blue-500 hover:text-blue-800"
                    href="/register"
                >
                    or Register
                </a>
            </div>
            <div class="flex items-center justify-between">
                <button
                    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                >
                    Sign In
                </button>
            </div>
        </form>
    </div>
</div>
