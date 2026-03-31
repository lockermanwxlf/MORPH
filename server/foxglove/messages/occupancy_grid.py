from dataclasses import dataclass


@dataclass
class Time:
    sec: int
    nsec: int


@dataclass
class Header:
    seq: int
    stamp: Time
    frame_id: str


@dataclass
class Point:
    x: float
    y: float
    z: float


@dataclass
class Quaternion:
    x: float
    y: float
    z: float
    w: float


@dataclass
class Pose:
    position: Point
    orientation: Quaternion


@dataclass
class MapMetaData:
    map_load_time: Time
    resolution: float
    width: int
    height: int
    origin: Pose


@dataclass
class OccupancyGrid:
    header: Header
    info: MapMetaData
    data: list[int]
