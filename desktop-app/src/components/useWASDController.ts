import { useEffect } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "@/utils/SocketContext";
import { useWASD } from "./useWASD";

interface WasdState {
	w: boolean;
	a: boolean;
	s: boolean;
	d: boolean;
}

function sendDiffDriveWASD(state: WasdState, socket: Socket) {
	console.log("sending", state);
	socket.emit("diff_drive_wasd", state);
}

export function useWASDController(options: { enabled: boolean }) {
	const { socket } = useSocket();
	const keys = useWASD();
	const { enabled } = options;

	useEffect(() => {
		if (!enabled || !socket) {
			return;
		}

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
	}, [enabled, keys, socket]);
}
