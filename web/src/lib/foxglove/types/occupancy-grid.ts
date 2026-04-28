export interface OccupancyGrid {
	stamp: {
		sec: number;
		nanosec: number;
	};
	frameId: string;
	resolution: number;
	width: number;
	height: number;
	origin: {
		x: number;
		y: number;
		z: number;
	};
	data: Int8Array;
}
