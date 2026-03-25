import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useSlamMap } from "@/robot/slam-map";

export const Route = createFileRoute("/")({ component: App });

const CanvasGrid = ({ data, m, n }) => {
	const canvasRef = useRef(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d");

		// 1. Set internal resolution to exactly 1 pixel per grid cell
		canvas.width = n;
		canvas.height = m;

		// 2. Create ImageData object (1 pixel per array element)
		const imgData = ctx.createImageData(n, m);
		const pixels = imgData.data;

		// 3. Map the 0-100 values to pixel colors
		for (let i = 0; i < data.length; i++) {
			const val = data[i];
			// Normalize 0-100 to 0-255 for RGB (Grayscale example)
			const colorIntensity = Math.floor((val / 100) * 255);

			const pixelIndex = i * 4;
			pixels[pixelIndex] = colorIntensity; // R
			pixels[pixelIndex + 1] = colorIntensity; // G
			pixels[pixelIndex + 2] = colorIntensity; // B
			pixels[pixelIndex + 3] = 255; // Alpha
		}

		// 4. Paint directly to the visible canvas
		ctx.putImageData(imgData, 0, 0);
	}, [data, m, n]);

	return (
		<canvas
			ref={canvasRef}
			// Tailwind classes for responsive scaling and crisp edges
			className="w-full h-full object-contain"
			style={{ imageRendering: "pixelated" }}
		/>
	);
};

function App() {
	const slamMap = useSlamMap();

	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<CanvasGrid data={slamMap.data} m={slamMap.height} n={slamMap.width} />
		</div>
	);
}
