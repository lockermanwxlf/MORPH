from dataclasses import dataclass


@dataclass
class Robot:
    ip_addresses: list[str]
    port: int
    device_id: str
