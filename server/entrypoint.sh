#!/usr/bin/env bash

export WG_QUICK_USERSPACE_IMPLEMENTATION=wireguard-go
export WG_THREADS=4

mkdir -p /etc/wireguard
if [ ! -f /etc/wireguard/publickey ]; then
    echo "Generating WireGuard keypair..."
    (umask 077 && wg genkey > /etc/wireguard/privatekey)
    wg pubkey < /etc/wireguard/privatekey > /etc/wireguard/publickey
fi

PRIV_KEY=$(cat /etc/wireguard/privatekey 2>/dev/null)

echo "Writing WireGuard configuration..."
cat <<EOF > /etc/wireguard/wg0.conf
[Interface]
Address = 172.16.0.1/12
ListenPort = $WG_PORT
PrivateKey = $PRIV_KEY
MTU = 1280
PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -t nat -A POSTROUTING -o eth0 -j MASQUERADE
PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -t nat -D POSTROUTING -o eth0 -j MASQUERADE
EOF

echo "Starting WireGuard interface..."
wg-quick down wg0 2>/dev/null || true
wg-quick up wg0

echo "Starting wstunnel..."
wstunnel server --restrict-to localhost:$WG_PORT wss://0.0.0.0:$WG_PORT &
WSTUNNEL_PID=$!

echo "Starting FastAPI server..."
uvicorn main:app --host 0.0.0.0 --port 8000 &
UVICORN_PID=$!

trap "kill $WSTUNNEL_PID $UVICORN_PID" SIGTERM SIGINT

wait