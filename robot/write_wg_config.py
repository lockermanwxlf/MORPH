import os
from time import sleep
import requests
from wireguard_tools import WireguardKey

server_url = os.environ["SERVER_URL"]
private_key = WireguardKey.generate()
public_key = private_key.public_key()

payload = {
    "public_key": str(public_key),
    "device_name": "my_device",
}

while True:
    try:
        response = requests.post(f"{server_url}/robot/connect", json=payload)
        break
    except requests.ConnectionError:
        print("Connection error, retrying...")
        sleep(2)
    except Exception as e:
        print(f"An error occurred: {e}")
        sleep(7)

res = response.json()

cfg = f"""
[Interface]
PrivateKey = {str(private_key)}
Address = {res["assigned_ip"]}/32
MTU = 1280

[Peer]
PublicKey = {res["server_pk"]}
Endpoint = {os.environ["WG_ENDPOINT"]}:{os.environ["WG_PORT"]}
AllowedIPs = 172.16.0.0/12
PersistentKeepalive = 25
"""

with open("/etc/wireguard/wg0.conf", "w") as f:
    f.write(cfg)
