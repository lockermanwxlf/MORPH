const { spawn } = require("child_process");
const { app, BrowserWindow } = require("electron");
const path = require("path");

let pyProcess = null;
let serverPort = null;

function startBackend() {
	return new Promise((resolve, reject) => {
		if (app.isPackaged) {
			const exeName = process.platform === "win32" ? "exe.exe" : "exe";
			const exePath = path.join(process.resourcesPath, "backend", exeName);
			pyProcess = spawn(exePath);
		} else {
			pyProcess = spawn("uv", [
				"run",
				"--directory",
				"../../server",
				"uvicorn",
				"main:app",
				"--reload",
				"--port",
				"0",
			]);
		}

		pyProcess.stderr.on("data", (data) => {
			const output = data.toString();
			const match = output.match(/http:\/\/127\.0\.0\.1:(\d+)/);
			if (match) {
				serverPort = match[1];
				console.log(`Backend server is running on port ${serverPort}`);
				resolve(serverPort);
			}
		});

		pyProcess.stdout.on("data", (data) => {
			console.log(`server: ${data}`);
		});

		pyProcess.on("error", (err) => {
			reject(err);
		});
	});
}

function createWindow() {
	const win = new BrowserWindow({
		webPreferences: {
			preload: path.join(__dirname, "preload.js"),
			devTools: true,
		},
	});
	const startUrl =
		process.env.NODE_ENV === "development" || !app.isPackaged
			? "http://localhost:3000/dashboard"
			: `file://${app.getAppPath()}/index.html#/dashboard`;

	win.loadURL(startUrl);
	return win;
}

app.whenReady().then(async () => {
	const backendPort = await startBackend();
	process.env.BACKEND_PORT = backendPort;
	createWindow();
});

app.on("before-quit", () => {
	if (pyProcess) pyProcess.kill();
});
