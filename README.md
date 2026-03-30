# **MORPH**

## A learning robot kit.

This repository contains:

* [desktop-app](desktop-app), which contains the user-facing desktop app
* [server](server), which contains the IPC process used by desktop-app to communicate with and discover robots
* [web](web), which eventually will contain the hosted website for consultation, and can maybe also replace the desktop app? ([1](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API))


## Quickstart

```{bash}
git clone https://github.com/oss-slu/MORPH
```

### Installing dependencies

```bash
cd server
uv sync
```

```bash
cd desktop-app
pnpm install
```

```bash
cd desktop-app/bt-scanner
uv sync
```

### Running dev build

```bash
cd desktop-app
pnpm dev
```

Robots are detected through BLE advertisements and mDNS service discovery. Both are handled in [robot/gatt-server.py](robot/gatt-server.py)

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
