import ipaddress

from robots.robot import Robot


class IpManager:
    def __init__(self):
        self.assigned_ips: dict[str, Robot] = {}
        self.cidr = "172.16.0.0/12"
        self.net = ipaddress.ip_network(self.cidr)
        self.min_ip = int(self.net.network_address) + 1
        self.max_ip = int(self.net.broadcast_address) - 1
        self.last_ip = self.min_ip

    def get_free_ip(self):
        self.last_ip += 1
        if self.last_ip > self.max_ip:
            raise Exception("No more available IP addresses in the pool.")
        ip_address = str(ipaddress.IPv4Address(self.last_ip))
        return ip_address

    def assign_ip(self, ip_address: str, robot: Robot):
        if ip_address in self.assigned_ips:
            raise Exception(f"IP address {ip_address} is already assigned")

        self.assigned_ips[ip_address] = robot
