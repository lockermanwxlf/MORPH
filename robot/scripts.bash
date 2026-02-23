avahi-publish -s "MORPH-$(cat /etc/hostname)" "_morph-ws._tcp" 8765 "DEVICE_ID=$(cat /etc/morph/devi
ce_id)"
bt-network -c "$MAC" nap
sudo dhclient bnep0
