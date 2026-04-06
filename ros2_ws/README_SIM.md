# MORPH Sim

This workspace now includes a headless simulation stack intended for app and
Foxglove testing without physical hardware.

## What it provides

- `morph_description`: a minimal robot description with `base_link` and `laser`
- `morph_sim`: a kinematic world node that publishes:
  - `/scan`
  - `/diff_drive_base/odom`
  - `/odom`
  - `odom -> base_link` TF
- optional `slam_toolbox`
- optional `foxglove_bridge`

## Run locally

```bash
cd /Users/jake/Programming/MORPH/ros2_ws
source /opt/ros/jazzy/setup.bash
colcon build --symlink-install --packages-up-to morph_description morph_sim
source install/setup.bash
ros2 launch morph_sim sim_stack.launch.py
```

Foxglove Bridge defaults to port `8765`.

## Run in Docker

```bash
cd /Users/jake/Programming/MORPH/ros2_ws
docker compose -f docker-compose.sim.yml up --build
```

## Notes

This is a headless kinematic simulation, not a full Gazebo physics simulation.
It is designed to let you test topic flow, Foxglove, mapping, and app behavior.

If you later want full physics, the next step is adding a Gazebo or Webots
package on top of `morph_description`.
