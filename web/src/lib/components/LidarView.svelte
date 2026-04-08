<script lang="ts">
    import type { OccupancyGrid } from "$lib/foxglove/types/occupancy-grid.js";
    import { getRobotConnectionContext } from "$lib/robot-connection.svelte.js";
    const connection = getRobotConnectionContext();
    let canvas = $state<HTMLCanvasElement>();
    let overlayCanvas = $state<HTMLCanvasElement>();
    let imgData: ImageData | null = null;
    $effect(() => {
        if (!canvas || !overlayCanvas || !connection.client) return;
        
        const ctx = canvas.getContext("2d", { alpha: false });
        const overlayCtx = overlayCanvas.getContext("2d", { alpha: true });
        if (!ctx || !overlayCtx) return;

        const renderMap = (newMap: OccupancyGrid) => {
            const { data, width: n, height: m, origin, resolution } = newMap;
            if (!data || n <= 0 || m <= 0 || data.length !== n * m) {
                return;
            }

            if (!imgData || imgData.width !== n || imgData.height !== m) {
                canvas!.width = n;
                canvas!.height = m;
                overlayCanvas!.width = n;
                overlayCanvas!.height = m;
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

            // Clear overlay and draw origin marker
            overlayCtx.clearRect(0, 0, n, m);
            if (origin && !Number.isNaN(origin.x) && !Number.isNaN(origin.y)) {
                // Origin defines where grid cell (0,0) is, so it maps to pixel (0,0)
                const originPixelX = 0;
                const originPixelY = 0;

                overlayCtx.fillStyle = "red";
                overlayCtx.beginPath();
                overlayCtx.arc(originPixelX, originPixelY, 8, 0, Math.PI * 2);
                overlayCtx.fill();
            }
        };

        const client = connection.client;
        client?.addCallback("map", renderMap);

        // Cleanup function
        return () => {
            client?.removeCallback("map", renderMap);
        };
    });
</script>

<div class="relative w-full h-full">
    <canvas
        bind:this={canvas}
        class="w-full h-full object-contain"
        style="image-rendering: pixelated;"
    ></canvas>
    <canvas
        bind:this={overlayCanvas}
        class="absolute top-0 left-0 w-full h-full object-contain"
        style="image-rendering: pixelated;"
    ></canvas>
</div>
