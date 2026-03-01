import { useCallback, useEffect, useState } from "react";
import { type MorphDevice, useMorphDevices } from "./useMorphDevices";
import { useSocket } from "./useSocket";

interface ConnectResponse {
	status: "ok" | "error";
	message: string;
}

export function useConnectedDevice() {
	const { devices: morphDevices } = useMorphDevices();
	const { socket } = useSocket();

	const [desiredDeviceId, setDesiredDeviceId] = useState<string | null>(null);
	const [connectedDevice, setConnectedDevice] = useState<MorphDevice | null>(
		null,
	);

	const disconnect = useCallback(() => {
		if (!socket) return;
		socket.emit("disconnect_robot");
	}, [socket]);

	useEffect(() => {
		if (!socket) {
			setConnectedDevice(null);
			return;
		}
		if (
			!desiredDeviceId ||
			!morphDevices.find((d) => d.deviceId === desiredDeviceId)
		) {
			disconnect();
			setConnectedDevice(null);
			return;
		}

		socket.emit(
			"connect_robot",
			{ deviceId: desiredDeviceId },
			(response: ConnectResponse) => {
				if (response.status === "ok") {
					setConnectedDevice(
						morphDevices.find((d) => d.deviceId === desiredDeviceId) || null,
					);
				} else {
					setConnectedDevice(null);
				}
			},
		);
	}, [desiredDeviceId, socket, morphDevices, disconnect]);

	function connect(device: MorphDevice) {
		setDesiredDeviceId(device.deviceId);
	}

	return {
		connectedDevice,
		connect,
		disconnect,
	};
}
