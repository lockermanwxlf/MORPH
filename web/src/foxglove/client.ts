import { parseCdrOccupancyGrid } from "./cdr/occupancy-grid.ts";
import { parseCdrString } from "./cdr/string.ts";
import { twistStampedFrame, type TwistStamped } from "./types/twist-stamped.ts";

interface StringMessage {
	op: string;
}

interface Channel {
	topic: string;
	id: number;
	encoding: "json" | "cdr";
	schemaName: string;
}

interface AdvertiseMessage extends StringMessage {
	op: "advertise";
	channels: Channel[];
}

interface StatusMessage extends StringMessage {
	op: "status";
	level?: string;
	message?: string;
}

const TOPICS_TO_SUBSCRIBE = ["/map"];

function toFoxgloveWebSocketUrl(host: string): string {
	if (host.startsWith("ws://") || host.startsWith("wss://")) {
		return host;
	}

	if (host.startsWith("http://") || host.startsWith("https://")) {
		const url = new URL(host);
		url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
		return url.toString();
	}

	if (host.includes(":")) {
		return `ws://${host}`;
	}

	return `ws://${host}:8765`;
}

export class FoxgloveClient {
	host: string;
	socket: WebSocket | null;
	channelInfo: Map<number, Channel>;
	subscribedTopics: Map<number, string>;
	subscriptionIdToChannelId: Map<number, number>;
	onOpen?: () => void;
	onClose?: (event: CloseEvent) => void;
	onError?: (event: Event) => void;
	onStatus?: (status: StatusMessage) => void;
	onChannelsChanged?: (topics: string[]) => void;

	constructor(host: string) {
		this.host = host;
		this.socket = null;
		this.channelInfo = new Map();
		this.subscribedTopics = new Map<number, string>();
		this.subscriptionIdToChannelId = new Map<number, number>();
	}

	connect(): Promise<void> {
		if (
			this.socket &&
			(this.socket.readyState === WebSocket.OPEN ||
				this.socket.readyState === WebSocket.CONNECTING)
		) {
			return Promise.resolve();
		}

		this.channelInfo.clear();
		this.subscribedTopics.clear();
		this.subscriptionIdToChannelId.clear();

		this.socket = new WebSocket(
			toFoxgloveWebSocketUrl(this.host),
			"foxglove.sdk.v1",
		);
		this.socket.binaryType = "arraybuffer";
		this.socket.onmessage = async (event) => {
			if (typeof event.data === "string") {
				await this.handleStringMessage(event.data);
			} else if (event.data instanceof ArrayBuffer) {
				await this.handleBinaryMessage(event.data);
			}
		};

		return new Promise((resolve, reject) => {
			if (!this.socket) {
				reject(new Error("Socket was not created."));
				return;
			}

			this.socket.onopen = () => {
				this.onOpen?.();
				resolve();
			};
			this.socket.onerror = (event) => {
				this.onError?.(event);
				reject(new Error(`Failed to connect to ${this.host}`));
			};
			this.socket.onclose = (event) => {
				this.onClose?.(event);
			};
		});
	}

	disconnect() {
		this.socket?.close();
		this.socket = null;
	}

	subscribeToChannel(
		channelId: number,
		topic: string,
		encoding: "json" | "cdr",
	) {
		const subcriptionId = this.subscribedTopics.size + 1;
		const msg = {
			op: "subscribe",
			subscriptions: [
				{
					id: subcriptionId,
					channelId,
					topic,
					encoding,
				},
			],
		};
		this.socket?.send(JSON.stringify(msg));
		this.subscribedTopics.set(subcriptionId, topic);
		this.subscriptionIdToChannelId.set(subcriptionId, channelId);
	}

	sendTwistStamped(
		twistStamped: TwistStamped,
		channelId: number,
		frameId: string,
	) {
		const frame = twistStampedFrame(twistStamped, channelId, frameId);
		this.socket?.send(frame);
	}

	private async handleStringMessage(message: string) {
		const data = JSON.parse(message) as StringMessage;
		switch (data.op) {
			case "advertise": {
				const advertisement = data as AdvertiseMessage;
				for (const channel of advertisement.channels) {
					this.channelInfo.set(channel.id, channel);
					if (TOPICS_TO_SUBSCRIBE.includes(channel.topic)) {
						this.subscribeToChannel(
							channel.id,
							channel.topic,
							channel.encoding,
						);
					}
				}
				this.onChannelsChanged?.(
					Array.from(this.channelInfo.values())
						.map((channel) => channel.topic)
						.sort(),
				);
				break;
			}
			case "status": {
				this.onStatus?.(data as StatusMessage);
				break;
			}
			default: {
				console.warn(`Unknown message op: ${data.op}`);
			}
		}
	}

	private async handleBinaryMessage(message: ArrayBuffer) {
		const SERVER_FRAME_HEADER_LEN = 13;
		const MESSAGE_DATA_OPCODE = 0x01;
		if (message.byteLength < SERVER_FRAME_HEADER_LEN) {
			console.warn("Invalid binary message length");
			return;
		}
		const view = new DataView(message);
		const opcode = view.getUint8(0);
		if (opcode !== MESSAGE_DATA_OPCODE) {
			console.warn(`Unknown binary message opcode: ${opcode}`);
			return;
		}
		let offset = 1;

		const subscriptonOrChannelId = view.getUint32(offset, true);
		offset += 4;
		const tsNs = view.getBigUint64(offset, true);
		offset += 8;
		const payload = new Uint8Array(view.buffer, view.byteOffset + offset);

		const channelId =
			this.subscriptionIdToChannelId.get(subscriptonOrChannelId) ||
			subscriptonOrChannelId;

		const channelInfo = this.channelInfo.get(channelId);
		if (!channelInfo) {
			return;
		}
		switch (channelInfo.schemaName) {
			case "std_msgs/msg/String": {
				const data = parseCdrString(payload);
				console.log(
					`Received string message on topic ${channelInfo.topic}: ${data}`,
				);
				break;
			}
			case "nav_msgs/msg/OccupancyGrid": {
				const occupancyGrid = parseCdrOccupancyGrid(payload);
				break;
			}
			default: {
				console.warn(`Unknown schema: ${channelInfo.schemaName}`);
			}
		}
	}
}
