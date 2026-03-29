# ~/nav2_config/nav2_slam_navigation.launch.py

from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import LaunchConfiguration
from launch_ros.actions import SetRemap
from ament_index_python.packages import get_package_share_directory
import os

def generate_launch_description():
    bringup_dir = get_package_share_directory('nav2_bringup')

    return LaunchDescription([
        DeclareLaunchArgument(
            'params_file',
            default_value='/home/pascal/ros2_ws/config/nav2_params.yaml'
        ),

        # Send Nav2's output to your diff drive base
        SetRemap(src='cmd_vel', dst='/diff_drive_base/cmd_vel'),

        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                os.path.join(bringup_dir, 'launch', 'navigation_launch.py')
            ),
            launch_arguments={
                'use_sim_time': 'false',
                'autostart': 'true',
                'params_file': LaunchConfiguration('params_file'),
            }.items()
        ),
    ])