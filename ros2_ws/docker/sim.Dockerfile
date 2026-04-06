FROM osrf/ros:jazzy-desktop

SHELL ["/bin/bash", "-lc"]

RUN apt-get update && apt-get install -y \
    python3-colcon-common-extensions \
    ros-jazzy-foxglove-bridge \
    ros-jazzy-nav2-bringup \
    ros-jazzy-robot-state-publisher \
    ros-jazzy-slam-toolbox \
    ros-jazzy-tf2-ros \
    ros-jazzy-xacro \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /ws

COPY . /ws

RUN source /opt/ros/jazzy/setup.bash \
  && colcon build --symlink-install --packages-up-to morph_description morph_sim

CMD source /opt/ros/jazzy/setup.bash \
  && source /ws/install/setup.bash \
  && ros2 launch morph_sim sim_stack.launch.py
