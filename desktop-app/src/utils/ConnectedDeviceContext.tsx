import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from "react";
import { useSocket } from "./SocketContext";
import { type MorphDevice, useMorphDevices } from "./useMorphDevices";

interface ConnectResponse {
	status: "ok" | "error";
	message: string;
}

interface ConnectedDeviceContextValue {
	connectedDevice: MorphDevice | null;
	connect: (device: MorphDevice) => Promise<string>;
	disconnect: () => Promise<string>;
}

const ConnectedDeviceContext =
	createContext<ConnectedDeviceContextValue | null>(null);

export function ConnectedDeviceProvider({ children }: { children: ReactNode }) {
	const { socket } = useSocket();
	const { devices: morphDevices } = useMorphDevices();
	const desiredDeviceId = useRef<string | null>(null);
	const [connectedDevice, setConnectedDevice] = useState<MorphDevice | null>(
		null,
	);

	// Keep refs for the latest values so effects don't need them as deps.
	const socketRef = useRef(socket);
	socketRef.current = socket;
	const morphDevicesRef = useRef(morphDevices);
	morphDevicesRef.current = morphDevices;

	const connect = useCallback(
		(device: MorphDevice) =>
			new Promise<string>((resolve, reject) => {
				const s = socketRef.current;
				if (!s) {
					reject(new Error("Socket not initialized"));
					return;
				}
				desiredDeviceId.current = device.deviceId;
				s.emit(
					"connect_robot",
					{ device_id: device.deviceId },
					(response: ConnectResponse) => {
						if (response.status === "ok") {
							setConnectedDevice(device);
							resolve(response.message);
						} else {
							reject(new Error(response.message));
						}
					},
				);
			}),
		[],
	);

	const disconnect = useCallback(
		() =>
			new Promise<string>((resolve, reject) => {
				const s = socketRef.current;
				if (!s) {
					reject(new Error("Socket not initialized"));
					return;
				}
				desiredDeviceId.current = null;
				s.emit("disconnect_robot", (response: ConnectResponse) => {
					if (response.status === "ok") {
						setConnectedDevice(null);
						resolve(response.message);
					} else {
						reject(new Error(response.message));
					}
				});
			}),
		[],
	);

	// Attempt reconnect if socket changes.
	useEffect(() => {
		if (!socket || !desiredDeviceId.current) {
			return;
		}
		const target = morphDevicesRef.current.find(
			(d) => d.deviceId === desiredDeviceId.current,
		);
		if (target) {
			connect(target).catch((err: Error) => {
				console.log("Failed to reconnect on socket change:", err);
			});
		}
	}, [socket, connect]);

	// Disconnect if the robot no longer appears in the device list.
	useEffect(() => {
		if (
			desiredDeviceId.current &&
			!morphDevices.find((d) => d.deviceId === desiredDeviceId.current)
		) {
			disconnect().catch((err: Error) => {
				console.log("Failed to disconnect on device removal:", err);
			});
		}
	}, [morphDevices, disconnect]);

	return (
		<ConnectedDeviceContext.Provider
			value={{ connectedDevice, connect, disconnect }}
		>
			{children}
		</ConnectedDeviceContext.Provider>
	);
}

export function useConnectedDevice() {
	const ctx = useContext(ConnectedDeviceContext);
	if (!ctx) {
		throw new Error(
			"useConnectedDevice must be used within ConnectedDeviceProvider",
		);
	}
	return ctx;
}
