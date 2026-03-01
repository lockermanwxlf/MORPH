export function usePlatformCapabilities() {
	if (!window.platformAPI) {
		throw new Error("platformAPI is not available");
	}
	return window.platformAPI.getPlatformCapabilities();
}
