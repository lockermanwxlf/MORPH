"""
Foxglove WebSocket protocol utilities.

This module contains functions for encoding, decoding, and parsing
messages according to the Foxglove WebSocket protocol specification
"""

import json
import struct
from typing import Dict, Any

from .constants import (
    MESSAGE_DATA_OPCODE,
    TWIST_STAMPED_SCHEMA,
    ENCODING_JSON,
    SCHEMA_ENCODING_ROS2MSG,
)


def build_json_payload_for_string(data_text: str) -> bytes:
    """
    Build JSON payload for std_msgs/msg/String message.

    For std_msgs/msg/String with encoding='json', the payload is:
    {"data":"<your text>"} encoded as UTF-8 bytes.

    Args:
        data_text: The string data to encode

    Returns:
        UTF-8 encoded JSON bytes
    """
    return json.dumps({"data": data_text}).encode("utf-8")


def parse_cdr_string(payload: bytes) -> str:
    """
    Parse CDR-encoded std_msgs/msg/String payload.

    CDR format structure (little-endian):
    [encapsulation_header(4 bytes)] [string_length(4 bytes)] [string_data(length bytes)]

    The encapsulation header format:
    - Bytes 0-1: CDR options/encoding (e.g., 0x00 0x00 for little-endian, no options)
    - Bytes 2-3: CDR version

    The string_length includes the null terminator, so actual text length is (string_length - 1)

    Args:
        payload: CDR-encoded bytes

    Returns:
        Decoded string data

    Raises:
        ValueError: If payload is invalid or truncated
    """
    if len(payload) < 8:
        return "<invalid CDR payload>"

    # Parse encapsulation header (first 4 bytes)
    # Typically: 0x00 0x00 (little-endian) followed by version bytes
    encap_header = struct.unpack("<I", payload[0:4])[0]

    # Read string length (little-endian uint32 at offset 4)
    # This length includes the null terminator
    string_length = struct.unpack("<I", payload[4:8])[0]

    if string_length == 0:
        return ""

    if len(payload) < 8 + string_length:
        return "<truncated CDR payload>"

    # Extract string data - exclude the null terminator (last byte)
    # The string_length includes the null terminator, so we use string_length - 1
    string_data = payload[8 : 8 + string_length - 1].decode("utf-8", errors="replace")
    return string_data


async def advertise_twist_channel(
    websocket, channel_id: int, topic: str = "/diff_drive_base/cmd_vel"
) -> None:
    """
    Advertise a client-publish channel for geometry_msgs/msg/TwistStamped.

    This function sends an advertise message to the Foxglove server indicating
    that this client will publish TwistStamped messages on the specified topic.

    Args:
        websocket: The WebSocket connection to send the message on
        channel_id: Unique channel ID for this topic
        topic: ROS2 topic name (default: /diff_drive_base/cmd_vel)

    Raises:
        Exception: If WebSocket send fails
    """
    advertise_message = {
        "op": "advertise",
        "channels": [
            {
                "id": channel_id,
                "topic": topic,
                "encoding": ENCODING_JSON,
                "schemaName": "geometry_msgs/msg/TwistStamped",
                "schemaEncoding": SCHEMA_ENCODING_ROS2MSG,
                "schema": TWIST_STAMPED_SCHEMA,
            }
        ],
    }
    await websocket.send(json.dumps(advertise_message))


def build_twist_stamped_frame(
    channel_id: int,
    linear_x: float = 0.0,
    linear_y: float = 0.0,
    linear_z: float = 0.0,
    angular_x: float = 0.0,
    angular_y: float = 0.0,
    angular_z: float = 0.0,
    frame_id: str = "base_link",
) -> bytes:
    """
    Build a binary frame for a TwistStamped message.

    Creates a complete Foxglove protocol frame ready to send over WebSocket.

    Args:
        channel_id: Channel ID for the command topic
        linear_x: Linear velocity in x direction (m/s)
        linear_y: Linear velocity in y direction (m/s)
        linear_z: Linear velocity in z direction (m/s)
        angular_x: Angular velocity around x axis (rad/s)
        angular_y: Angular velocity around y axis (rad/s)
        angular_z: Angular velocity around z axis (rad/s)
        frame_id: Reference frame ID (default: "base_link")

    Returns:
        Complete binary frame ready to send
    """
    # Build TwistStamped message
    twist_stamped_data = {
        "header": {"stamp": {"sec": 0, "nanosec": 0}, "frame_id": frame_id},
        "twist": {
            "linear": {"x": linear_x, "y": linear_y, "z": linear_z},
            "angular": {"x": angular_x, "y": angular_y, "z": angular_z},
        },
    }

    # Encode payload as JSON
    payload = json.dumps(twist_stamped_data).encode("utf-8")

    # Build frame: opcode + channel_id + payload
    frame = MESSAGE_DATA_OPCODE + struct.pack("<I", channel_id) + payload

    return frame


