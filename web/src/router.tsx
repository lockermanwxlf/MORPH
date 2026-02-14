import { isServer } from "@tanstack/react-query";
import {
	createBrowserHistory,
	createMemoryHistory,
	createRouter,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import * as TanstackQuery from "./integrations/tanstack-query/root-provider";
// Import the generated route tree
import { routeTree } from "./routeTree.gen";
import { isElectron } from "./utils/runtime";

// Create a new router instance
export const getRouter = () => {
	const rqContext = TanstackQuery.getContext();

	const history =
		isServer || isElectron ? createMemoryHistory() : createBrowserHistory();

	const router = createRouter({
		routeTree,
		history,
		context: {
			...rqContext,
		},

		defaultPreload: "intent",
	});

	setupRouterSsrQueryIntegration({
		router,
		queryClient: rqContext.queryClient,
	});

	return router;
};
