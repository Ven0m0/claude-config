#!/usr/bin/env bash
# install-local.sh - Install openchamber + cloudflared without Docker
# Run once per machine, then use: make start / make stop
#
# Supports: Linux (systemd)
# Prefers:  bun > npm for package management

set -euo pipefail

# ── Constants ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly SYSTEMD_DIR="/etc/systemd/system"
readonly CURL_OPTS=(--connect-timeout 30 --max-time 120 -fsSL)

# ── Package manager detection (cached) ─────────────────────────────────────────
PKG_MANAGER=""

detect_pkg_manager() {
  if [[ -n "$PKG_MANAGER" ]]; then
    echo "$PKG_MANAGER"
    return
  fi
  if command -v bun &>/dev/null; then
    PKG_MANAGER="bun"
  elif command -v npm &>/dev/null; then
    PKG_MANAGER="npm"
  else
    PKG_MANAGER="none"
  fi
  echo "$PKG_MANAGER"
}

install_global() {
  local pkg="$1"
  local pm
  pm=$(detect_pkg_manager)
  case "$pm" in
    bun)
      echo "  Using bun to install $pkg..."
      bun install -g "$pkg"
      ;;
    npm)
      echo "  Using npm to install $pkg..."
      npm install -g "$pkg"
      ;;
    *)
      echo "ERROR: Neither bun nor npm found. Install one of them first:" >&2
      echo "  bun:  curl -fsSL https://bun.sh/install | bash" >&2
      echo "  npm:  https://nodejs.org" >&2
      exit 1
      ;;
  esac
}

# ── Load .env ──────────────────────────────────────────────────────────────────
load_env() {
  local env_file="$SCRIPT_DIR/.env"
  if [[ ! -f "$env_file" ]]; then
    echo "ERROR: .env not found. Copy .env.example to .env and fill in values." >&2
    echo "  cp $SCRIPT_DIR/.env.example $SCRIPT_DIR/.env" >&2
    exit 1
  fi
  set -a
  # shellcheck source=/dev/null
  source "$env_file"
  set +a
  ENV_FILE="$env_file"
}

validate_env() {
  if [[ "$UI_PASSWORD" == "change_me_to_something_secure" ]]; then
    echo "ERROR: Please set a real UI_PASSWORD in .env before running install." >&2
    exit 1
  fi
}

# ── Installation steps ─────────────────────────────────────────────────────────
install_openchamber() {
  echo "[1/4] Installing openchamber..."
  if command -v openchamber &>/dev/null; then
    echo "  openchamber already installed: $(openchamber --version 2>/dev/null || echo 'version unknown')"
    echo "  To update: sudo openchamber update"
  else
    if ! command -v curl &>/dev/null; then
      echo "ERROR: curl is required to install openchamber." >&2
      exit 1
    fi
    echo "  Using official install script..."
    curl "${CURL_OPTS[@]}" https://raw.githubusercontent.com/btriapitsyn/openchamber/main/scripts/install.sh | bash
  fi
}

install_cloudflared() {
  echo "[2/4] Installing cloudflared..."
  if command -v cloudflared &>/dev/null; then
    echo "  cloudflared already installed: $(cloudflared --version 2>/dev/null | head -1)"
    return
  fi

  local pm
  pm=$(detect_pkg_manager)
  if [[ "$pm" != "none" ]]; then
    install_global "cloudflared"
    return
  fi

  # Fallback: download binary directly
  echo "  Downloading cloudflared binary..."
  local arch cf_arch url
  arch=$(uname -m)
  case "$arch" in
    x86_64) cf_arch="amd64" ;;
    aarch64) cf_arch="arm64" ;;
    armv7l) cf_arch="arm" ;;
    *)
      echo "ERROR: Unsupported architecture: $arch. Install cloudflared manually:" >&2
      echo "  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" >&2
      exit 1
      ;;
  esac

  url="https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${cf_arch}"
  curl "${CURL_OPTS[@]}" "$url" -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
  echo "  Installed: /usr/local/bin/cloudflared"
}

provision_tunnel() {
  echo "[3/4] Provisioning Cloudflare tunnel..."
  INSTALL_MODE=local bash "$SCRIPT_DIR/setup.sh"

  # Reload .env to get TUNNEL_TOKEN written by setup.sh
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a

  TUNNEL_ID=$(jq -r '.TunnelID' "$SCRIPT_DIR/cloudflared/credentials.json")
}

