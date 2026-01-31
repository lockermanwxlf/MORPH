FROM ros:humble

RUN --mount=type=cache,target=/var/cache/apt,sharing=locked \
    --mount=type=cache,target=/var/lib/apt,sharing=locked \
    apt-get update && apt-get install -y bash ros-${ROS_DISTRO}-foxglove-bridge \
    wireguard-tools wireguard-go iproute2 iptables jq iputils-ping

RUN --mount=type=bind,source=download_wstunnel.sh,target=download_wstunnel.sh \
    bash download_wstunnel.sh

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/
WORKDIR /app
RUN --mount=type=cache,target=/root/.cache/uv \
    --mount=type=bind,source=uv.lock,target=uv.lock \
    --mount=type=bind,source=pyproject.toml,target=pyproject.toml \
    uv sync --frozen --no-dev --compile-bytecode
COPY . .

CMD ["bash", "entrypoint.sh"]