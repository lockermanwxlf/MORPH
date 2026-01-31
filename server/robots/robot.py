from dataclasses import dataclass


@dataclass(frozen=True)
class Robot:
    name: str
    tunnel_host: str
    foxglove_port: int
