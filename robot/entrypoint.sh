#!/usr/bin/env bash
export WG_QUICK_USERSPACE_IMPLEMENTATION=wireguard-go
export WG_THREADS=4

uv run write_wg_config.py

start_udp() {
    wg-quick down wg0 2>/dev/null || true
    wg-quick up wg0   
}

start_tcp() {
    wg-quick down wg0 2>/dev/null || true
    wstunnel client -L udp://51820:localhost:$WG_PORT wss://$WG_ENDPOINT:$WG_PORT &
    WSTUNNEL_PID=$!
    sed -i "s/Endpoint = .*/Endpoint = 127.0.0.1:51820/" /etc/wireguard/wg0.conf
    wg-quick up wg0
}

check_connection() {
    # Check if we can ping the server's internal VPN IP
    ping -c 3 -W 5 $SERVER_VPN_IP > /dev/null 2>&1
}

start_udp

sleep 10

if check_connection; then
    echo "Success: Connected via UDP."
else
    start_tcp
    sleep 10
    if check_connection; then
        echo "Success: Connected via TCP Tunnel."
    else
        echo "Error: Both UDP and TCP failed. Check school firewall or server status."
    fi
fi

source /opt/ros/humble/setup.bash
ros2 launch foxglove_bridge foxglove_bridge_launch.xml address:=0.0.0.0