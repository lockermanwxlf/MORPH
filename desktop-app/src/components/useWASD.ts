import { useEffect, useState } from "react";

export interface WasdKeys {
	w: boolean;
	a: boolean;
	s: boolean;
	d: boolean;
}

const DEFAULT_KEYS: WasdKeys = { w: false, a: false, s: false, d: false };
const WASD_KEYS = ["w", "a", "s", "d"] as const;
type WasdKey = (typeof WASD_KEYS)[number];

function isWasdKey(key: string): key is WasdKey {
	return (WASD_KEYS as readonly string[]).includes(key);
}

export function useWASD() {
	const [keys, setKeys] = useState<WasdKeys>(DEFAULT_KEYS);

	useEffect(() => {
		const handleKeyDown = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			if (!isWasdKey(key)) {
				return;
			}
			setKeys((prev) => ({ ...prev, [key]: true }));
		};

		const handleKeyUp = (event: KeyboardEvent) => {
			const key = event.key.toLowerCase();
			if (!isWasdKey(key)) {
				return;
			}
			setKeys((prev) => ({ ...prev, [key]: false }));
		};

		window.addEventListener("keydown", handleKeyDown);
		window.addEventListener("keyup", handleKeyUp);

		return () => {
			window.removeEventListener("keydown", handleKeyDown);
			window.removeEventListener("keyup", handleKeyUp);
		};
	}, []);

	return keys;
}
