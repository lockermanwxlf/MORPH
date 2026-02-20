#!/usr/bin/env python3
import rclpy
from rclpy.node import Node
from geometry_msgs.msg import TwistStamped

class CmdVelStampedPub(Node):
    def __init__(self):
        super().__init__('cmd_vel_stamped_pub')
        self.pub = self.create_publisher(TwistStamped, '/diff_drive_base/cmd_vel', 10)
        self.timer = self.create_timer(0.1, self.tick)  # 10 Hz
        self.lin_x = 2.0
        self.ang_z = 0.0

    def tick(self):
        msg = TwistStamped()
        msg.header.stamp = self.get_clock().now().to_msg()
        msg.header.frame_id = 'base_link'
        msg.twist.linear.x = self.lin_x
        msg.twist.angular.z = self.ang_z
        self.pub.publish(msg)

def main():
    rclpy.init()
    node = CmdVelStampedPub()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()

if __name__ == '__main__':
    main()
