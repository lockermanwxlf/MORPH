# 1. Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    x86_64)  WSTUNNEL_ARCH="linux_amd64" ;;
    aarch64) WSTUNNEL_ARCH="linux_arm64" ;;
    armv7l)  WSTUNNEL_ARCH="linux_armv6" ;; # Most common for 32-bit Pi
    *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
esac

# 2. Set Version (10.5.1 is stable in 2026)
VERSION="10.5.1"

# 3. Download and Extract
echo "Downloading wstunnel $VERSION for $WSTUNNEL_ARCH..."
curl -L "https://github.com/erebe/wstunnel/releases/download/v${VERSION}/wstunnel_${VERSION}_${WSTUNNEL_ARCH}.tar.gz" -o wstunnel.tar.gz

# Extract and move to bin
tar -xzf wstunnel.tar.gz
chmod +x wstunnel
mv wstunnel /usr/local/bin/wstunnel

# Cleanup
rm wstunnel.tar.gz