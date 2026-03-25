import json
import struct
import traceback
from socketio import AsyncServer
import websockets
from websockets import ClientConnection, Subprotocol, State

from foxglove.capabilities.diff_drive import DiffDrive
from foxglove.constants import (
    ENCODING_CDR,
    MESSAGE_DATA_OPCODE,
    SERVER_FRAME_HEADER_LEN,
)
from foxglove.messages.twist_stamped import TwistStamped
from foxglove.protocol import parse_cdr_string
from robots.robot import Robot


class FoxgloveClient:
    def __init__(self, robot: Robot, sio: AsyncServer):
        self.robot = robot
        self.host = robot.ip_addresses[0]
        self.topics_to_subcribe = ["/map"]
        self.port = robot.port
        self.device_id = robot.device_id
        self._ws: ClientConnection | None = None
        self.channel_id = 1
        self.sio = sio
        self.listener_sid: str | None = None
        self.subscribed_topics = []
        self.connected = False

    async def log(self, msg: str):
        print("[FoxgloveClient]", msg)
        if self.listener_sid:
            await self.sio.emit("log", {"message": msg}, to=self.listener_sid)

    def _emit_ros_message(data):
        print(data)

    def set_listener_sid(self, sid: str | None):
        self.listener_sid = sid

    async def connect(self):
        if self._ws and (
            self._ws.protocol.state == State.OPEN
            or self._ws.protocol.state == State.CONNECTING
        ):
            return

        # Connect to Foxglove websocket
        url = f"ws://{self.host}:{self.port}"
        await self.log(f"Connecting to Foxglove websocket at {url}")
        self._ws = await websockets.connect(
            url, subprotocols=[Subprotocol("foxglove.sdk.v1")]
        )
        await self.log(f"Connected to Foxglove websocket at {url}")

        # Get server info
        await self.log("Getting server info")
        msg = await self._ws.recv()
        server_info = json.loads(msg)
        await self.log(f"Got server info: {server_info}")

        # Advertise channels
        await self.log("Advertising diff drive channel")
        await self._ws.send(DiffDrive.make_advertisement_frame(self.channel_id))
        await self.log("Advertised diff drive channel")
        self.connected = True
        await self._handle_messages()

    async def subscribe_to_channel(self, channel_id: int, topic: str) -> None:
        """
        Subscribe to a server-advertised channel.

        Args:
            channel_id: Channel ID to subscribe to
            topic: Topic name for logging
        """
        try:
            subscription_id = len(self.subscribed_topics) + 1
            subscribe_msg = {
                "op": "subscribe",
                "subscriptions": [
                    {
                        "id": subscription_id,
                        "channelId": channel_id,
                        "topic": topic,
                        "encoding": "json",
                    }
                ],
            }
            await self._ws.send(json.dumps(subscribe_msg))
            self.subscribed_topics[subscription_id] = topic
            await self.log(
                f"✓ Subscribed: {topic} (subId={subscription_id}, channelId={channel_id})"
            )
        except Exception as e:
            await self.log(f"⚠️ Error subscribing to {topic}: {e}")

    async def send_diff_drive_command(self, twist: TwistStamped):
        if not self._ws or self._ws.protocol.state != State.OPEN:
            raise ConnectionError("WebSocket is not connected")

        frame = DiffDrive.make_command_frame(twist, self.channel_id, "base_link")
        await self.log(f"Sending diff drive command: {twist}")
        await self._ws.send(frame)
        await self.log("Sent diff drive command")

    async def _handle_messages(self) -> None:
        """
        Handle incoming messages from the Foxglove server.

        Processes both text (JSON control messages) and binary (ROS2 data) frames.
        Automatically subscribes to configured topics when they are advertised.
        """
        if not self.connected or self._ws is None:
            await self.log("⚠️ Cannot handle messages - not connected")
            return

        try:
            async for message in self._ws:
                if not self._ws:
                    break

                try:
                    if isinstance(message, str):
                        await self._handle_text_message(message)
                    elif isinstance(message, (bytes, bytearray)):
                        await self._handle_binary_message(bytes(message))

                except json.JSONDecodeError as e:
                    await self.log(f"⚠️ JSON decode error: {e}")
                except Exception as e:
                    await self.log(f"⚠️ Message processing error: {e}")
                    traceback.print_exc()

        except Exception as e:
            await self.log(f"⚠️ Message handling error: {e}")
            traceback.print_exc()
            self.connected = False

    async def _handle_text_message(self, message: str) -> None:
        """
        Handle text (JSON) protocol messages from server.

        Processes control messages like 'advertise' and automatically subscribes
        to topics we're interested in.

        Args:
            message: JSON string message from server
        """
        data = json.loads(message)
        op = data.get("op")

        if op == "advertise":
            # Server is advertising available channels/topics
            channels = data.get("channels", [])
            await self.log(f"📋 Server advertised {len(channels)} channel(s)")

            for channel in channels:
                topic = channel.get("topic", "unknown")
                channel_id = channel.get("id")
                encoding = channel.get("encoding", "unknown")
                schema_name = channel.get("schemaName", "")

                # Store channel information
                self.channel_info[channel_id] = {
                    "topic": topic,
                    "encoding": encoding,
                    "schemaName": schema_name,
                }
                await self.log(
                    f" • {topic} (channel={channel_id}, encoding={encoding})"
                )

                # Auto-subscribe to topics we're interested in
                if topic in self.topics_to_subscribe:
                    await self.subscribe_to_channel(channel_id, topic)
        else:
            await self.log(f"→ Protocol message: {data}")

    async def _handle_binary_message(self, message_bytes: bytes) -> None:
        """
        Handle binary message frames from server.

        Parses ROS2 message data from binary frames and forwards to frontend.
        Supports both JSON and CDR encodings.

        Args:
            message_bytes: Binary frame data
        """
        if len(message_bytes) < SERVER_FRAME_HEADER_LEN:
            await self.log(f"⚠️ Short binary frame (len={len(message_bytes)})")
            return

        if message_bytes[0:1] != MESSAGE_DATA_OPCODE:
            await self.log(f"⚠️ Unknown opcode {message_bytes[0]:02x} in binary frame")
            return

        # Parse frame header
        channel_id = struct.unpack_from("<I", message_bytes, 1)[0]
        timestamp_ns = struct.unpack_from("<Q", message_bytes, 1 + 4)[0]
        payload = message_bytes[SERVER_FRAME_HEADER_LEN:]

        # Try to decode as JSON first
        try:
            txt = payload.decode("utf-8")
            maybe_json = json.loads(txt)
            self._emit_ros_message(
                {
                    "channel_id": channel_id,
                    "timestamp_ns": timestamp_ns,
                    "data": maybe_json,
                }
            )
            await self.log(f"→ [{channel_id}] JSON @ {timestamp_ns} ns: {maybe_json}")
            return
        except Exception:
            pass

        # Try CDR encoding for std_msgs/msg/String
        info = self.channel_info.get(channel_id, {})
        schema = info.get("schemaName")
        encoding = info.get("encoding")

        # Skip ROS log messages to reduce noise
        if schema == "rcl_interfaces/msg/Log":
            return

        if schema == "std_msgs/msg/String" and encoding == ENCODING_CDR:
            try:
                cdr_string = parse_cdr_string(payload)
                self._emit_ros_message(
                    {
                        "channel_id": channel_id,
                        "timestamp_ns": timestamp_ns,
                        "data": {"data": cdr_string},
                    }
                )
                await self.log(
                    f"→ [{channel_id}] CDR @ {timestamp_ns} ns: {cdr_string}"
                )
            except Exception:
                await self.log(
                    f"→ [{channel_id}] Unable to parse CDR String ({len(payload)}B)"
                )
        else:
            # Unknown encoding or schema
            head = payload[:32]
            self._emit_ros_message(
                {
                    "channel_id": channel_id,
                    "timestamp_ns": timestamp_ns,
                    "data": "<non-JSON payload>",
                }
            )
            await self.log(
                f"→ [{channel_id}] {schema or 'unknown'} with {encoding or 'unknown'} "
                f"encoding not decoded; first bytes: {head.hex()} …"
            )
