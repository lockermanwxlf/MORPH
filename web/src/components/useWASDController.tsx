import { useEffect } from "react";
import { robotConnection } from "@/utils/robot-connection";
import { useWASD } from "./useWASD";

function sendCommand(keys: { w: boolean; a: boolean; s: boolean; d: boolean }) {
	robotConnection.getSocket().emit("diff_drive_wasd", { ...keys, speed: 100 });
}

export function useWASDController() {
	const keys = useWASD();
	useEffect(() => {
		console.log("WASD state changed:", keys);
		const intervalId = setInterval(() => {
			sendCommand(keys);
		}, 500);
		sendCommand(keys);
		return () => {
			clearInterval(intervalId);
		};
	}, [keys]);
}
