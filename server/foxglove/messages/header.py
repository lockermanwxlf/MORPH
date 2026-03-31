from dataclasses import dataclass


@dataclass
class Stamp:
    sec: int
    nsec: int


@dataclass
class Header:
    seq: int
    stamp: Stamp
    frame_id: str
