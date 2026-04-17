<script lang="ts">
    import type { OccupancyGrid } from "$lib/foxglove/types/occupancy-grid.js";
    import type { PoseWithCovariance } from "$lib/foxglove/types/pose.js";
    import { getRobotConnectionContext } from "$lib/robot-connection.svelte.js";
    const connection = getRobotConnectionContext();
    let canvas = $state<HTMLCanvasElement>();
    let overlayCanvas = $state<HTMLCanvasElement>();
    let imgData: ImageData | null = null;

    let map: OccupancyGrid | null = null;
    let pose: PoseWithCovariance | null = null;
    
    $effect(() => {
        if (!canvas || !overlayCanvas || !connection.client) return;
        
        const ctx = canvas.getContext("2d", { alpha: false });
        const overlayCtx = overlayCanvas.getContext("2d", { alpha: true });
        if (!ctx || !overlayCtx) return;

        const renderMap = () => {
            if (!map) return;
            const { data, width: n, height: m, origin, resolution } = map;
            if (
                !data ||
                n <= 0 ||
                m <= 0 ||
                resolution <= 0 ||
                data.length !== n * m
            ) {
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

                // Occupancy grid is row-major from left->right, bottom->top.
                // Canvas pixels are row-major from left->right, top->bottom.
                const gridX = i % n;
                const gridYFromBottom = Math.floor(i / n);
                const canvasY = m - 1 - gridYFromBottom;
                const pixelIndex = canvasY * n + gridX;
                const pos = pixelIndex << 2;

                pixels[pos] = color;
                pixels[pos + 1] = color;
                pixels[pos + 2] = color;
                pixels[pos + 3] = 255;
            }

            ctx.putImageData(imgData, 0, 0);

            const isFiniteNumber = (value: number) => Number.isFinite(value);
            const canProject =
                !!origin &&
                isFiniteNumber(origin.x) &&
                isFiniteNumber(origin.y) &&
                isFiniteNumber(resolution) &&
                resolution > 0;

            const worldToCanvas = (worldX: number, worldY: number) => {
                if (!canProject || !origin) return null;

                // Map origin is the bottom-left map corner in world coordinates.
                const gridX = (worldX - origin.x) / resolution;
                const gridYFromBottom = (worldY - origin.y) / resolution;
                const canvasY = m - 1 - gridYFromBottom;

                return { x: gridX, y: canvasY };
            };

            const drawMarker = (x: number, y: number, color: string, radius = 6) => {
                overlayCtx.fillStyle = color;
                overlayCtx.beginPath();
                overlayCtx.arc(x, y, radius, 0, Math.PI * 2);
                overlayCtx.fill();
            };

            // Clear overlay and draw reference markers
            overlayCtx.clearRect(0, 0, n, m);

            // Map origin (bottom-left of the map in world frame)
            const mapOriginPixel = worldToCanvas(origin.x, origin.y);
            if (mapOriginPixel) {
                drawMarker(mapOriginPixel.x, mapOriginPixel.y, "#3b82f6", 5);
            }

            // World-frame origin (0, 0), which may be inside the map bounds.
            const worldOriginPixel = worldToCanvas(0, 0);
            if (worldOriginPixel) {
                drawMarker(worldOriginPixel.x, worldOriginPixel.y, "#ef4444", 6);
            }

            // Robot pose is expressed in world frame, so project from world->map->canvas.
            if (pose?.pose?.position) {
                const posePixel = worldToCanvas(pose.pose.position.x, pose.pose.position.y);
                if (posePixel) {
                    drawMarker(posePixel.x, posePixel.y, "#22c55e", 6);
                }
            }
        };

        const client = connection.client;

        const onNewMap = (m: OccupancyGrid) => {
            map = m;
            renderMap();
        };

        const onNewPose = (p: PoseWithCovariance) => {
            pose = p;
            renderMap();
        };
        
        client?.addCallback("map", onNewMap);
        client?.addCallback("pose", onNewPose);

        // Cleanup function
        return () => {
            client?.removeCallback("map", onNewMap);
            client?.removeCallback("pose", onNewPose);
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
