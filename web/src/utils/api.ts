import { isElectron } from "./runtime";

function getBaseUrl() {
	if (isElectron) {
		return `http://localhost:${window.electronAPI.backendPort}`;
	}

	return "/api";
}

export const apiUrl = getBaseUrl();
