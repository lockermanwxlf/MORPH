import { FoxgloveClient } from "../foxglove/client";

export type ConnectionStatus =
	| "idle"
	| "connecting"
	| "connected"
	| "disconnected"
	| "error";

function normalizeHost(input: string): string {
	const trimmed = input.trim();
	if (!trimmed) {
		return "";
	}

	if (trimmed.startsWith("ws://") || trimmed.startsWith("wss://")) {
		const url = new URL(trimmed);
		return url.host;
	}

	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		const url = new URL(trimmed);
		return url.host;
	}

	return trimmed;
}

class RobotConnectionState {
	host = $state("");
	status = $state<ConnectionStatus>("idle");
	error = $state("");
	client = $state<FoxgloveClient | null>(null);
	lastConnectedHost = $state("");
	advertisedTopics = $state<string[]>([]);

	async connect(hostInput: string) {
		const normalizedHost = normalizeHost(hostInput);
		if (!normalizedHost) {
			this.status = "error";
			this.error = "Enter a robot IP or hostname.";
			return false;
		}

		this.disconnect();

		this.host = normalizedHost;
		this.status = "connecting";
		this.error = "";
		this.advertisedTopics = [];

		const client = new FoxgloveClient(normalizedHost);
		this.client = client;
		client.onChannelsChanged = (topics) => {
			if (this.client === client) {
				this.advertisedTopics = topics;
			}
		};
		client.onClose = () => {
			if (this.client === client) {
				this.status = "disconnected";
			}
		};
		client.onError = () => {
			if (this.client === client) {
				this.status = "error";
				this.error = `Could not connect to ${normalizedHost}.`;
			}
		};

		try {
			await client.connect();
			this.status = "connected";
			this.lastConnectedHost = normalizedHost;
			return true;
		} catch (error) {
			console.error(error);
			if (this.client === client || this.client === null) {
				this.status = "error";
				this.error = `Could not connect to ${normalizedHost}.`;
			}
			client.disconnect();
			return false;
		}
	}

	disconnect() {
		this.client?.disconnect();
		this.client = null;
		this.advertisedTopics = [];
		if (this.status !== "idle") {
			this.status = "disconnected";
		}
	}
}

export const robotConnection = new RobotConnectionState();
