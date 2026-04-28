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

function buildTwistStampedCdr(twistStamped: TwistStamped, channelId: number, frameId: string): Uint8Array {
    const encoder = new TextEncoder();
    const frameIdBytes = encoder.encode(frameId);
    
    // 1. Force explicit number casting to prevent NaN memory corruption
    const lx = Number(twistStamped.linearX) || 0.0;
    const ly = Number(twistStamped.linearY) || 0.0;
    const lz = Number(twistStamped.linearZ) || 0.0;
    const ax = Number(twistStamped.angularX) || 0.0;
    const ay = Number(twistStamped.angularY) || 0.0;
    const az = Number(twistStamped.angularZ) || 0.0;
    const sec = Math.floor(Number(twistStamped.seconds)) || 0;
    const nanosec = Math.floor(Number(twistStamped.nanoseconds)) || 0;

    // 2. Pre-allocate a safe buffer size (TwistStamped will never exceed 256 bytes)
    const buffer = new ArrayBuffer(256);
    const view = new DataView(buffer);
    const u8 = new Uint8Array(buffer);

    let offset = 0;

    // --- Foxglove WebSocket Header ---
    view.setUint8(offset, 0x01); offset += 1;
    view.setUint32(offset, channelId, true); offset += 4;

    // --- FastCDR Encapsulation Header ---
    const payloadStart = offset;
    view.setUint8(offset, 0x00); offset += 1; // dummy padding
    view.setUint8(offset, 0x01); offset += 1; // 0x01 = Little-endian
    view.setUint8(offset, 0x00); offset += 1; // options
    view.setUint8(offset, 0x00); offset += 1; // options

    // Procedural alignment helper relative to CDR payload start
    function align(alignment: number) {
        const current = offset - payloadStart;
        const remainder = current % alignment;
        if (remainder !== 0) {
            offset += (alignment - remainder);
        }
    }

    // --- Serialize std_msgs/Header ---
    align(4);
    view.setInt32(offset, sec, true); offset += 4;
    align(4);
    view.setUint32(offset, nanosec, true); offset += 4;

    align(4);
    // Length prefix includes the null terminator
    view.setUint32(offset, frameIdBytes.length + 1, true); offset += 4;
    u8.set(frameIdBytes, offset); offset += frameIdBytes.length;
    view.setUint8(offset, 0x00); offset += 1; // Null terminator

    // --- Serialize geometry_msgs/Twist ---
    align(4);
    view.setFloat64(offset, lx, true); offset += 8;
    view.setFloat64(offset, ly, true); offset += 8;
    view.setFloat64(offset, lz, true); offset += 8;
    view.setFloat64(offset, ax, true); offset += 8;
    view.setFloat64(offset, ay, true); offset += 8;
    view.setFloat64(offset, az, true); offset += 8;

    // Slice buffer to exact payload length and return as Uint8Array
    return new Uint8Array(buffer.slice(0, offset));
}

function buildTwistStampedJson(twistStamped: TwistStamped, channelId: number, frameId: string) {
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
	const buffer = new ArrayBuffer(1 + 4 + dataBytes.length);
	const view = new DataView(buffer);
	view.setUint8(0, 0x01);
	view.setUint32(1, channelId, true);
	const result = new Uint8Array(buffer);
	result.set(dataBytes, 5);
	return result;
}

export function twistStampedFrame(twistStamped: TwistStamped, channelId: number, frameId: string): Uint8Array {
	// When running the simulated robot in Docker on a Linux host, JSON doesn't work.
	return buildTwistStampedCdr(twistStamped, channelId, frameId);
}