export interface PoseWithCovariance {
    pose: {
        position: {
            x: number,
            y: number,
            z: number
        },
        orientation: {
            x: number,
            y: number,
            z: number,
            w: number
        }
    }
}