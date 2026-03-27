import { createFileRoute } from "@tanstack/react-router";
import { LidarView } from "@/components/LidarView";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<LidarView />
		</div>
	);
}
