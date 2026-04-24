<script lang="ts">
	import { getRobotConnectionContext } from "$lib/robot-connection.svelte";

	type Props = {
		isOpen?: boolean;
		title?: string;
	};

	let { isOpen = $bindable(false), title = "Connect to your robot" }: Props =
		$props();

	const robotConnection = getRobotConnectionContext();

	const WIFI_PROVISIONING_CHAR_UUID = "eaf9ab55-aea7-4b8a-98b1-5b9b139f41e3";
	const NETWORK_STATUS_CHAR_UUID = "a2169d6e-07aa-457e-8139-19803dbd6bfd";
	const FE99_SERVICE = 0xfe99;

	type BrowserBluetoothDevice = {
		id: string;
		name?: string | null;
		gatt?: {
			connect(): Promise<{
				getPrimaryService(service: string | number): Promise<{
					getCharacteristic(characteristic: string): Promise<{
						readValue(): Promise<DataView>;
						writeValue(value: BufferSource): Promise<void>;
					}>;
				}>;
			}>;
		};
	};

	type BrowserBluetooth = {
		requestDevice(options: {
			filters?: Array<{ services?: Array<string | number> }>;
			optionalServices?: Array<string | number>;
		}): Promise<BrowserBluetoothDevice>;
	};

	type ScannedDevice = {
		id: string;
		name: string;
		addressLabel: string;
		ssid: string;
		privateIp: string;
		networkState: number | null;
	};

	let dialogEl = $state<HTMLDialogElement | null>(null);
	let host = $state("");
	let isConnecting = $state(false);
	let isBluetoothAvailable = $state(false);
	let isScanning = $state(false);
	let scanError = $state("");
	let selectedBluetoothDevice = $state<BrowserBluetoothDevice | null>(null);
	let pairedDevice = $state<ScannedDevice | null>(null);
	let showWifiFields = $state(false);
	let isSavingWifi = $state(false);
	let wifiError = $state("");
	let ssid = $state("");
	let password = $state("");

	$effect(() => {
		isBluetoothAvailable =
			typeof navigator !== "undefined" &&
			typeof window !== "undefined" &&
			window.isSecureContext &&
			"bluetooth" in navigator;
	});

	$effect(() => {
		if (!dialogEl) {
			return;
		}

		if (isOpen && !dialogEl.open) {
			host = robotConnection.lastConnectedHost || robotConnection.host || host;
			dialogEl.showModal();
		}

		if (!isOpen && dialogEl.open) {
			dialogEl.close();
		}
	});

	function closeDialog() {
		isOpen = false;
		dialogEl?.close();
	}

	function toDeviceRecord(device: BrowserBluetoothDevice): ScannedDevice {
		return {
			id: device.id,
			name: device.name?.trim() || "Unnamed device",
			addressLabel: device.id,
			ssid: "",
			privateIp: "",
			networkState: null,
		};
	}

	function readJsonValue<T>(value: DataView): T | null {
		try {
			const bytes = new Uint8Array(
				value.buffer,
				value.byteOffset,
				value.byteLength,
			);
			const json = new TextDecoder().decode(bytes);
			return JSON.parse(json) as T;
		} catch (error) {
			console.error("Failed to decode characteristic value.", error);
			return null;
		}
	}

	async function readDeviceInfo(
		device: BrowserBluetoothDevice,
	): Promise<Pick<ScannedDevice, "ssid" | "privateIp" | "networkState">> {
		if (!device.gatt) {
			throw new Error("Bluetooth GATT is not available for this device.");
		}

		const server = await device.gatt.connect();
		const service = await server.getPrimaryService(FE99_SERVICE);
		const networkStatusChar = await service.getCharacteristic(
			NETWORK_STATUS_CHAR_UUID,
		);
		const networkStatusValue = await networkStatusChar.readValue();
		const networkStatus = readJsonValue<{
			ssid?: string;
			private_ip?: string;
			st?: number;
		}>(networkStatusValue);

		return {
			ssid: networkStatus?.ssid ?? "",
			privateIp: networkStatus?.private_ip ?? "",
			networkState: networkStatus?.st ?? null,
		};
	}

	async function scanForDevices() {
		scanError = "";

		if (!isBluetoothAvailable) {
			scanError = "Bluetooth is not available in this browser.";
			return;
		}

		isScanning = true;
		try {
			const bluetooth = (
				navigator as Navigator & { bluetooth?: BrowserBluetooth }
			).bluetooth;

			if (!bluetooth) {
				scanError = "Bluetooth is not available in this browser.";
				return;
			}

			const device = await bluetooth.requestDevice({
				filters: [{ services: [FE99_SERVICE] }],
				optionalServices: [FE99_SERVICE],
			});

			selectedBluetoothDevice = device;
			const deviceInfo = await readDeviceInfo(device);
			pairedDevice = { ...toDeviceRecord(device), ...deviceInfo };
			if (deviceInfo.privateIp) {
				host = deviceInfo.privateIp;
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === "NotFoundError") {
				scanError = "No device was selected.";
			} else {
				console.error(error);
				scanError =
					"Bluetooth scan failed. Check permissions and try again.";
			}
		} finally {
			isScanning = false;
		}
	}

	async function saveWifiCredentials() {
		wifiError = "";

		if (!selectedBluetoothDevice?.gatt) {
			wifiError = "No Bluetooth device is connected.";
			return;
		}

		if (!ssid.trim()) {
			wifiError = "SSID is required.";
			return;
		}

		isSavingWifi = true;
		try {
			const server = await selectedBluetoothDevice.gatt.connect();
			const service = await server.getPrimaryService(FE99_SERVICE);
			const wifiChar = await service.getCharacteristic(
				WIFI_PROVISIONING_CHAR_UUID,
			);
			const payload = new TextEncoder().encode(
				JSON.stringify({
					ssid: ssid.trim(),
					psk: password,
				}),
			);

			await wifiChar.writeValue(payload);
			if (pairedDevice) {
				pairedDevice = {
					...pairedDevice,
					ssid: ssid.trim(),
				};
			}
			showWifiFields = false;
			password = "";
		} catch (error) {
			console.error(error);
			wifiError = "Failed to send WiFi credentials to the device.";
		} finally {
			isSavingWifi = false;
		}
	}

	async function connectRobot() {
		isConnecting = true;
		try {
			const connected = await robotConnection.connect(host);
			if (connected) {
				closeDialog();
			}
		} finally {
			isConnecting = false;
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	onclose={() => {
		isOpen = false;
	}}
	class="rounded-2xl p-0 border border-(--border-soft)"
	style:width="min(92vw, 34rem)"
>
	<form
		method="dialog"
		class="p-5 sm:p-6 space-y-4"
		onsubmit={(event) => {
			event.preventDefault();
			void connectRobot();
		}}
	>
		<h2 class="text-xl font-semibold">{title}</h2>
		<p class="text-sm opacity-85">Enter your robot IP or use Bluetooth to discover and provision.</p>

		<input
			type="text"
			bind:value={host}
			placeholder="192.168.x.x or 192.168.x.x:8765"
			class="w-full rounded-xl border border-(--border-soft) px-3 py-2"
		/>

		<div class="space-y-3 rounded-xl bg-(--surface-soft) p-4">
			{#if isBluetoothAvailable}
				{#if pairedDevice}
					<div class="space-y-1 text-sm">
						<p class="font-medium">{pairedDevice.name}</p>
						<p class="opacity-80">Device ID: {pairedDevice.addressLabel}</p>
						<p class="opacity-80">SSID: {pairedDevice.ssid || "Not connected"}</p>
						<p class="opacity-80">Private IP: {pairedDevice.privateIp || "Unavailable"}</p>
					</div>
					<div class="flex flex-wrap gap-2">
						<button
							type="button"
							onclick={() => {
								wifiError = "";
								ssid = pairedDevice?.ssid ?? "";
								password = "";
								showWifiFields = !showWifiFields;
							}}
							class="rounded-full px-3 py-1.5 text-sm font-medium"
							style:background="var(--accent-soft)"
							style:color="var(--accent)"
						>
							{showWifiFields ? "Hide WiFi setup" : "Set Device WiFi"}
						</button>
						<button
							type="button"
							onclick={() => {
								selectedBluetoothDevice = null;
								pairedDevice = null;
								showWifiFields = false;
								wifiError = "";
								scanError = "";
							}}
							class="rounded-full px-3 py-1.5 text-sm font-medium border border-(--border-soft)"
						>
							Unpair
						</button>
					</div>
				{:else}
					<button
						type="button"
						onclick={scanForDevices}
						class="rounded-full px-4 py-2 text-sm font-medium"
						style:background="var(--accent)"
						style:color="var(--surface-solid)"
						disabled={isScanning}
					>
						{isScanning ? "Connecting..." : "Connect by Bluetooth"}
					</button>
				{/if}
			{:else}
				<div class="space-y-2">
					<button
						type="button"
						disabled
						class="rounded-full px-4 py-2 text-sm font-medium opacity-50 cursor-not-allowed"
						style:background="var(--surface-soft)"
						style:color="var(--muted-text)"
					>
						Connect by Bluetooth
					</button>
					<p class="text-sm opacity-80">
						Bluetooth is not available in this browser. Use Chrome, Edge, or Opera in a secure context.
					</p>
				</div>
			{/if}

			{#if showWifiFields}
				<div class="space-y-2 pt-2">
					<input
						type="text"
						bind:value={ssid}
						placeholder="SSID (network name)"
						class="w-full rounded-xl border border-(--border-soft) px-3 py-2"
					/>
					<input
						type="password"
						bind:value={password}
						placeholder="Password"
						class="w-full rounded-xl border border-(--border-soft) px-3 py-2"
					/>
					<div class="flex justify-end">
						<button
							type="button"
							onclick={saveWifiCredentials}
							disabled={isSavingWifi}
							class="rounded-full px-4 py-2 text-sm font-medium"
							style:background="var(--accent)"
							style:color="var(--surface-solid)"
						>
							{isSavingWifi ? "Saving..." : "Save WiFi"}
						</button>
					</div>
				</div>
			{/if}
		</div>

		{#if scanError}
			<p class="text-sm" style:color="#dc2626">{scanError}</p>
		{/if}
		{#if wifiError}
			<p class="text-sm" style:color="#dc2626">{wifiError}</p>
		{/if}
		{#if robotConnection.error}
			<p class="text-sm" style:color="#dc2626">{robotConnection.error}</p>
		{/if}

		<div class="flex items-center justify-end gap-2 pt-2">
			<button
				type="button"
				onclick={closeDialog}
				class="rounded-full border border-(--border-soft) px-4 py-2 text-sm font-medium"
			>
				Cancel
			</button>
			<button
				type="submit"
				disabled={isConnecting || robotConnection.status === "connecting"}
				class="rounded-full px-4 py-2 text-sm font-medium disabled:opacity-60"
				style:background="var(--accent)"
				style:color="var(--surface-solid)"
			>
				{isConnecting || robotConnection.status === "connecting"
					? "Connecting..."
					: "Connect"}
			</button>
		</div>
	</form>
</dialog>

<style>
	dialog {
		margin: auto;
	}

	dialog::backdrop {
		background: rgba(7, 10, 20, 0.45);
	}
</style>
