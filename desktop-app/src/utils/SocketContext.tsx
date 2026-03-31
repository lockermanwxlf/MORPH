import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useState,
} from "react";
import { io, type Socket } from "socket.io-client";
import { requireServerAPI } from "./preload-apis";

const SocketContext = createContext<Socket | null>(null);

export function SocketProvider({ children }: { children: ReactNode }) {
	const [socket, setSocket] = useState<Socket | null>(null);

	useEffect(() => {
		let cancelled = false;

		const serverAPI = requireServerAPI();
		serverAPI.getPort().then((port) => {
			if (cancelled) return;
			const sio = io(`http://[::1]:${port}`, {
				transports: ["websocket"],
				autoConnect: true,
				reconnection: true,
			});
			setSocket(sio);
		});

		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
	);
}

export function useSocket() {
	const socket = useContext(SocketContext);
	return { socket };
}
