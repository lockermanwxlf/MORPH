import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	Outlet,
} from "@tanstack/react-router";
import Header from "../components/Header";

import TanStackQueryProvider from "../integrations/tanstack-query/root-provider";
import "../styles.css";

interface MyRouterContext {
	queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
	component: RootLayout,
});

function RootLayout() {
	return (
		<TanStackQueryProvider>
			<div className="min-h-dvh flex flex-col">
				<Header />
				<main className="flex min-h-0 flex-1">
					<Outlet />
				</main>
			</div>
		</TanStackQueryProvider>
	);
}
