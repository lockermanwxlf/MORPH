import { useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import { requireServerAPI } from "./preload-apis";

type GenericSocket = Socket;

let managedSocket: GenericSocket | null = null;
let managedPort: number | null = null;

function createSocket(port: number): GenericSocket {
	return io(`http://127.0.0.1:${port}`, {
		transports: ["websocket"],
		autoConnect: true,
		reconnection: true,
	});
}

export function ensureSocket(port: number): GenericSocket {
	if (managedSocket && managedPort === port) {
		return managedSocket;
	}

	if (managedSocket) {
		managedSocket.removeAllListeners();
		managedSocket.disconnect();
	}

	managedSocket = createSocket(port);
	managedPort = port;
	return managedSocket;
}

export function getManagedSocket(): GenericSocket {
	if (!managedSocket) {
		throw new Error("Socket has not been initialized yet.");
	}
	return managedSocket;
}

export function useSocket() {
	const [socket, setSocket] = useState<GenericSocket | null>(null);
	const [port, setPort] = useState<number | null>(null);
	const [isConnected, setIsConnected] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const currentPortRef = useRef<number | null>(null);

	useEffect(() => {
		let active = true;
		const serverAPI = requireServerAPI();
		let unsubscribePortChanged: (() => void) | null = null;
		let boundSocket: GenericSocket | null = null;

		const onConnect = () => setIsConnected(true);
		const onDisconnect = () => setIsConnected(false);
		const onConnectError = (err: Error) => setError(err);

		const unbindSocketLifecycle = () => {
			if (!boundSocket) {
				return;
			}
			boundSocket.off("connect", onConnect);
			boundSocket.off("disconnect", onDisconnect);
			boundSocket.off("connect_error", onConnectError);
			boundSocket = null;
		};

		const bindSocketLifecycle = (nextSocket: GenericSocket) => {
			if (boundSocket === nextSocket) {
				return;
			}
			unbindSocketLifecycle();
			boundSocket = nextSocket;
			nextSocket.on("connect", onConnect);
			nextSocket.on("disconnect", onDisconnect);
			nextSocket.on("connect_error", onConnectError);
			setIsConnected(nextSocket.connected);
			setSocket(nextSocket);
		};

		const attachForPort = (nextPort: number) => {
			if (currentPortRef.current === nextPort) {
				return;
			}
			currentPortRef.current = nextPort;
			setPort(nextPort);
			const nextSocket = ensureSocket(nextPort);
			bindSocketLifecycle(nextSocket);
		};

		void serverAPI
			.getPort()
			.then((initialPort) => {
				if (!active) {
					return;
				}
				attachForPort(initialPort);
			})
			.catch((err: unknown) => {
				setError(err instanceof Error ? err : new Error(String(err)));
			});

		unsubscribePortChanged = serverAPI.onPortChanged((nextPort) => {
			if (!active) {
				return;
			}
			attachForPort(nextPort);
		});

		return () => {
			active = false;
			unsubscribePortChanged?.();
			unbindSocketLifecycle();
		};
	}, []);

	return {
		socket,
		port,
		isConnected,
		error,
	};
}
