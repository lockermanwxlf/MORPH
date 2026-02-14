const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
	backendPort: process.env.BACKEND_PORT,
});
