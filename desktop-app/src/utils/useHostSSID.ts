import { useEffect, useState } from "react";

export function useHostSSID() {
	const [ssid, setSSID] = useState<string | null>(null);

	useEffect(() => {
		if (window.wifiAPI) {
			window.wifiAPI.getHostSSID().then(setSSID);
		}
	});

	return ssid;
}
