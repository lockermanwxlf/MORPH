export interface TwistStamped {
	linearX: number;
	linearY: number;
	linearZ: number;
	angularX: number;
	angularY: number;
	angularZ: number;
	seconds: number;
	nanoseconds: number;
}

export function twistStampedFrame(
	twistStamped: TwistStamped,
	channelId: number,
	frameId: string,
) {
	const data = {
		header: {
			stamp: {
				sec: twistStamped.seconds,
				nanosec: twistStamped.nanoseconds,
			},
			frame_id: frameId,
		},
		twist: {
			linear: {
				x: twistStamped.linearX,
				y: twistStamped.linearY,
				z: twistStamped.linearZ,
			},
			angular: {
				x: twistStamped.angularX,
				y: twistStamped.angularY,
				z: twistStamped.angularZ,
			},
		},
	};

	const dataStr = JSON.stringify(data);
	const encoder = new TextEncoder();
	const dataBytes = encoder.encode(dataStr);
	const buffer = new ArrayBuffer(1 + 4 * dataBytes.length);
	const view = new DataView(buffer);
	view.setUint8(0, 0x01);
	view.setUint32(1, channelId, true);
	const result = new Uint8Array(buffer);
	result.set(dataBytes, 5);
	return result;
}
