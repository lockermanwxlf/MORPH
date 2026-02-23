import { createFileRoute } from "@tanstack/react-router";
import { BluetoothDeviceList } from "@/components/BluetoothDeviceList";

export const Route = createFileRoute("/")({ component: App });

function App() {
	return (
		<div className="flex w-full flex-1 px-4 pb-4 pt-2 sm:px-6 sm:pb-6">
			<div className="mx-auto w-full max-w-6xl">
				<BluetoothDeviceList />
			</div>
		</div>
	);
}
