import json
import stat

from foxglove.messages.twist_stamped import TwistStamped


class DiffDrive:
    @staticmethod
    def make_advertisement_frame(channel_id: int):
        message = {
            "op": "advertise",
            "channels": [
                {
                    "id": channel_id,
                    "topic": "/diff_drive_base/cmd_vel",
                    "encoding": "json",
                    "schemaName": "geometry_msgs/msg/TwistStamped",
                }
            ],
        }
        return json.dumps(message)

    @staticmethod
    def make_command_frame(twist_stamped: TwistStamped, channel_id: int, frame_id: str):
        return twist_stamped.to_frame(channel_id, frame_id)
