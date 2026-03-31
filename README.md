# MORPH
A modular open-source robotic programming hub.
## Overview
MORPH consists of:
- `web/`: React + TanStack Start frontend (runs on port `3000`)
- `server/`: FastAPI + Socket.IO backend (runs on port `8000`)
- `ros2_ws/`: ROS 2 workspace and robot-side packages
The frontend proxies `/api/*` and `/socket.io/*` to the backend.
## Prerequisites
- Node.js 18+ (or latest LTS)
- `pnpm` (`npm i -g pnpm`)
- Python 3.11+ (recommended)
## Quick Start (Local Development)
### 1) Start backend
```bash
cd server
python -m venv .venv
# Windows PowerShell
.\.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate
pip install --upgrade pip
pip install -e .
uvicorn main:app --reload --port 8000
```

### 2) Start frontend (new terminal)
```bash
cd web
pnpm install
pnpm dev
```
Open: http://localhost:3000

> ROS 2 builds are only needed if you plan to run the robot stack locally. For UI-only testing, the steps above are sufficient.

## Support


## Purchase
- Please visit the following page to purchase our products:
….
- Business customers please contact us through the following email address:
…


## Copyright


## About
- MORPH is an open-source robotics platform.
….
- Our services include:
….
- Our code and circuit are open source. You can obtain the details and the latest information through visiting the following web site:

....
