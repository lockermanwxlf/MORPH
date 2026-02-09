import { io, type Socket } from "socket.io-client";

class RobotConnection {
	private socket: Socket;

	constructor(socket: Socket) {
		this.socket = socket;
	}

	public connect(host: string, port: number): Promise<unknown> {
		if (!this.socket.connected) {
			this.socket.connect();
			this._wsConnected = true;
		}
		return new Promise((resolve) => {
			this.socket.emit(
				"connect_robot",
				{ host, port },
				(response: { status: "ok" | "error"; message: string }) => {
					if (response.status === "ok") {
						this._robotConnected = true;
					}
					resolve(response);
				},
			);
		});
	}

	public sendDiffDrive(
		direction: "forward" | "backward" | "left" | "right" | "stop",
	): void {
		this.socket.emit("diff_drive", { direction, speed: 100.0 });
	}

	public getSocket(): Socket {
		return this.socket;
	}
}

export const robotConnection = new RobotConnection(io());
