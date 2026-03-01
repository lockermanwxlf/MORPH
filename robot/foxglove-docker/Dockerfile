FROM ros:humble

RUN --mount=type=cache,target=/var/cache/apt \
    --mount=type=cache,target=/var/lib/apt/lists \
    apt-get update && apt-get install -y ros-${ROS_DISTRO}-foxglove-bridge

WORKDIR /app

COPY . .

CMD ["bash", "entrypoint.bash"]
