from dataclasses import dataclass
import struct

from websockets import ClientConnection


def encode_twist_cdr(
    linear_x: float,
    linear_y: float,
    linear_z: float,
    angular_x: float,
    angular_y: float,
    angular_z: float,
) -> bytes:
    """Encode a geometry_msgs/msg/Twist message in ROS2 CDR format."""
    # ROS2 CDR encapsulation header (4 bytes):
    # - Byte 0: 0x00 (CDR_BE) or 0x01 (CDR_LE)
    # - Byte 1: 0x00 (plain CDR) or 0x01 (CDR with options)
    # - Bytes 2-3: options (0x0000 for plain CDR)
    # For ROS2, use little-endian CDR
    header = bytes([0x00, 0x01, 0x00, 0x00])

    # Twist message: two Vector3, each with 3 float64
    data = struct.pack(
        "<dddddd",  # 6 doubles, little-endian
        linear_x,
        linear_y,
        linear_z,
        angular_x,
        angular_y,
        angular_z,
    )
    return header + data


@dataclass
class Twist:
    linear_x: float
    linear_y: float
    linear_z: float
    angular_x: float
    angular_y: float
    angular_z: float


def encode_twist_msg(
    twist: Twist,
    channel_id: int,
) -> bytes:
    # Client Message Data format: [Opcode:1][ChannelID:4][Payload]
    header = struct.pack("<BI", 0x01, channel_id)
    payload = encode_twist_cdr(
        twist.linear_x,
        twist.linear_y,
        twist.linear_z,
        twist.angular_x,
        twist.angular_y,
        twist.angular_z,
    )

    return header + payload
