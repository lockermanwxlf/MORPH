import { parseCdrOccupancyGrid } from "./cdr/occupancy-grid.ts";
import { parsePoseWithCovariance, parsePoseWithCovarianceStamped } from "./cdr/pose.ts";
import { parseCdrString } from "./cdr/string.ts";
import type { OccupancyGrid } from "./types/occupancy-grid.ts";
import type { PoseWithCovariance } from "./types/pose.ts";
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

interface UnadvertiseMessage extends StringMessage {
    op: "unadvertise";
    channelIds: number[];
}

interface StatusMessage extends StringMessage {
	op: "status";
	level?: string;
	message?: string;
}

const TOPICS_TO_SUBSCRIBE = ["/map", "/pose"];

export type InTopic =
	| "map"
	| "pose";

export interface TopicPayloads {
	"map": OccupancyGrid;
	"pose": PoseWithCovariance;
}

type OutTopic =
	| "diff_drive_base/cmd_vel";

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

type Callback<T extends InTopic> = (payload: TopicPayloads[T]) => void;

export class FoxgloveClient {
	host: string;
	socket: WebSocket | null;
	channelInfo: Map<number, Channel>;
	subscribedTopics: Map<string, number>;
	subscriptionIdToChannelId: Map<number, number>;
	onOpen?: () => void;
	onClose?: (event: CloseEvent) => void;
	onError?: (event: Event) => void;
	onStatus?: (status: StatusMessage) => void;
	onChannelsChanged?: (topics: string[]) => void;
	topicCallbacks: Map<InTopic, Callback<InTopic>[]>;
	outTopicToChannelId: Map<OutTopic, number>;s
	private clientChannelIdCounter = 0;

	constructor(host: string) {
		this.host = host;
		this.socket = null;
		this.channelInfo = new Map();
		this.subscribedTopics = new Map<string, number>();
		this.subscriptionIdToChannelId = new Map<number, number>();
		this.topicCallbacks = new Map<InTopic, Callback<InTopic>[]>();
		this.outTopicToChannelId = new Map<OutTopic, number>();
	}

	addCallback<T extends InTopic>(topic: T, callback: (payload: TopicPayloads[T]) => void) {
		if (!this.topicCallbacks.has(topic)) {
			this.topicCallbacks.set(topic, []);
		}
		(this.topicCallbacks.get(topic) as Callback<T>[])?.push(callback);
	}

	removeCallback<T extends InTopic>(topic: T, callback: (payload: TopicPayloads[T]) => void) {
		const callbacks = this.topicCallbacks.get(topic);
		if (!callbacks) return;
		this.topicCallbacks.set(
			topic,
			callbacks.filter((cb) => cb !== callback),
		);
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
		this.outTopicToChannelId.clear();
		this.clientChannelIdCounter = 0;

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
	) {
		if (this.subscribedTopics.has(topic)) return;

		const subscriptionId = this.subscribedTopics.size + 1;
		const msg = {
			op: "subscribe",
			subscriptions: [
				{
					id: subscriptionId,
					channelId
				},
			],
		};
		this.socket?.send(JSON.stringify(msg));
		this.subscribedTopics.set(topic, subscriptionId);
		this.subscriptionIdToChannelId.set(subscriptionId, channelId);
	}

	unsubscribeFromChannel(topic: string) {
		const subscriptionId = this.subscribedTopics.get(topic);
		if (!subscriptionId) return;

		const msg = {
			op: "unsubscribe",
			subscriptionIds: [subscriptionId],
		};
		this.socket?.send(JSON.stringify(msg));
		this.subscribedTopics.delete(topic);
		this.subscriptionIdToChannelId.delete(subscriptionId);
	}



	sendTwistStamped(
		twistStamped: TwistStamped,
		frameId: string = "base_link",
	) {
		if (!this.outTopicToChannelId.has("diff_drive_base/cmd_vel")) {
			this.advertiseTopic("diff_drive_base/cmd_vel", "cdr", "geometry_msgs/msg/TwistStamped");
		}
		const channelId = this.outTopicToChannelId.get("diff_drive_base/cmd_vel");
		if (!channelId) {
			console.warn("Channel ID for diff_drive_base/cmd_vel not found");
			return;
		}
		const frame = twistStampedFrame(twistStamped, channelId, frameId);
		this.socket?.send(frame);
	}

	advertiseTopic(topic: OutTopic, encoding: "json" | "cdr", schemaName: string) {
		if (this.outTopicToChannelId.has(topic)) return;

		this.clientChannelIdCounter += 1;
		const id = this.clientChannelIdCounter;
		const msg = {
			op: "advertise",
			channels: [
				{
					id: id,
					topic,
					encoding,
					schemaName,
				},
			],
		};
		this.socket?.send(JSON.stringify(msg));
		this.outTopicToChannelId.set(topic, id);
	}

	private async handleStringMessage(message: string) {
		const data = JSON.parse(message) as StringMessage;
		switch (data.op) {
			case "advertise": {
				const advertisement = data as AdvertiseMessage;
				for (const channel of advertisement.channels) {
					this.channelInfo.set(channel.id, channel);
					if (TOPICS_TO_SUBSCRIBE.includes(channel.topic) && channel.encoding === "cdr") {
						this.subscribeToChannel(
							channel.id,
							channel.topic,
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
			case "unadvertise": {
                const unadvertisement = data as UnadvertiseMessage;
                for (const channelId of unadvertisement.channelIds) {
                    this.channelInfo.delete(channelId);
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
			case "serverInfo": {
				console.log("Connected to Foxglove server:", data);
				break;
			}
			case "advertiseServices": {
				console.log("Advertised services:", data);
				break;
			};
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

		const subscriptionId = view.getUint32(offset, true);
		offset += 4;
		const tsNs = view.getBigUint64(offset, true);
		offset += 8;
		const payload = new Uint8Array(view.buffer, view.byteOffset + offset);

		const channelId =
			this.subscriptionIdToChannelId.get(subscriptionId) ||
			subscriptionId;
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
				this.topicCallbacks.get("map")?.forEach((callback) => callback(occupancyGrid));
				break;
			}
			case "geometry_msgs/msg/PoseWithCovariance": {
				const pose = parsePoseWithCovariance(payload);
				this.topicCallbacks.get("pose")?.forEach((callback) => callback(pose));
				break;
			}
			case "geometry_msgs/msg/PoseWithCovarianceStamped": {
				const pose = parsePoseWithCovarianceStamped(payload);
				this.topicCallbacks.get("pose")?.forEach((callback) => callback(pose));
				break;
			}
			default: {
				console.warn(`Unknown schema: ${channelInfo.schemaName}`);
				return;
			}
		}
	}
}
