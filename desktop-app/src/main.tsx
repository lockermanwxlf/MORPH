import { RouterProvider } from "@tanstack/react-router";
import ReactDOM from "react-dom/client";
import { getRouter } from "./router";

const router = getRouter();

const rootElement = document.getElementById("root");

if (true) {
	console.log("H");
	const root = ReactDOM.createRoot(rootElement!);
	root.render(<RouterProvider router={router} />);
}
