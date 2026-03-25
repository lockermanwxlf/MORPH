import {
	createContext,
	type ReactNode,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";
import { useSocket } from "@/utils/SocketContext";

export interface SlamMap {
	data: number[];
	width: number;
	height: number;
}

interface SlamMapContextValue {
	map: SlamMap;
	subscribe: (callback: (map: SlamMap) => void) => () => void;
}

function randomMap(): SlamMap {
	const width = 500;
	const height = 200;
	return {
		data: Array.from({ length: width * height }, () => Math.random() * 100),
		height,
		width,
	};
}

const SlamMapContext = createContext<SlamMapContextValue | null>(null);

let map: SlamMap = {
	data: [0],
	width: 1,
	height: 1,
};

const listeners = new Set<(map: SlamMap) => void>();
let subscriberCount = 0;
let socketListener: ((data: SlamMap) => void) | null = null;
let interval: NodeJS.Timeout | null = null;

export function SlamMapProvider({ children }: { children: ReactNode }) {
	const { socket } = useSocket();

	const contextValue = useRef<SlamMapContextValue>({
		map,
		subscribe: (callback: (map: SlamMap) => void) => {
			listeners.add(callback);
			subscriberCount++;

			// Set up socket listener only for the first subscriber
			if (subscriberCount === 1 && socket) {
				interval = setInterval(() => {
					console.log("interval");
					listeners.forEach((list) => {
						list(randomMap());
					});
				});
				socketListener = (data: SlamMap) => {
					map = data;
					listeners.forEach((listener) => {
						listener(data);
					});
				};
				socket.on("slam_map", socketListener);
			}

			// Return unsubscribe function
			return () => {
				listeners.delete(callback);
				subscriberCount--;

				// Remove socket listener if this was the last subscriber
				if (subscriberCount === 0 && socketListener && socket) {
					socket.off("slam_map", socketListener);
					socketListener = null;
					if (interval) clearInterval(interval);
					interval = null;
				}
			};
		},
	});

	return (
		<SlamMapContext.Provider value={contextValue.current}>
			{children}
		</SlamMapContext.Provider>
	);
}

export function useSlamMap() {
	const context = useContext(SlamMapContext);
	if (!context) {
		throw new Error("useSlamMap must be used within SlamMapProvider");
	}

	const [mapState, setMapState] = useState<SlamMap>(context.map);

	useEffect(() => {
		const unsubscribe = context.subscribe((newMap) => {
			setMapState(newMap);
		});

		return unsubscribe;
	}, [context]);

	return mapState;
}
