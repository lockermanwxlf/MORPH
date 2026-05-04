# MORPH

A modular open-source robotic programming hub.

## Table of Contents

1. [About](#about)
2. [Prerequisites](#prerequisites)
3. [Quickstart](#quickstart)
4. [Robot Setup](#robot-setup)
5. [Robot Use](#robot-use)
6. [Robot Notes and Troubleshooting](#robot-notes-and-troubleshooting)
7. [Support](#support)
8. [Purchase](#purchase)
9. [Copyright](#copyright)

## About

- MORPH is an open-source robotics platform.
- MORPH is designed as a modular robotic programming hub for education, research, and development.
- The repository includes software for the MORPH robot, including ROS 2 packages, simulation resources, backend services, and the web interface.
- Our services include:
  - ROS 2 robot control
  - Robot simulation
  - Web-based interaction
  - Backend communication services
  - Sensor integration
  - Navigation and SLAM support
- Our code and circuit are open source. You can obtain the details and latest information through this repository.

## Prerequisites

General development prerequisites:

- Node.js 18+ or latest LTS
- `pnpm`

```bash
npm i -g pnpm
```

- Python 3.11+ recommended
- Ubuntu recommended for ROS 2 robot setup
- ROS 2 Jazzy for the current robot workflow

For the physical robot, you should also have:

- A working ROS 2 Jazzy installation
- `colcon`
- `rosdep`
- Access to the robot's USB devices
- A user account with serial device permissions

## Quickstart

### Robot

Use Docker Compose to run a simulated robot.

```bash
cd ros2_ws
docker compose up
```

### Backend

```bash
cd backend
docker compose up
```

### Website

```bash
cd web
pnpm install
pnpm run dev --open
```

## Robot Setup

This section describes how to set up MORPH on a fresh Ubuntu machine for physical robot use.

### 1. Update Ubuntu

```bash
sudo apt update
sudo apt upgrade
```

### 2. Install ROS 2 Jazzy

Follow the official ROS 2 Jazzy Debian installation instructions:

```text
https://docs.ros.org/en/jazzy/Installation/Ubuntu-Install-Debs.html
```

After installing ROS 2 Jazzy, source it:

```bash
source /opt/ros/jazzy/setup.bash
```

Optional but recommended:

```bash
echo "source /opt/ros/jazzy/setup.bash" >> ~/.bashrc
```

### 3. Clone MORPH

```bash
git clone https://github.com/oss-slu/MORPH.git
cd MORPH
```

If you are working from a specific branch, check it out before building:

```bash
git checkout readme
```

### 4. Install build tools and ROS dependencies

```bash
sudo apt update
sudo apt install git curl build-essential python3-colcon-common-extensions python3-rosdep
```

Initialize and update `rosdep`:

```bash
sudo rosdep init
rosdep update
```

If `rosdep` has already been initialized on the machine, `sudo rosdep init` may report that it already exists. In that case, continue with:

```bash
rosdep update
```

### 5. Install MORPH ROS 2 dependencies

From the ROS 2 workspace:

```bash
cd ~/MORPH/ros2_ws
rosdep install --from-paths src --ignore-src -r -y
```

Install the required ROS 2 control packages for the servo controller:

```bash
sudo apt install ros-jazzy-ros2-control ros-jazzy-ros2-controllers ros-jazzy-ament-cmake-mypy
```

Install Foxglove bridge:

```bash
sudo apt install ros-jazzy-foxglove-bridge
```

Install SLAM Toolbox:

```bash
sudo apt install ros-jazzy-slam-toolbox
```

Install Nav2:

```bash
sudo apt install ros-jazzy-navigation2 ros-jazzy-nav2-bringup ros-jazzy-nav2-minimal-tb*
```

For `rosbridge_suite` on new setups, install:

```bash
sudo apt install python3-tornado
sudo apt install python3-pymongo
```

### 6. Set up serial device permissions

The motor controller and LiDAR may appear as `/dev/ttyUSB0`, `/dev/ttyUSB1`, or another serial device depending on the system.

For a temporary setup, you can run:

```bash
sudo chmod 666 /dev/ttyUSB0
sudo chmod 777 /dev/ttyUSB1
```

In our current development:

- `/dev/ttyUSB0` is commonly used for the motor controller.
- `/dev/ttyUSB1` is commonly used for the LiDAR.

A more permanent approach is to add the current user to the `dialout` group:

```bash
sudo usermod -aG dialout $USER
```

After running this command, log out and log back in for the change to take effect.

When possible, prefer stable device names such as:

```bash
/dev/serial/by-id/...
/dev/serial/by-path/...
```

instead of `/dev/ttyUSB0` or `/dev/ttyUSB1`, since the numbered USB device names can change after unplugging or rebooting.

### 7. Build the ROS 2 workspace

```bash
cd ~/MORPH/ros2_ws
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install
```

After building, source the workspace:

```bash
source install/setup.bash
```

Optional but recommended:

```bash
echo "source ~/MORPH/ros2_ws/install/setup.bash" >> ~/.bashrc
```

### 8. Port forwarding and remote access notes

If connecting to the robot from another computer, make sure the required ports are reachable.

Common ports:

- Foxglove bridge: `8765`
- rosbridge websocket, if used: `9090`
- Backend or website ports may depend on the specific service configuration.

For Foxglove, connect from your desktop using:

```text
ws://ROBOT_IP_ADDRESS:8765
```

For SSH port forwarding, a common pattern is:

```bash
ssh -L 8765:localhost:8765 USERNAME@ROBOT_IP_ADDRESS
```

Then connect Foxglove to:

```text
ws://localhost:8765
```

Replace `USERNAME` and `ROBOT_IP_ADDRESS` with the robot's actual username and IP address.

## Robot Use

Before running robot commands, open a new terminal and source ROS 2 and the MORPH workspace:

```bash
source /opt/ros/jazzy/setup.bash
source ~/MORPH/ros2_ws/install/setup.bash
```

Most workflows require multiple terminals. Source the workspace in each terminal.

### 1. Start communication through Foxglove

Launch the Foxglove bridge:

```bash
ros2 launch foxglove_bridge foxglove_bridge_launch.xml
```

Then connect from Foxglove using:

```text
ws://ROBOT_IP_ADDRESS:8765
```

or, if running locally:

```text
ws://localhost:8765
```

### 2. Start the servo controller

Recommended launch:

```bash
ros2 launch waveshare_servos example.launch.py \
  io_timeout_ms:=20 \
  enable_sync_read:=false \
  estimate_state_from_commands:=false
```


Basic launch:

```bash
ros2 launch waveshare_servos example.launch.py
```


### 3. Drive with keyboard teleoperation

To drive the robot using the keyboard:

```bash
ros2 run teleop_twist_keyboard teleop_twist_keyboard --ros-args \
  -r /cmd_vel:=/diff_drive_base/cmd_vel \
  -p stamped:=true \
  -p frame_id:=base_link
```

This remaps the keyboard command velocity topic to:

```text
/diff_drive_base/cmd_vel
```

and publishes stamped velocity commands in the `base_link` frame.


### 4. Publish a differential drive command

To publish a stamped velocity command to the differential drive base:

```bash
ros2 topic pub -r 10 /diff_drive_base/cmd_vel geometry_msgs/TwistStamped \
"{header: {frame_id: base_link}, twist: {linear: {x: 0.2}, angular: {z: 0.0}}}"
```

This publishes forward motion at `0.2 m/s` with no angular velocity.

To stop the robot, publish zero velocity:

```bash
ros2 topic pub --once /diff_drive_base/cmd_vel geometry_msgs/TwistStamped \
"{header: {frame_id: base_link}, twist: {linear: {x: 0.0}, angular: {z: 0.0}}}"
```

### 5. Start the LiDAR

Launch the SLLIDAR A1 driver:

```bash
ros2 launch sllidar_ros2 view_sllidar_a1_launch.py \
  serial_port:=/dev/serial/by-id/usb-Silicon_Labs_CP2102_USB_to_UART_Bridge_Controller_0001-if00-port0
```

If the `by-id` path is different on your machine, list available serial devices:

```bash
ls -l /dev/serial/by-id/
```

or:

```bash
ls -l /dev/serial/by-path/
```

Then update the `serial_port` argument accordingly.

### 6. Publish the LiDAR transform

The LiDAR must have a transform from `base_link` to `laser`.

Current static transform:

```bash
ros2 run tf2_ros static_transform_publisher \
  0.0762 0.0 0.1651 \
  3.14159 0.0 0.0 \
  base_link laser
```

In the future, this transform should be handled automatically by `autoport` or the robot description instead of being manually published.

### 6. Start SLAM

Launch SLAM Toolbox in online asynchronous mode:

```bash
ros2 launch slam_toolbox online_async_launch.py \
  slam_params_file:=/home/morph/MORPH/ros2_ws/config/slam_toolbox.yaml \
  use_sim_time:=false
```

This uses the MORPH SLAM Toolbox configuration file located at:

```text
/home/morph/MORPH/ros2_ws/config/slam_toolbox.yaml
```

If your repository is in a different location, update the path accordingly.

### 7. Start Nav2

Launch the MORPH Nav2 bringup:

```bash
ros2 launch ~/MORPH/ros2_ws/src/slu_smart/launch/nav2_launch.py
```

Current navigation notes:

- Global planning should occur in the SLAM map frame.
- Local planning and obstacle checking should use the `/scan` topic.
- The odometry source still needs to be finalized:
  - SLAM may provide `/odom`.
  - The differential drive base may provide `/diff_drive_base/odom`.
- Confirm the correct global costmap plugins.
- Confirm the correct local costmap plugins.
- Confirm the local costmap configuration.

## Robot Notes and Troubleshooting

### Sourcing

If a ROS 2 package cannot be found, source both ROS 2 and the workspace again:

```bash
source /opt/ros/jazzy/setup.bash
source ~/MORPH/ros2_ws/install/setup.bash
```

### Rebuilding

After changing ROS 2 package code:

```bash
cd ~/MORPH/ros2_ws
colcon build --symlink-install
source install/setup.bash
```

### Checking topics

List active topics:

```bash
ros2 topic list
```

Inspect a topic:

```bash
ros2 topic echo /scan
```

```bash
ros2 topic echo /diff_drive_base/cmd_vel
```

### Checking transforms

View the transform tree:

```bash
ros2 run tf2_tools view_frames
```

Check the transform from `base_link` to `laser`:

```bash
ros2 run tf2_ros tf2_echo base_link laser
```

### Checking serial devices

List USB serial devices:

```bash
ls /dev/ttyUSB*
```

List stable serial device paths:

```bash
ls -l /dev/serial/by-id/
ls -l /dev/serial/by-path/
```

### Foxglove connection

Start Foxglove bridge:

```bash
ros2 launch foxglove_bridge foxglove_bridge_launch.xml
```

Connect using:

```text
ws://ROBOT_IP_ADDRESS:8765
```

If using SSH forwarding:

```bash
ssh -L 8765:localhost:8765 USERNAME@ROBOT_IP_ADDRESS
```

Then connect using:

```text
ws://localhost:8765
```

### rosbridge_suite dependencies

If `rosbridge_suite` fails on a new setup, make sure these are installed:

```bash
sudo apt install python3-tornado
sudo apt install python3-pymongo
```

## Support

For support, please open an issue on the MORPH GitHub repository.

When reporting a robot issue, include:

- What command you ran
- The full error output
- Your ROS 2 version
- Your Ubuntu version
- Which device was connected
- The output of:

```bash
ros2 topic list
```

and, when relevant:

```bash
ls -l /dev/serial/by-id/
```

## Purchase

- Please visit the following page to purchase our products:
  - ….
- Business customers please contact us through the following email address:
  - …

## Copyright

[License](./LICENSE)
