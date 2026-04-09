<script lang="ts">
    import type { TwistStamped } from "../foxglove/types/twist-stamped.ts";
    import { getRobotConnectionContext } from "$lib/robot-connection.svelte";

    let keyboardState = $state({
        w: false,
        a: false,
        s: false,
        d: false,
    });
    function handleKeyDown(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key in keyboardState) {
            keyboardState = {
                ...keyboardState,
                [key]: true,
            };
        }
    }
    function handleKeyUp(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (key in keyboardState) {
            keyboardState = {
                ...keyboardState,
                [key]: false,
            };
        }
    }
    const connection = getRobotConnectionContext();
    $effect(() => {
        if (!connection.client || connection.status !== "connected") return;

        const wDiff = keyboardState.w ? 1 : 0;
        const sDiff = keyboardState.s ? -1 : 0;
        const aDiff = keyboardState.a ? 1 : 0;
        const dDiff = keyboardState.d ? -1 : 0;
        const twist: TwistStamped = {
            linearX: wDiff + sDiff,
            linearY: 0,
            linearZ: 0,
            angularX: 0,
            angularY: 0,
            angularZ: aDiff + dDiff,
            seconds: 0,
            nanoseconds: 0,
        };
        connection.client?.sendTwistStamped(twist);
        const interval = setInterval(() => {
            connection.client?.sendTwistStamped(twist);
        }, 100);

        return () => clearInterval(interval);
    });
</script>

<svelte:window on:keydown={handleKeyDown} on:keyup={handleKeyUp} />

<div class="grid grid-cols-3 grid-rows-2 gap-2 w-32 h-32">
    <div
        class="flex items-center col-start-2 justify-center rounded bg-(--accent-soft) transition-all duration-150 cursor-default"
        class:active={keyboardState.w}
        class:pressed={keyboardState.w}
    >
        W
    </div>
    <div
        class="flex items-center row-start-1 justify-center rounded bg-(--accent-soft) transition-all duration-150 cursor-default"
        class:active={keyboardState.a}
        class:pressed={keyboardState.a}
    >
        A
    </div>
    <div
        class="flex items-center row-start-2 col-start-2 justify-center rounded bg-(--accent-soft) transition-all duration-150 cursor-default"
        class:active={keyboardState.s}
        class:pressed={keyboardState.s}
    >
        S
    </div>
    <div
        class="flex items-center row-start-1 col-start-3 justify-center rounded bg-(--accent-soft) transition-all duration-150 cursor-default"
        class:active={keyboardState.d}
        class:pressed={keyboardState.d}
    >
        D
    </div>
</div>

<style>
    div.pressed {
        background-color: var(--accent);
        color: var(--surface-solid);
        transform: scale(0.95);
        box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.2);
    }
</style>
