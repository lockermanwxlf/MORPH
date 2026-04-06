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

const TOPICS_TO_SUBSCRIBE = ["/map"];

export class FoxgloveClient {
	host: string;
	socket: WebSocket;
	channelInfo: Map<number, Channel>;
	subscribedTopics: Map<number, string>;
	subscriptionIdToChannelId: Map<number, number>;
	constructor(host: string) {
		this.host = host;
		this.socket = new WebSocket(`ws://${host}:8765`, "foxglove.sdk.v1");
		this.socket.binaryType = "arraybuffer";
		this.socket.onmessage = async (event) => {
			if (typeof event.data === "string") {
				await this.handleStringMessage(event.data);
			} else if (event.data instanceof ArrayBuffer) {
				await this.handleBinaryMessage(event.data);
			}
		};
		this.channelInfo = new Map();
		this.subscribedTopics = new Map<number, string>();
		this.subscriptionIdToChannelId = new Map<number, number>();
	}

	subcriptionToChannel(
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
		this.socket.send(JSON.stringify(msg));
		this.subscribedTopics.set(subcriptionId, topic);
		this.subscriptionIdToChannelId.set(subcriptionId, channelId);
	}

	sendTwistStamped(
		twistStamped: TwistStamped,
		channelId: number,
		frameId: string,
	) {
		const frame = twistStampedFrame(twistStamped, channelId, frameId);
		this.socket.send(frame);
	}

	private async handleStringMessage(message: string) {
		const data = JSON.parse(message) as StringMessage;
		switch (data.op) {
			case "advertise": {
				const advertisement = data as AdvertiseMessage;
				for (const channel of advertisement.channels) {
					this.channelInfo.set(channel.id, channel);
					if (TOPICS_TO_SUBSCRIBE.includes(channel.topic)) {
						this.subcriptionToChannel(
							channel.id,
							channel.topic,
							channel.encoding,
						);
					}
				}
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
