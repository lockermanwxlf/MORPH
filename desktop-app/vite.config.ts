import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import tanstackRouter from "@tanstack/router-plugin/vite";

import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import electron from "vite-plugin-electron";
import electronRenderer from "vite-plugin-electron-renderer";
import tsconfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
	plugins: [
		devtools(),
		tsconfigPaths({ projects: ["./tsconfig.json"] }),
		tailwindcss(),
		viteReact(),
		tanstackRouter({
			routesDirectory: "src/routes",
			generatedRouteTree: "src/routeTree.gen.ts",
		}),
		electron([
			{
				entry: "electron/main.ts",
			},
			{
				entry: "electron/preload.ts",
				onstart(args) {
					args.reload();
				},
			},
		]),
		electronRenderer(),
	],
});

export default config;
