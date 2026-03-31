from dataclasses import dataclass
import numbers


@dataclass
class LaserScan:
    angle_min: float
    angle_max: float
    angle_increment: float
    time_increment: float
    scan_time: float
    range_min: float
    range_max: float
    ranges: list[float]
    intensities: list[float]
