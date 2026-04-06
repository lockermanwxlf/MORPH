import asyncio
import socket


proc: asyncio.subprocess.Process | None = None


async def restart_avahi(device_id: str) -> None:
    global proc
    if proc:
        try:
            proc.terminate()
            await proc.wait()
        except Exception as e:
            print("ERROR [restart_avahi] stopping existing process:", e)
    proc = 0

    hostname = socket.gethostname()
    service_name = f"MORPH-{hostname}"
    txt = f"DEVICE_ID={device_id}" if device_id else ""
    cmd = ["avahi-publish", "-s", service_name, "_morph-ws._tcp", "8765"]
    if txt:
        cmd.append(txt)
    print(f"Starting avahi-publish: {' '.join(cmd)}", flush=True)
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.DEVNULL,
    )
