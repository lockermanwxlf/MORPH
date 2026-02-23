import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";

import { getRouter } from "./router";
import { requireBluetoothAPI } from "./utils/preload-apis";

try {
	const bluetoothAPI = requireBluetoothAPI();
	console.log("[Renderer] bluetoothAPI available, setting up listeners");

	bluetoothAPI
		.getBluetoothDevices()
		.then((devices) => {
			console.log("[Renderer] Initial bluetooth devices:", devices);
		})
		.catch((error) => {
			console.error("[Renderer] Failed to load bluetooth devices:", error);
		});

	bluetoothAPI.startBluetoothScan();

	bluetoothAPI.onBluetoothDeviceAdded((device) => {
		console.log("[Renderer] Bluetooth device added:", device);
	});

	bluetoothAPI.onBluetoothDeviceUpdated((device) => {
		console.log("[Renderer] Bluetooth device updated:", device);
	});

	bluetoothAPI.onBluetoothDeviceRemoved((device) => {
		console.log("[Renderer] Bluetooth device removed:", device);
	});

	bluetoothAPI.onBluetoothScanning((active) => {
		console.log("[Renderer] Bluetooth scanning:", active);
	});
} catch (error) {
	console.warn("[Renderer] bluetoothAPI not available:", error);
}

const router = getRouter();

const rootElement = document.getElementById("root");

if (!rootElement?.innerHTML) {
	const root = ReactDOM.createRoot(rootElement!);
	root.render(<RouterProvider router={router} />);
}
