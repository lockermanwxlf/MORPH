import { useCallback, useEffect, useRef, useState } from "react";
import { type MorphDevice, useMorphDevices } from "./useMorphDevices";
import { useSocket } from "./useSocket";

interface ConnectResponse {
	status: "ok" | "error";
	message: string;
}

export function useConnectedDevice() {
	const { socket } = useSocket();
	const { devices: morphDevices } = useMorphDevices();
	const desiredDeviceId = useRef<string | null>(null);
	const [connectedDevice, setConnectedDevice] = useState<MorphDevice | null>(
		null,
	);

	const connect = useCallback(
		(deviceId: string) =>
			new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error("Socket not initialized"));
					return;
				}
				const target = morphDevices.find((d) => d.deviceId === deviceId);
				if (!target) {
					reject(new Error("Device not found"));
					return;
				}
				socket.emit(
					"connect_robot",
					{ device_id: deviceId },
					(response: ConnectResponse) => {
						if (response.status === "ok") {
							setConnectedDevice(target);
							resolve(response.message);
						} else {
							reject(new Error(response.message));
						}
					},
				);
			}),
		[morphDevices, socket],
	);

	const disconnect = useCallback(
		() =>
			new Promise((resolve, reject) => {
				if (!socket) {
					reject(new Error("Socket not initialized"));
					return;
				}
				desiredDeviceId.current = null;
				socket.emit("disconnect_robot", (response: ConnectResponse) => {
					if (response.status === "ok") {
						setConnectedDevice(null);
						resolve(response.message);
					} else {
						reject(new Error(response.message));
					}
				});
			}),
		[socket],
	);

	// Attempt reconnect if socket changes.
	useEffect(() => {
		if (!socket || !desiredDeviceId.current) {
			return;
		}
		connect(desiredDeviceId.current).catch((err: Error) => {
			console.log("Failed to connect to device on socket change:", err);
		});
	}, [socket, connect]);

	// Disconnect if the robot no longer appears in the device list.
	useEffect(() => {
		if (!morphDevices.find((d) => d.deviceId === desiredDeviceId.current)) {
			disconnect().catch((err: Error) => {
				console.log(
					"Failed to disconnect from device on morphDevices change:",
					err,
				);
			});
		}
	}, [morphDevices, disconnect]);

	return { connectedDevice, connect, disconnect };
}
