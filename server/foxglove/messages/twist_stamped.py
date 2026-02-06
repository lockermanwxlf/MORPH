from dataclasses import dataclass
import json
import struct


@dataclass
class TwistStamped:
    seconds: int
    nanoseconds: int
    linear_x: float
    linear_y: float
    linear_z: float
    angular_x: float
    angular_y: float
    angular_z: float

    def to_frame(self, channel_id: int, frame_id: str):
        data = {
            "header": {
                "stamp": {"sec": self.seconds, "nanosec": self.nanoseconds},
                "frame_id": frame_id,
            },
            "twist": {
                "linear": {"x": self.linear_x, "y": self.linear_y, "z": self.linear_z},
                "angular": {
                    "x": self.angular_x,
                    "y": self.angular_y,
                    "z": self.angular_z,
                },
            },
        }
        payload = json.dumps(data).encode("utf-8")
        frame = b"\x01" + struct.pack("<I", channel_id) + payload
        return frame
