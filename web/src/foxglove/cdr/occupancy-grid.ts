import type { OccupancyGrid } from "../types/occupancy-grid.ts";
import { alignOffset } from "./util.ts";

function findDataStart(
	view: DataView,
	offset: number,
	width: number,
	height: number,
): {
	dataOffset: number;
	dataLength: number;
} | null {
	const expectedDataLength = width * height;
	for (const delta of [0, 4, 17]) {
		const candidateOffset = offset + delta;
		if (candidateOffset + 4 > view.byteLength) {
			break;
		}

		const dataLength = view.getUint32(candidateOffset, true);
		const remaining = view.byteLength - (candidateOffset + 4);
		if (dataLength > remaining) {
			continue;
		}
		if (expectedDataLength > 0 && dataLength !== expectedDataLength) {
			continue;
		}
		return {
			dataOffset: candidateOffset,
			dataLength,
		};
	}
	return null;
}

export function parseCdrOccupancyGrid(cdr: Uint8Array): OccupancyGrid {
	const view = new DataView(cdr.buffer, cdr.byteOffset, cdr.byteLength);
	let offset = 0;
	// Skip encapsulation header.
	offset += 4;

	// header.stamp (Time: sec + nanosec)
	const stampSeconds = view.getInt32(offset, true);
	offset += 4;
	const stampNs = view.getUint32(offset, true);
	offset += 4;

	// header.frame_id (string)
	const frameIdLength = view.getUint32(offset, true);
	offset += 4;
	const frameIdBytes = new Uint8Array(
		view.buffer,
		view.byteOffset + offset,
		frameIdLength - 1, // Exclude null terminator
	);
	const frameId = new TextDecoder().decode(frameIdBytes);
	offset += frameIdLength;
	offset = alignOffset(offset, 4); // Align to 4 bytes after variable-length string.

	// info.map_load_time (Time: sec + nanosec)
	offset += 8; // Skip info.map_load_time

	// info.resolution (float32)
	const resolution = view.getFloat32(offset, true);
	offset += 4;

	// info.width (uint32)
	const width = view.getUint32(offset, true);
	offset += 4;

	// info.height (uint32)
	const height = view.getUint32(offset, true);
	offset += 4;

	// Pose contains float64 members, so align to 8 bytes before skipping origin.
	offset = alignOffset(offset, 8);

	// info.origin (Pose)
	offset += 56; // Skip info.origin

	offset = alignOffset(offset, 4);

	let dataLength = view.getUint32(offset, true);
	const expectedDataLength = width * height;
	if (
		offset + 4 + dataLength > view.byteLength ||
		(expectedDataLength > 0 && dataLength !== expectedDataLength)
	) {
		const result = findDataStart(view, offset, width, height);
		if (result === null) {
			throw new Error(
				"Could not find valid data section in OccupancyGrid message",
			);
		}
		offset = result.dataOffset;
		dataLength = result.dataLength;
	}

	offset += 4;
	const data = new Int8Array(view.buffer, view.byteOffset + offset, dataLength);

	return {
		stamp: {
			sec: stampSeconds,
			nanosec: stampNs,
		},
		frameId,
		resolution,
		width,
		height,
		data,
	};
}
