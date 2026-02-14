import os
import threading
import time
import uvicorn
import psutil
from main import app


def kill_orphan():
    parent = psutil.Process(os.getppid())
    while True:
        if not parent.is_running() or parent.status() == psutil.STATUS_ZOMBIE:
            os._exit(0)
        time.sleep(2)


if __name__ == "__main__":
    threading.Thread(target=kill_orphan, daemon=True).start()
    uvicorn.run(app, host="127.0.0.1", port=0)