install_systemd_services() {
  echo "[4/4] Installing systemd services..."

  if [[ ! -d "$SYSTEMD_DIR" ]]; then
    echo "WARNING: $SYSTEMD_DIR not found. Skipping systemd service installation." >&2
    echo "  To start manually:"
    echo "    OPENCHAMBER_UI_PASSWORD=\"\$UI_PASSWORD\" node \$OPENCHAMBER_SERVER --port ${OPENCHAMBER_PORT:-3000} &"
    echo "    TUNNEL_TOKEN=\"\$TUNNEL_TOKEN\" cloudflared tunnel --no-autoupdate run &"
    echo ""
    echo "=== Installation complete ==="
    echo "Open: https://${TUNNEL_HOSTNAME}"
    exit 0
  fi

  local current_user="${SUDO_USER:-$USER}"
  local current_home
  if ! command -v getent &>/dev/null; then
    echo "ERROR: getent is required to resolve the home directory for user $current_user" >&2
    exit 1
  fi
  if ! current_home=$(getent passwd "$current_user" | cut -d: -f6); then
    echo "ERROR: Could not resolve home directory for user $current_user" >&2
    exit 1
  fi
  [[ -n "$current_home" ]] || { echo "ERROR: Could not resolve home directory for user $current_user" >&2; exit 1; }

  # Resolve openchamber server script path
  local openchamber_bin openchamber_server node_bin
  openchamber_bin=$(readlink -f "$(command -v openchamber)")
  openchamber_server=$(dirname "$(dirname "$openchamber_bin")")/server/index.js
  node_bin=$(command -v node)

  if [[ ! -f "$openchamber_server" ]]; then
    echo "ERROR: Could not find openchamber server script at $openchamber_server" >&2
    exit 1
  fi
  echo "  Server script: $openchamber_server"

  # Write secrets to restricted env file
  local env_target="/etc/openchamber/env"
  install -d -m 700 /etc/openchamber
  install -m 600 /dev/null "$env_target"
  cat > "$env_target" << EOF
OPENCHAMBER_UI_PASSWORD=$UI_PASSWORD
TUNNEL_TOKEN=$TUNNEL_TOKEN
EOF
  echo "  Wrote: $env_target (chmod 600)"

  local cloudflared_bin
  cloudflared_bin=$(command -v cloudflared)
  local port="${OPENCHAMBER_PORT:-3000}"

  # openchamber service
  cat > "$SYSTEMD_DIR/openchamber.service" << EOF
[Unit]
Description=OpenChamber - OpenCode web interface
After=network.target

[Service]
Type=simple
User=$current_user
WorkingDirectory=$current_home
EnvironmentFile=/etc/openchamber/env
ExecStart=$node_bin $openchamber_server --port $port
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  echo "  Wrote: $SYSTEMD_DIR/openchamber.service"

  # cloudflared service
  local cloudflared_etc="/etc/cloudflared"
  mkdir -p "$cloudflared_etc"
  cp "$SCRIPT_DIR/cloudflared/credentials.json" "$cloudflared_etc/credentials.json"
  chown "$current_user:$current_user" "$cloudflared_etc/credentials.json"
  chmod 600 "$cloudflared_etc/credentials.json"

  cat > "$SYSTEMD_DIR/cloudflared-openchamber.service" << EOF
[Unit]
Description=Cloudflare Tunnel for openchamber
After=network.target openchamber.service
Requires=openchamber.service

[Service]
Type=simple
User=$current_user
EnvironmentFile=/etc/openchamber/env
ExecStart=$cloudflared_bin tunnel --no-autoupdate run --credentials-file=$cloudflared_etc/credentials.json --url=http://localhost:$port $TUNNEL_ID
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF
  echo "  Wrote: $SYSTEMD_DIR/cloudflared-openchamber.service"

  systemctl daemon-reload
  systemctl enable openchamber.service cloudflared-openchamber.service
  systemctl start openchamber.service cloudflared-openchamber.service
}

print_summary() {
  echo ""
  echo "=== Local installation complete ==="
  echo ""
  echo "Services enabled and started:"
  echo "  systemctl status openchamber"
  echo "  systemctl status cloudflared-openchamber"
  echo ""
  echo "Open: https://${TUNNEL_HOSTNAME}"
  echo "(UI Password is in .env as UI_PASSWORD)"
}

# ── Main ───────────────────────────────────────────────────────────────────────
main() {
  load_env
  validate_env

  echo "=== OpenChamber Local Installation ==="
  echo ""

  install_openchamber
  install_cloudflared
  provision_tunnel
  install_systemd_services
  print_summary
}

main "$@"
