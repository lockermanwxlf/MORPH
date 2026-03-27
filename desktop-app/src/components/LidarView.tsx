import { useEffect, useRef } from "react";
import type { SlamMap } from "@/robot/SlamMap";

function randomMap(): SlamMap {
	const width = 500;
	const height = 200;
	return {
		data: Array.from({ length: width * height }, () => Math.random() * 100),
		height,
		width,
	};
}

export const LidarView = () => {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const imgDataRef = useRef<ImageData | null>(null);

	// Get the subscribe function directly from the context, NOT a state variable

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { alpha: false });
		if (!ctx) return;

		// Write to canvas when new map is seen.
		const callback = (newMap: SlamMap) => {
			const { data, width: n, height: m } = newMap;

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
				const color = (data[i] * 2.55) | 0;
				const pos = i << 2;
				pixels[pos] = color;
				pixels[pos + 1] = color;
				pixels[pos + 2] = color;
				pixels[pos + 3] = 255;
			}

			ctx.putImageData(imgData, 0, 0);
		};

		const interval = setInterval(() => {
			callback(randomMap());
		}, 100);

		return () => {
			clearInterval(interval);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			className="w-full h-full object-contain"
			style={{ imageRendering: "pixelated" }}
		/>
	);
};
