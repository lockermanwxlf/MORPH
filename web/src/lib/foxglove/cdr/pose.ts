import type { PoseWithCovariance } from "../types/pose.ts";
import { alignOffset } from "./util.ts";

function parsePoseWithCovarianceFromView(
    view: DataView,
    offset: number,
): PoseWithCovariance {

    // Pose
    // Position
    const x = view.getFloat64(offset, true);
    offset += 8;
    const y = view.getFloat64(offset, true);
    offset += 8;
    const z = view.getFloat64(offset, true);
    offset += 8;

    // Orientation quaternion
    const qx = view.getFloat64(offset, true);
    offset += 8;
    const qy = view.getFloat64(offset, true);
    offset += 8;
    const qz = view.getFloat64(offset, true);
    offset += 8;
    const qw = view.getFloat64(offset, true);

    return {
        pose: {
            position: {
                x, y, z
            },
            orientation: {
                x: qx,
                y: qy,
                z: qz,
                w: qw,
            }
        }
    };
}

export function parsePoseWithCovariance(cdr: Uint8Array): PoseWithCovariance {
    const view = new DataView(cdr.buffer, cdr.byteOffset, cdr.byteLength);
    let offset = 4; // Skip encapsulation header.

    offset = alignOffset(offset, 8);


    for (let i = -8; i < 64; i++) {
        const covValue = view.getFloat64(offset + i, true);
        console.log(`cov[${i}] = ${covValue}`);
    }


    return parsePoseWithCovarianceFromView(view, offset);
}

export function parsePoseWithCovarianceStamped(cdr: Uint8Array): PoseWithCovariance {
    const view = new DataView(cdr.buffer, cdr.byteOffset, cdr.byteLength);

    // Skip encapsulation header.
    let offset = 4;

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
    offset = alignOffset(offset, 8); // Align to 8 bytes after variable-length string.

    offset -= 4;
    return parsePoseWithCovarianceFromView(view, offset);

}