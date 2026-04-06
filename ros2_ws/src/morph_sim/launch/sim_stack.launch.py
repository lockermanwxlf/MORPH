from launch import LaunchDescription
from launch.actions import DeclareLaunchArgument, IncludeLaunchDescription
from launch.conditions import IfCondition
from launch.launch_description_sources import PythonLaunchDescriptionSource
from launch.substitutions import Command, FindExecutable, LaunchConfiguration, PathJoinSubstitution
from launch_ros.actions import Node
from launch_ros.descriptions import ParameterValue
from launch_ros.substitutions import FindPackageShare


def generate_launch_description():
    use_slam = LaunchConfiguration("use_slam")
    use_nav2 = LaunchConfiguration("use_nav2")
    use_foxglove = LaunchConfiguration("use_foxglove")
    foxglove_port = LaunchConfiguration("foxglove_port")

    xacro_path = PathJoinSubstitution(
        [FindPackageShare("morph_description"), "urdf", "morph.urdf.xacro"]
    )
    robot_description = {
        "robot_description": ParameterValue(
            Command([FindExecutable(name="xacro"), " ", xacro_path]),
            value_type=str,
        )
    }

    slam_config = PathJoinSubstitution(
        [FindPackageShare("morph_sim"), "config", "slam_toolbox.yaml"]
    )
    declared_arguments = [
        DeclareLaunchArgument("use_slam", default_value="true"),
        DeclareLaunchArgument("use_nav2", default_value="false"),
        DeclareLaunchArgument("use_foxglove", default_value="true"),
        DeclareLaunchArgument("foxglove_port", default_value="8765"),
    ]

    nodes = [
        Node(
            package="robot_state_publisher",
            executable="robot_state_publisher",
            name="robot_state_publisher",
            output="screen",
            parameters=[robot_description],
        ),
        Node(
            package="morph_sim",
            executable="kinematic_world",
            name="kinematic_world",
            output="screen",
        ),
        Node(
            package="slam_toolbox",
            executable="async_slam_toolbox_node",
            name="slam_toolbox",
            output="screen",
            parameters=[slam_config],
            condition=IfCondition(use_slam),
        ),
        Node(
            package="foxglove_bridge",
            executable="foxglove_bridge",
            name="foxglove_bridge",
            output="screen",
            parameters=[{"port": foxglove_port}],
            condition=IfCondition(use_foxglove),
        ),
        IncludeLaunchDescription(
            PythonLaunchDescriptionSource(
                PathJoinSubstitution(
                    [FindPackageShare("morph_sim"), "launch", "nav2_sim.launch.py"]
                )
            ),
            condition=IfCondition(use_nav2),
        ),
    ]

    return LaunchDescription(declared_arguments + nodes)
