import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	redirect,
} from "@tanstack/react-router";
import Header from "../components/Header";

import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import { ConnectedDeviceProvider } from "../utils/ConnectedDeviceContext";
import { SocketProvider } from "../utils/SocketContext";
import "../styles.css";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	beforeLoad: async ({ location }) => {
		if (!window.setupAPI) {
			return;
		}

		const profile = await window.setupAPI.getProfile();
		const isSetupRoute = location.pathname.startsWith("/setup");

		if (isSetupRoute) {
			return;
		}

		if (!profile && !isSetupRoute) {
			throw redirect({ to: "/setup" });
		}
	},
	component: RootLayout,
});

function RootLayout() {
	return (
		<TanStackQueryProvider>
			<SocketProvider>
				<ConnectedDeviceProvider>
					<div className="min-h-dvh flex flex-col">
						<main className="flex min-h-0 flex-1">
							<Outlet />
						</main>
					</div>
				</ConnectedDeviceProvider>
			</SocketProvider>
		</TanStackQueryProvider>
	);
}
