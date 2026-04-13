<script lang="ts">
	import "./layout.css";

	const { children } = $props();
</script>

<div class="min-h-dvh min-w-dvw flex flex-col bg-(--page-bg)">
	{@render children()}
</div>