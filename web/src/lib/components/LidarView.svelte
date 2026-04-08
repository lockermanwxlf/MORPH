<script lang="ts">
    import type { OccupancyGrid } from "$lib/foxglove/types/occupancy-grid.js";
    import { getRobotConnectionContext } from "$lib/robot-connection.svelte.js";
    const connection = getRobotConnectionContext();
    let canvas = $state<HTMLCanvasElement>();
    let imgData: ImageData | null = null;
    $effect(() => {
        if (!canvas || !connection.client) return;
        
        const ctx = canvas.getContext("2d", { alpha: false });
        if (!ctx) return;
        const renderMap = (newMap: OccupancyGrid) => {
            const { data, width: n, height: m } = newMap;
            
            if (!Array.isArray(data) || n <= 0 || m <= 0 || data.length !== n * m) {
                return;
            }

            if (!imgData || imgData.width !== n || imgData.height !== m) {
                canvas!.width = n;
                canvas!.height = m;
                imgData = ctx.createImageData(n, m);
            }

            const pixels = imgData.data;

            for (let i = 0; i < data.length; i++) {
                const value = data[i];
                const color = value < 0 ? 127 : Math.max(0, Math.min(255, Math.round(value * 2.55)));
                const pos = i << 2;
                pixels[pos] = color;
                pixels[pos + 1] = color;
                pixels[pos + 2] = color;
                pixels[pos + 3] = 255;
            }

            ctx.putImageData(imgData, 0, 0);
        };

        const client = connection.client;
        client?.addCallback("map", renderMap);

        // Cleanup function
        return () => {
            client?.removeCallback("map", renderMap);
        };
    });
</script>

<canvas
    bind:this={canvas}
    class="w-full h-full object-contain"
    style="image-rendering: pixelated;"
></canvas>
