<script lang="ts">
	import { goto } from "$app/navigation";
	import { cubicOut } from "svelte/easing";
	import type { TransitionConfig } from "svelte/transition";
	import { robotConnection } from "$lib/robot-connection.svelte";

	type Props = {
		showProceedWithoutRobot?: boolean;
		onProceedWithoutRobot?: () => void;
	};

	let {
		showProceedWithoutRobot = false,
		onProceedWithoutRobot,
	}: Props = $props();

	const WIFI_PROVISIONING_CHAR_UUID = "eaf9ab55-aea7-4b8a-98b1-5b9b139f41e3";
	const NETWORK_STATUS_CHAR_UUID = "a2169d6e-07aa-457e-8139-19803dbd6bfd";

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

	const FE99_SERVICE = 0xfe99;

	let host = $state("");
	let isBluetoothAvailable = $state(false);
	let isScanning = $state(false);
	let scanError = $state("");
	let isConnecting = $state(false);
	let selectedBluetoothDevice = $state<BrowserBluetoothDevice | null>(null);
	let pairedDevice = $state<ScannedDevice | null>(null);
	let isWifiDialogOpen = $state(false);
	let isSavingWifi = $state(false);
	let wifiError = $state("");
	let ssid = $state("");
	let password = $state("");

	function toDeviceRecord(device: BrowserBluetoothDevice): ScannedDevice {
		return {
			id: device.id,
			name: device.name?.trim() || "Unnamed device",
			// Browsers intentionally hide BLE MAC addresses, so we surface the stable device id instead.
			addressLabel: device.id,
			ssid: "",
			privateIp: "",
			networkState: null,
		};
	}

	function blurFade(
		_node: Element,
		{ delay = 0, duration = 220, easing = cubicOut } = {},
	): TransitionConfig {
		return {
			delay,
			duration,
			easing,
			css: (t) => {
				const softened = t * t;
				return `
					opacity: ${t};
					backdrop-filter: blur(${softened * 24}px);
					-webkit-backdrop-filter: blur(${softened * 24}px);
				`;
			},
		};
	}

	function dialogPop(
		_node: Element,
		{ delay = 0, duration = 260, easing = cubicOut } = {},
	): TransitionConfig {
		return {
			delay,
			duration,
			easing,
			css: (t) => `
				opacity: ${t};
				transform: translateY(${(1 - t) * 18}px) scale(${0.96 + t * 0.04});
			`,
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

			isWifiDialogOpen = false;
			password = "";
		} catch (error) {
			console.error(error);
			wifiError = "Failed to send WiFi credentials to the device.";
		} finally {
			isSavingWifi = false;
		}
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
			if (
				error instanceof DOMException &&
				error.name === "NotFoundError"
			) {
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

	async function connectToRobot() {
		isConnecting = true;
		try {
			await robotConnection.connect(host);
		} finally {
			isConnecting = false;
		}
	}

	$effect(() => {
		isBluetoothAvailable =
			typeof navigator !== "undefined" &&
			typeof window !== "undefined" &&
			window.isSecureContext &&
			"bluetooth" in navigator;
	});
</script>

<svelte:head>
	<title>My Robot | MORPH</title>
	<meta
		name="description"
		content="Connect to a MORPH device from the Control Hub."
	/>
</svelte:head>

<div
	class="flex min-h-dvh items-center justify-center px-6 py-6 sm:px-10 sm:py-8 lg:px-16 lg:py-10"
>
	<section
		class="flex min-h-[70vh] w-full max-w-2xl flex-col rounded-4xl border p-6 sm:p-8 lg:p-10"
		style:border-color="var(--border-soft)"
		style:background="var(--surface-solid)"
	>
		<div>
			<h1 class="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
				Connect to a device to get started
			</h1>

			<form
				class="mt-8"
				onsubmit={(event) => {
					event.preventDefault();
					void connectToRobot();
				}}
			>
				<label class="block">
					<span
						class="mb-3 block text-sm font-medium"
						style:color="var(--muted-text)"
					>
						IP Address:
					</span>
					<input
						bind:value={host}
						type="text"
						placeholder="192.168.x.x, 192.168.x.x:xxxx"
						class="w-full rounded-2xl border px-4 py-3 text-base outline-none"
						style:border-color="var(--border-soft)"
						style:background="var(--surface-soft)"
						style:color="var(--page-text)"
					/>
				</label>

				{#if isBluetoothAvailable}
					{#if pairedDevice}
						<div
							class="mt-6 rounded-2xl border px-4 py-4"
							style:border-color="var(--border-soft)"
							style:background="var(--surface-soft)"
						>
							<div class="flex items-start justify-between gap-4">
								<div>
									<div class="text-sm font-medium">
										{pairedDevice.name}
									</div>
									<div
										class="mt-1 text-sm"
										style:color="var(--muted-text)"
									>
										Device ID: {pairedDevice.addressLabel}
									</div>
									<div
										class="mt-1 text-sm"
										style:color="var(--muted-text)"
									>
										SSID:
										{pairedDevice.ssid || "Not connected"}
									</div>
									<div
										class="mt-1 text-sm"
										style:color="var(--muted-text)"
									>
										Private IP:
										{pairedDevice.privateIp || "Unavailable"}
									</div>
								</div>
								<button
									type="button"
									class="inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold"
									style:background="rgba(239, 68, 68, 0.14)"
									style:color="#dc2626"
									aria-label="Unpair device"
									onclick={() => {
										selectedBluetoothDevice = null;
										pairedDevice = null;
										isWifiDialogOpen = false;
										scanError = "";
										wifiError = "";
									}}
								>
									X
								</button>
							</div>
							<button
								type="button"
								class="mt-4 inline-flex rounded-2xl px-4 py-3 text-sm font-semibold transition"
								style:background="var(--accent-soft)"
								style:color="var(--accent)"
								onclick={() => {
									wifiError = "";
									ssid = pairedDevice?.ssid ?? "";
									password = "";
									isWifiDialogOpen = true;
								}}
							>
								Set Device WiFi
							</button>
						</div>
					{:else}
						<button
							type="button"
							onclick={scanForDevices}
							class="mt-6 inline-flex rounded-2xl px-5 py-4 text-base font-semibold transition"
							style:background="var(--accent)"
							style:color="var(--page-bg)"
							disabled={isScanning}
						>
							{isScanning ? "Connecting..." : "Connect by Bluetooth"}
						</button>
					{/if}
				{:else}
					<p
						class="mt-6 max-w-xl text-sm leading-6"
						style:color="var(--muted-text)"
					>
						If you don't know the IP of your device, you can use a
						browser with Bluetooth support like Chrome, Edge, or Opera
						to connect automatically.
					</p>
				{/if}

				{#if scanError}
					<p class="mt-4 text-sm text-red-500">{scanError}</p>
				{/if}

				{#if robotConnection.error}
					<p class="mt-4 text-sm text-red-500">{robotConnection.error}</p>
				{/if}

				{#if robotConnection.status === "connected"}
					<p class="mt-4 text-sm" style:color="var(--muted-text)">
						Connected to {robotConnection.lastConnectedHost}
					</p>
				{/if}

				<div class="mt-8 flex items-center justify-end gap-3">
					{#if showProceedWithoutRobot}
						<button
							type="button"
							class="text-sm mr-4 font-medium transition hover:underline"
							style:background="transparent"
							style:color="var(--muted-text)"
							onclick={() => onProceedWithoutRobot?.()}
						>
							Proceed without robot
						</button>
					{/if}
					<button
						type="submit"
						class="rounded-full px-6 py-3 text-sm font-semibold transition"
						style:background="var(--accent)"
						style:color="var(--page-bg)"
						disabled={isConnecting || robotConnection.status === "connecting"}
					>
						{isConnecting || robotConnection.status === "connecting"
							? "Connecting..."
							: robotConnection.status === "connected"
								? "Reconnect"
								: "Connect"}
					</button>
				</div>
			</form>
		</div>
	</section>
</div>

{#if isWifiDialogOpen}
	<div
		class="fixed backdrop-blur-xl inset-0 z-50 flex items-center justify-center px-6 py-6"
		style:background="rgba(15, 23, 42, 0.45)"
		transition:blurFade
	>
		<div
			class="w-full max-w-md rounded-4xl border p-6 sm:p-8"
			style:border-color="var(--border-soft)"
			style:background="var(--surface-solid)"
			transition:dialogPop
		>
			<div>
				<h2 class="text-2xl font-semibold">Set Device WiFi</h2>
				<p
					class="mt-2 text-sm leading-6"
					style:color="var(--muted-text)"
				>
					Enter the network details you want the device to use.
				</p>
			</div>

			<label class="mt-6 block">
				<span
					class="mb-3 block text-sm font-medium"
					style:color="var(--muted-text)"
				>
					SSID (Network Name)
				</span>
				<input
					bind:value={ssid}
					type="text"
					class="w-full rounded-2xl border px-4 py-3 text-base outline-none"
					style:border-color="var(--border-soft)"
					style:background="var(--surface-soft)"
					style:color="var(--page-text)"
				/>
			</label>

			<label class="mt-5 block">
				<span
					class="mb-3 block text-sm font-medium"
					style:color="var(--muted-text)"
				>
					Password
				</span>
				<input
					bind:value={password}
					type="password"
					class="w-full rounded-2xl border px-4 py-3 text-base outline-none"
					style:border-color="var(--border-soft)"
					style:background="var(--surface-soft)"
					style:color="var(--page-text)"
				/>
			</label>

			{#if wifiError}
				<p class="mt-4 text-sm text-red-500">{wifiError}</p>
			{/if}

			<div class="mt-6 flex justify-end gap-3">
				<button
					type="button"
					class="rounded-2xl px-4 py-3 text-sm font-medium"
					style:background="var(--surface-soft)"
					disabled={isSavingWifi}
					onclick={() => {
						isWifiDialogOpen = false;
						wifiError = "";
					}}
				>
					Cancel
				</button>
				<button
					type="button"
					class="rounded-2xl px-4 py-3 text-sm font-semibold"
					style:background="var(--accent)"
					style:color="var(--page-bg)"
					disabled={isSavingWifi}
					onclick={saveWifiCredentials}
				>
					{isSavingWifi ? "Saving..." : "Save WiFi"}
				</button>
			</div>
		</div>
	</div>
{/if}
