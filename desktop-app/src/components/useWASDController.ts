import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { useWASD } from "./useWASD";

export function useWASDController(options: {
	enabled: boolean;
	socket: Socket | null;
}) {
	const keys = useWASD();
	const { enabled, socket } = options;

	useEffect(() => {
		if (!enabled || !socket) {
			return;
		}
		/*
		const state: WasdState = {
			w: keys.w,
			a: keys.a,
			s: keys.s,
			d: keys.d,
		};
		sendDiffDriveWASD(state, socket);
		const intervalId = setInterval(() => {
			sendDiffDriveWASD(state, socket);
		}, 500);
		
		return () => {
			clearInterval(intervalId);
		};
		*/
	}, [enabled, keys, socket]);
}
