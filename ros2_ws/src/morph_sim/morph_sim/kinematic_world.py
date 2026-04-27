import math
from dataclasses import dataclass

import rclpy
from geometry_msgs.msg import TransformStamped, Twist, TwistStamped
from nav_msgs.msg import Odometry
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from tf2_ros import TransformBroadcaster


@dataclass(frozen=True)
class AxisAlignedBox:
    min_x: float
    max_x: float
    min_y: float
    max_y: float


def yaw_to_quaternion(yaw: float) -> tuple[float, float, float, float]:
    half_yaw = yaw * 0.5
    return (0.0, 0.0, math.sin(half_yaw), math.cos(half_yaw))


class KinematicWorld(Node):
    def __init__(self) -> None:
        super().__init__("kinematic_world")

        self.declare_parameter("update_rate_hz", 20.0)
        self.declare_parameter("command_timeout_sec", 0.75)
        self.declare_parameter("laser_frame", "laser")
        self.declare_parameter("base_frame", "base_link")
        self.declare_parameter("odom_frame", "odom")
        self.declare_parameter("laser_offset_x", 0.15)
        self.declare_parameter("laser_offset_y", 0.0)
        self.declare_parameter("laser_angle_min", -math.pi)
        self.declare_parameter("laser_angle_max", math.pi)
        self.declare_parameter("laser_beams", 360)
        self.declare_parameter("laser_range_min", 0.05)
        self.declare_parameter("laser_range_max", 8.0)
        self.declare_parameter("room_half_extent", 4.0)

        self.base_frame = self.get_parameter("base_frame").value
        self.odom_frame = self.get_parameter("odom_frame").value
        self.laser_frame = self.get_parameter("laser_frame").value
        self.laser_offset_x = float(self.get_parameter("laser_offset_x").value)
        self.laser_offset_y = float(self.get_parameter("laser_offset_y").value)
        self.laser_angle_min = float(self.get_parameter("laser_angle_min").value)
        self.laser_angle_max = float(self.get_parameter("laser_angle_max").value)
        self.laser_beams = int(self.get_parameter("laser_beams").value)
        self.laser_range_min = float(self.get_parameter("laser_range_min").value)
        self.laser_range_max = float(self.get_parameter("laser_range_max").value)
        room_half_extent = float(self.get_parameter("room_half_extent").value)

        wall = 0.05
        self.obstacles = [
            AxisAlignedBox(
                -room_half_extent,
                -room_half_extent + wall,
                -room_half_extent,
                room_half_extent,
            ),
            AxisAlignedBox(
                room_half_extent - wall,
                room_half_extent,
                -room_half_extent,
                room_half_extent,
            ),
            AxisAlignedBox(
                -room_half_extent,
                room_half_extent,
                -room_half_extent,
                -room_half_extent + wall,
            ),
            AxisAlignedBox(
                -room_half_extent,
                room_half_extent,
                room_half_extent - wall,
                room_half_extent,
            ),
            AxisAlignedBox(0.8, 1.5, -0.9, -0.2),
            AxisAlignedBox(-2.1, -1.3, 0.8, 1.8),
            AxisAlignedBox(-0.4, 0.4, 2.0, 2.6),
        ]

        self.x = 0.0
        self.y = 0.0
        self.yaw = 0.0
        self.linear_velocity = 0.0
        self.angular_velocity = 0.0
        self.last_command_time = self.get_clock().now()
        self.last_tick_time = self.get_clock().now()

        self.odom_pub = self.create_publisher(Odometry, "/diff_drive_base/odom", 10)
        self.odom_alias_pub = self.create_publisher(Odometry, "/odom", 10)
        self.scan_pub = self.create_publisher(LaserScan, "/scan", 10)
        self.tf_broadcaster = TransformBroadcaster(self)

        self.create_subscription(Twist, "/cmd_vel", self.handle_twist, 10)
        self.create_subscription(
            TwistStamped,
            "/diff_drive_base/cmd_vel",
            self.handle_twist_stamped,
            10,
        )

        update_rate = float(self.get_parameter("update_rate_hz").value)
        self.timer = self.create_timer(1.0 / update_rate, self.tick)

    def handle_twist(self, message: Twist) -> None:
        self.linear_velocity = float(message.linear.x)
        self.angular_velocity = float(message.angular.z)
        self.last_command_time = self.get_clock().now()

    def handle_twist_stamped(self, message: TwistStamped) -> None:
        self.handle_twist(message.twist)

    def maybe_decay_command(self) -> None:
        timeout_sec = float(self.get_parameter("command_timeout_sec").value)
        age = (self.get_clock().now() - self.last_command_time).nanoseconds / 1e9
        if age > timeout_sec:
            self.linear_velocity = 0.0
            self.angular_velocity = 0.0

    def tick(self) -> None:
        self.maybe_decay_command()
        now = self.get_clock().now()
        dt = max((now - self.last_tick_time).nanoseconds / 1e9, 1e-3)
        self.last_tick_time = now

        self.x += self.linear_velocity * math.cos(self.yaw) * dt
        self.y += self.linear_velocity * math.sin(self.yaw) * dt
        self.yaw += self.angular_velocity * dt
        self.yaw = math.atan2(math.sin(self.yaw), math.cos(self.yaw))

        self.publish_odometry(now)
        self.publish_tf(now)
        self.publish_scan(now)

    def publish_odometry(self, now) -> None:
        odom = Odometry()
        odom.header.stamp = now.to_msg()
        odom.header.frame_id = self.odom_frame
        odom.child_frame_id = self.base_frame
        odom.pose.pose.position.x = self.x
        odom.pose.pose.position.y = self.y
        odom.pose.pose.position.z = 0.0
        qx, qy, qz, qw = yaw_to_quaternion(self.yaw)
        odom.pose.pose.orientation.x = qx
        odom.pose.pose.orientation.y = qy
        odom.pose.pose.orientation.z = qz
        odom.pose.pose.orientation.w = qw
        odom.twist.twist.linear.x = self.linear_velocity
        odom.twist.twist.angular.z = self.angular_velocity
        self.odom_pub.publish(odom)
        self.odom_alias_pub.publish(odom)

    def publish_tf(self, now) -> None:
        transform = TransformStamped()
        transform.header.stamp = now.to_msg()
        transform.header.frame_id = self.odom_frame
        transform.child_frame_id = self.base_frame
        transform.transform.translation.x = self.x
        transform.transform.translation.y = self.y
        qx, qy, qz, qw = yaw_to_quaternion(self.yaw)
        transform.transform.rotation.x = qx
        transform.transform.rotation.y = qy
        transform.transform.rotation.z = qz
        transform.transform.rotation.w = qw
        self.tf_broadcaster.sendTransform(transform)

    def publish_scan(self, now) -> None:
        scan = LaserScan()
        scan.header.stamp = now.to_msg()
        scan.header.frame_id = self.laser_frame
        scan.angle_min = self.laser_angle_min
        scan.angle_max = self.laser_angle_max
        scan.angle_increment = (
            self.laser_angle_max - self.laser_angle_min
        ) / self.laser_beams
        scan.time_increment = 0.0
        scan.scan_time = self.timer.timer_period_ns / 1e9
        scan.range_min = self.laser_range_min
        scan.range_max = self.laser_range_max

        laser_x = (
            self.x
            + math.cos(self.yaw) * self.laser_offset_x
            - math.sin(self.yaw) * self.laser_offset_y
        )
        laser_y = (
            self.y
            + math.sin(self.yaw) * self.laser_offset_x
            + math.cos(self.yaw) * self.laser_offset_y
        )

        ranges: list[float] = []
        for beam_index in range(self.laser_beams):
            angle = self.yaw + self.laser_angle_min + beam_index * scan.angle_increment
            ray_dx = math.cos(angle)
            ray_dy = math.sin(angle)
            distance = self.laser_range_max
            for obstacle in self.obstacles:
                hit = self.intersect_ray_with_box(
                    laser_x,
                    laser_y,
                    ray_dx,
                    ray_dy,
                    obstacle,
                )
                if hit is not None:
                    distance = min(distance, hit)
            ranges.append(distance)

        scan.ranges = ranges
        self.scan_pub.publish(scan)

    def intersect_ray_with_box(
        self,
        origin_x: float,
        origin_y: float,
        dir_x: float,
        dir_y: float,
        obstacle: AxisAlignedBox,
    ) -> float | None:
        epsilon = 1e-9
        inv_dx = 1.0 / dir_x if abs(dir_x) > epsilon else math.inf
        inv_dy = 1.0 / dir_y if abs(dir_y) > epsilon else math.inf

        tx1 = (obstacle.min_x - origin_x) * inv_dx
        tx2 = (obstacle.max_x - origin_x) * inv_dx
        ty1 = (obstacle.min_y - origin_y) * inv_dy
        ty2 = (obstacle.max_y - origin_y) * inv_dy

        tmin = max(min(tx1, tx2), min(ty1, ty2))
        tmax = min(max(tx1, tx2), max(ty1, ty2))

        if tmax < 0.0 or tmin > tmax:
            return None

        hit = tmin if tmin >= 0.0 else tmax
        if hit < self.laser_range_min or hit > self.laser_range_max:
            return None
        return hit


def main(args=None) -> None:
    rclpy.init(args=args)
    node = KinematicWorld()
    rclpy.spin(node)
    node.destroy_node()
    rclpy.shutdown()


if __name__ == "__main__":
    main()
