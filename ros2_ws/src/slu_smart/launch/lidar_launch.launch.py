#!/usr/bin/env python3

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import Node


def generate_launch_description():
    # --- LiDAR driver args ---
    serial_port = LaunchConfiguration("serial_port")
    serial_baudrate = LaunchConfiguration("serial_baudrate")
    lidar_frame = LaunchConfiguration("lidar_frame")
    inverted = LaunchConfiguration("inverted")
    angle_compensate = LaunchConfiguration("angle_compensate")
    scan_mode = LaunchConfiguration("scan_mode")

    # --- Static TF args (base_link -> lidar_frame) ---
    tf_x = LaunchConfiguration("tf_x")
    tf_y = LaunchConfiguration("tf_y")
    tf_z = LaunchConfiguration("tf_z")
    tf_roll = LaunchConfiguration("tf_roll")
    tf_pitch = LaunchConfiguration("tf_pitch")
    tf_yaw = LaunchConfiguration("tf_yaw")
    parent_frame = LaunchConfiguration("parent_frame")

    return LaunchDescription([
        # LiDAR settings
        DeclareLaunchArgument("serial_port", default_value="/dev/ttyUSB0"),
        DeclareLaunchArgument("serial_baudrate", default_value="115200"),  # A1 default
        DeclareLaunchArgument("lidar_frame", default_value="laser"),       # child frame
        DeclareLaunchArgument("inverted", default_value="false"),
        DeclareLaunchArgument("angle_compensate", default_value="true"),
        DeclareLaunchArgument("scan_mode", default_value="Sensitivity"),

        # TF settings (edit these for your robot)
        DeclareLaunchArgument("parent_frame", default_value="base_link"),
        DeclareLaunchArgument("tf_x", default_value="0.00"),   # meters
        DeclareLaunchArgument("tf_y", default_value="0.00"),
        DeclareLaunchArgument("tf_z", default_value="0.15"),
        DeclareLaunchArgument("tf_roll", default_value="0.0"),   # radians
        DeclareLaunchArgument("tf_pitch", default_value="0.0"),
        DeclareLaunchArgument("tf_yaw", default_value="0.0"),

        # sllidar driver node
        Node(
            package="sllidar_ros2",
            executable="sllidar_node",
            name="sllidar_node",
            output="screen",
            parameters=[{
                "channel_type": "serial",
                "serial_port": serial_port,
                "serial_baudrate": serial_baudrate,
                "frame_id": lidar_frame,
                "inverted": inverted,
                "angle_compensate": angle_compensate,
                "scan_mode": scan_mode,
            }],
        ),

        # Static transform: base_link -> laser
        Node(
            package="tf2_ros",
            executable="static_transform_publisher",
            name="lidar_static_tf",
            arguments=[
                "--x", tf_x,
                "--y", tf_y,
                "--z", tf_z,
                "--roll", tf_roll,
                "--pitch", tf_pitch,
                "--yaw", tf_yaw,
                "--frame-id", parent_frame,
                "--child-frame-id", lidar_frame,
            ],
            output="screen",
        ),
    ])