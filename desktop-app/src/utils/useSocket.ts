import { useEffect, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { requireServerAPI } from "./preload-apis";

export function useSocket() {
	const serverAPI = requireServerAPI();
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		async function initializeSocket() {
			const port = await serverAPI.getPort();
			const sio = io(`http://[::1]:${port}`, {
				transports: ["websocket"],
				autoConnect: true,
				reconnection: true,
			});
			setSocket(sio);
		}
		initializeSocket();
	}, [serverAPI]);

	return { socket };
}
