import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
	redirect,
	useLocation,
} from "@tanstack/react-router";
import Sidebar from "../components/Sidebar";

import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import { ConnectedDeviceProvider } from "../utils/ConnectedDeviceContext";
import { SocketProvider } from "../utils/SocketContext";
import "../styles.css";
import { SlamMapProvider } from "@/robot/SlamMap";

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
	const { pathname } = useLocation();
	const showSidebar = !pathname.startsWith("/setup");

	return (
		<TanStackQueryProvider>
			<SocketProvider>
				<ConnectedDeviceProvider>
					<SlamMapProvider>
						<div className="flex min-h-dvh">
							{showSidebar ? <Sidebar /> : null}
							<main className="flex min-h-0 min-w-0 flex-1">
								<Outlet />
							</main>
						</div>
					</SlamMapProvider>
				</ConnectedDeviceProvider>
			</SocketProvider>
		</TanStackQueryProvider>
	);
}
