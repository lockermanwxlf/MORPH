from pathlib import Path

APP_PATH = "/com/morph/app"
SERVICE_PATH = "/com/morph/app/service0"
ADV_PATH = "/com/morph/advertisement0"

WIFI_CHAR_PATH = "/com/morph/app/service0/char0"
WIFI_STATUS_CHAR_PATH = "/com/morph/app/service0/char1"
PRIVATE_IP_CHAR_PATH = "/com/morph/app/service0/char2"

DEVICE_ID_PATH = Path("/etc/morph/device_id")
WIFI_INTERFACE = "wlan0"
MORPH_LOCAL_NAME = "Morph"
MORPH_SERVICE_TYPE = "_morph-ws._tcp"
MORPH_SERVICE_PORT = "8765"

SERVICE_UUID = "fe99"
WIFI_CHAR_UUID = "eaf9ab55-aea7-4b8a-98b1-5b9b139f41e3"
WIFI_STATUS_CHAR_UUID = "a2169d6e-07aa-457e-8139-19803dbd6bfd"
PRIVATE_IP_CHAR_UUID = "2b6a9f48-4f8f-4f9f-9fd5-8e04b7d1c0f4"

ADV_MIN_INTERVAL_MS = 200
ADV_MAX_INTERVAL_MS = 300