def _align_offset(offset: int, alignment: int) -> int:
    return offset + ((alignment - (offset % alignment)) % alignment)


def _find_occupancy_grid_data_start(
    payload: bytes, offset: int, width: int, height: int
) -> tuple[int, int] | None:
    expected_len = width * height

    for delta in range(0, 17, 4):
        candidate_offset = offset + delta
        if candidate_offset + 4 > len(payload):
            break

        data_len = struct.unpack_from("<I", payload, candidate_offset)[0]
        remaining = len(payload) - (candidate_offset + 4)
        if data_len > remaining:
            continue

        if expected_len > 0 and data_len == expected_len:
            return candidate_offset, data_len

        if data_len == remaining:
            return candidate_offset, data_len

    return None


def parse_cdr_occupancy_grid(payload: bytes) -> dict:
    """
    Parse CDR-encoded nav_msgs/msg/OccupancyGrid payload.

    CDR has alignment rules:
    - 4-byte types align to 4-byte boundaries
    - 8-byte types align to 8-byte boundaries
    - Strings have padding after them to align to 4 bytes

    Structure:
    [encapsulation(4)] [header: stamp(8) + frame_id_len(4) + frame_id + padding]
    [map_load_time(8)] [resolution(4)] [width(4)] [height(4)]
    [origin pose: position(24) + orientation(32)] [data_len(4) + data]

    Args:
        payload: CDR-encoded bytes

    Returns:
        Dictionary with grid info and metadata
    """
    if len(payload) < 4:
        return {"error": "invalid payload"}

    offset = 0

    # Skip encapsulation header
    offset += 4

    # Parse header.stamp (Time: sec + nanosec)
    if offset + 8 > len(payload):
        return {"error": "truncated header"}
    stamp_sec = struct.unpack_from("<i", payload, offset)[0]
    stamp_nanosec = struct.unpack_from("<I", payload, offset + 4)[0]
    offset += 8

    # Parse header.frame_id (string)
    if offset + 4 > len(payload):
        return {"error": "truncated frame_id"}
    frame_id_len = struct.unpack_from("<I", payload, offset)[0]
    offset += 4

    if offset + frame_id_len > len(payload):
        return {"error": "truncated frame_id data"}
    frame_id = payload[offset : offset + frame_id_len - 1].decode(
        "utf-8", errors="replace"
    )
    offset += frame_id_len

    # CDR alignment: after variable-length string, align to 4 bytes.
    offset = _align_offset(offset, 4)

    # Parse info.map_load_time (Time)
    if offset + 8 > len(payload):
        return {"error": "truncated map_load_time"}
    offset += 8  # Skip map_load_time

    # Parse info.resolution (float32)
    if offset + 4 > len(payload):
        return {"error": "truncated resolution"}
    resolution = struct.unpack_from("<f", payload, offset)[0]
    offset += 4

    # Parse info.width (uint32)
    if offset + 4 > len(payload):
        return {"error": "truncated width"}
    width = struct.unpack_from("<I", payload, offset)[0]
    offset += 4

    # Parse info.height (uint32)
    if offset + 4 > len(payload):
        return {"error": "truncated height"}
    height = struct.unpack_from("<I", payload, offset)[0]
    offset += 4

    # Pose contains float64 members, so align before skipping origin.
    offset = _align_offset(offset, 8)

    # Parse info.origin (Pose) - skip for now (position + orientation)
    if offset + 56 > len(payload):  # 3 float64 (24) + 4 float64 (32)
        return {"error": "truncated origin"}
    offset += 56

    # Sequences are aligned to 4 bytes. Some publishers appear to leave an
    # additional aligned gap before the data sequence, so recover by scanning
    # the next few aligned candidates for a plausible length.
    offset = _align_offset(offset, 4)

    # Parse data array (int8[])
    if offset + 4 > len(payload):
        return {
            "error": (
                f"truncated data length at offset {offset}, payload_len={len(payload)}"
            )
        }

    data_len = struct.unpack_from("<I", payload, offset)[0]
    expected_len = width * height
    needs_recovery = offset + 4 + data_len > len(payload)
    if not needs_recovery and expected_len > 0 and data_len != expected_len:
        needs_recovery = True

    if needs_recovery:
        recovered = _find_occupancy_grid_data_start(payload, offset, width, height)
        if recovered is None:
            return {
                "error": (
                    f"truncated data (expected {data_len}, have {len(payload) - (offset + 4)}, "
                    f"offset={offset + 4}, payload_len={len(payload)}, width={width}, height={height})"
                )
            }
        offset, data_len = recovered

    offset += 4
    data = payload[offset : offset + data_len]

    return {
        "stamp": {"sec": stamp_sec, "nanosec": stamp_nanosec},
        "frame_id": frame_id,
        "resolution": resolution,
        "width": width,
        "height": height,
        "data_length": len(data),
        "data": list(struct.unpack(f"<{len(data)}b", data)) if len(data) > 0 else [],
    }
