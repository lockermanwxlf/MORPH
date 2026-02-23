import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { requireServerAPI } from "./preload-apis";
import { useSocket } from "./useSocket";

export interface MorphDevice {
	host: string;
	port: number;
	deviceId: string;
}

const MORPH_DEVICES_QUERY_KEY = ["morphDevices"] as const;
const DEVICES_TOPIC = "robots";

function normalizeDevice(payload: unknown): MorphDevice | null {
	if (!payload || typeof payload !== "object") {
		return null;
	}

	const record = payload as Record<string, unknown>;
	const host = record.host;
	const port = record.port;
	if (typeof host !== "string" || typeof port !== "number") {
		return null;
	}
	return { host, port, deviceId: record.device_id as string };
}

function normalizeDevices(payload: unknown): MorphDevice[] {
	if (Array.isArray(payload)) {
		return payload
			.map(normalizeDevice)
			.filter((d): d is MorphDevice => d !== null);
	}
	if (payload && typeof payload === "object") {
		const record = payload as Record<string, unknown>;
		if (Array.isArray(record.robots)) {
			return normalizeDevices(record.robots);
		}
		if (Array.isArray(record.devices)) {
			return normalizeDevices(record.devices);
		}
	}
	return [];
}

function upsertDevice(
	current: MorphDevice[],
	incoming: MorphDevice,
): MorphDevice[] {
	const index = current.findIndex(
		(device) => device.host === incoming.host && device.port === incoming.port,
	);
	if (index === -1) {
		return [...current, incoming];
	}
	const next = current.slice();
	next[index] = incoming;
	return next;
}

function removeDevice(
	current: MorphDevice[],
	incomingDeviceId: string,
): MorphDevice[] {
	return current.filter((device) => device.deviceId !== incomingDeviceId);
}

export function useMorphDevices() {
	const serverAPI = requireServerAPI();
	const queryClient = useQueryClient();
	const { socket } = useSocket();

	const query = useQuery<MorphDevice[]>({
		queryKey: MORPH_DEVICES_QUERY_KEY,
		queryFn: async () => {
			const port = await serverAPI.getPort();
			const response = await fetch(`http://localhost:${port}/robots`);
			const data = (await response.json()) as unknown;
			return normalizeDevices(data);
		},
		staleTime: 30_000,
	});

	useEffect(() => {
		if (!socket) {
			return;
		}

		void socket.emit("subscribe", { topic: DEVICES_TOPIC });

		const handleAdd = (payload: {
			host: string;
			port: number;
			device_id: string;
		}) => {
			const device = normalizeDevice(payload);
			if (!device) {
				return;
			}
			queryClient.setQueryData<MorphDevice[]>(
				MORPH_DEVICES_QUERY_KEY,
				(current = []) => upsertDevice(current, device),
			);
		};

		const handleRemove = (payload: { device_id: string }) => {
			const deviceId = payload.device_id as string;
			queryClient.setQueryData<MorphDevice[]>(
				MORPH_DEVICES_QUERY_KEY,
				(current = []) => removeDevice(current, deviceId),
			);
		};

		const handleSnapshot = (payload: unknown) => {
			const devices = normalizeDevices(payload);
			if (devices.length === 0) {
				return;
			}
			queryClient.setQueryData<MorphDevice[]>(MORPH_DEVICES_QUERY_KEY, devices);
		};

		socket.on("robot_added", handleAdd);
		socket.on("robot_removed", handleRemove);
		socket.on("robots_snapshot", handleSnapshot);

		return () => {
			void socket.emit("unsubscribe", { topic: DEVICES_TOPIC });
			socket.off("robot_added", handleAdd);
			socket.off("robot_removed", handleRemove);
			socket.off("robots_snapshot", handleSnapshot);
		};
	}, [queryClient, socket]);

	return {
		devices: query.data ?? [],
		isLoading: query.isLoading,
		error: query.error,
	};
}
