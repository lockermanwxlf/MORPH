import { useEffect, useRef } from "react";
import type { SlamMap } from "@/robot/SlamMap";
import { useSocket } from "@/utils/SocketContext";

export const LidarView = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imgDataRef = useRef<ImageData | null>(null);
	const { socket } = useSocket();

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;

		// Write to canvas when new map is seen.
		const renderMap = (newMap: SlamMap) => {
			const { data, width: n, height: m } = newMap;
			if (!Array.isArray(data) || n <= 0 || m <= 0 || data.length !== n * m) {
				return;
			}

			if (
				!imgDataRef.current ||
				imgDataRef.current.width !== n ||
				imgDataRef.current.height !== m
			) {
				canvas.width = n;
				canvas.height = m;
				imgDataRef.current = ctx.createImageData(n, m);
			}

			const imgData = imgDataRef.current;
			const pixels = imgData.data;

			for (let i = 0; i < data.length; i++) {
				const value = data[i];
				const color =
					value < 0 ? 127 : Math.max(0, Math.min(255, Math.round(value * 2.55)));
				const pos = i << 2;
				pixels[pos] = color;
				pixels[pos + 1] = color;
				pixels[pos + 2] = color;
				pixels[pos + 3] = 255;
			}

			ctx.putImageData(imgData, 0, 0);
		};

		const handleMapData = (payload: SlamMap) => {
			renderMap(payload);
		};

		socket?.on("map_data", handleMapData);

		return () => {
			socket?.off("map_data", handleMapData);
		};
	}, [socket]);

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-full object-contain"
			style={{ imageRendering: "pixelated" }}
		/>
	);
};
