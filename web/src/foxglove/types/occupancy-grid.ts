export interface OccupancyGrid {
	stamp: {
		sec: number;
		nanosec: number;
	};
	frameId: string;
	resolution: number;
	width: number;
	height: number;
	data: Int8Array;
}
