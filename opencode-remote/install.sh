#!/usr/bin/env bash
# install.sh - Single entry point for opencode+openchamber via Cloudflare Tunnel
# Usage:
#   sudo bash install.sh         # local/systemd mode (INSTALL_MODE=local in .env)
#   bash install.sh              # docker mode (INSTALL_MODE=docker in .env)
#
# Re-running is safe (idempotent).
set -euo pipefail

# ── Constants ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly SYSTEMD_DIR="/etc/systemd/system"
readonly CURL_OPTS=(--connect-timeout 30 --max-time 120 -fsSL)

# ── Helpers ────────────────────────────────────────────────────────────────────
has() { command -v -- "$1" &>/dev/null; }
die() { printf '\e[31mERROR: %s\e[0m\n' "$*" >&2; exit 1; }
log() { printf '\e[34m[install] %s\e[0m\n' "$*"; }

# ── Package manager detection (cached) ────────────────────────────────────────
PKG_MANAGER=""
detect_pkg_manager() {
  if [[ -n "$PKG_MANAGER" ]]; then echo "$PKG_MANAGER"; return; fi
  if has bun; then PKG_MANAGER="bun"
  elif has npm; then PKG_MANAGER="npm"
  else PKG_MANAGER="none"
  fi
  echo "$PKG_MANAGER"
}

install_global() {
  local pkg="$1"
  local pm; pm=$(detect_pkg_manager)
  case "$pm" in
    bun) bun install -g "$pkg" ;;
    npm) npm install -g "$pkg" ;;
    *)
      die "Neither bun nor npm found. Install one first:
  bun:  curl -fsSL https://bun.sh/install | bash
  npm:  https://nodejs.org"
      ;;
  esac
}

# ── Load .env ──────────────────────────────────────────────────────────────────
load_env() {
  local env_file="$SCRIPT_DIR/.env"
  [[ -f "$env_file" ]] || die ".env not found. Copy .env.example to .env and fill in values."
  chmod 600 "$env_file"
  set -a
  # shellcheck source=/dev/null
  source "$env_file"
  set +a
  ENV_FILE="$env_file"
}

validate_env() {
  [[ "${UI_PASSWORD:-}" != "change_me_to_something_secure" ]] || \
    die "Please set a real UI_PASSWORD in .env before running."
  [[ "${UI_PASSWORD:-}" != "" ]] || die "UI_PASSWORD is not set in .env."
}

# ── Tunnel provisioning ────────────────────────────────────────────────────────
provision_tunnel() {
  log "Provisioning Cloudflare tunnel (INSTALL_MODE=${INSTALL_MODE:-docker})..."
  bash "$SCRIPT_DIR/setup.sh"
  # Reload .env to pick up TUNNEL_TOKEN written by setup.sh
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
}

# ── Local (systemd) mode ───────────────────────────────────────────────────────
install_openchamber() {
  log "[1/4] Installing openchamber..."
  if has openchamber; then
    log "  openchamber already installed ($(openchamber --version 2>/dev/null || echo 'version unknown'))"
    return
  fi
  has curl || die "curl is required to install openchamber."
  curl "${CURL_OPTS[@]}" https://raw.githubusercontent.com/btriapitsyn/openchamber/main/scripts/install.sh | bash
}

install_cloudflared() {
  log "[2/4] Installing cloudflared..."
  if has cloudflared; then
    log "  cloudflared already installed ($(cloudflared --version 2>/dev/null | head -1))"
    return
  fi
  local pm; pm=$(detect_pkg_manager)
  if [[ "$pm" != "none" ]]; then
    install_global "cloudflared"
    return
  fi
  # Fallback: binary download
  local arch cf_arch
  arch=$(uname -m)
  case "$arch" in
    x86_64)  cf_arch="amd64" ;;
    aarch64) cf_arch="arm64" ;;
    armv7l)  cf_arch="arm"   ;;
    *) die "Unsupported architecture: $arch. Install cloudflared manually:
  https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/downloads/" ;;
  esac
  curl "${CURL_OPTS[@]}" \
    "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-${cf_arch}" \
    -o /usr/local/bin/cloudflared
  chmod +x /usr/local/bin/cloudflared
}

install_systemd_services() {
  log "[4/4] Installing systemd services..."

  if [[ ! -d "$SYSTEMD_DIR" ]]; then
    printf '\e[33mWARNING: systemd not found. Start manually:\e[0m\n' >&2
    printf '  OPENCHAMBER_UI_PASSWORD="%s" node <server> --port %s &\n' \
      "${UI_PASSWORD}" "${OPENCHAMBER_PORT:-3000}" >&2
    printf '  TUNNEL_TOKEN="%s" cloudflared tunnel --no-autoupdate run &\n' \
      "${TUNNEL_TOKEN}" >&2
    return
  fi

  local current_user="${SUDO_USER:-$USER}"
  local current_home; current_home=$(eval echo "~$current_user")

  # Resolve openchamber server script
  local openchamber_bin openchamber_server node_bin
  openchamber_bin=$(readlink -f "$(command -v openchamber)")
  openchamber_server=$(dirname "$(dirname "$openchamber_bin")")/server/index.js
  node_bin=$(command -v node)
  [[ -f "$openchamber_server" ]] || die "Cannot find openchamber server at $openchamber_server"

  # Secrets file (root-owned, chmod 600)
  local env_target="/etc/openchamber/env"
  install -d -m 700 /etc/openchamber
  install -m 600 /dev/null "$env_target"
  printf 'OPENCHAMBER_UI_PASSWORD=%s\nTUNNEL_TOKEN=%s\n' \
    "${UI_PASSWORD}" "${TUNNEL_TOKEN}" > "$env_target"

  local cloudflared_bin; cloudflared_bin=$(command -v cloudflared)
  local port="${OPENCHAMBER_PORT:-3000}"
  local tunnel_id; tunnel_id=$(jq -r '.TunnelID' "$SCRIPT_DIR/cloudflared/credentials.json")

  # Copy credentials
  local cloudflared_etc="/etc/cloudflared"
  mkdir -p "$cloudflared_etc"
  cp "$SCRIPT_DIR/cloudflared/credentials.json" "$cloudflared_etc/credentials.json"
  chown "${current_user}:${current_user}" "$cloudflared_etc/credentials.json"
  chmod 600 "$cloudflared_etc/credentials.json"

  # openchamber.service
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

  # cloudflared-openchamber.service
  cat > "$SYSTEMD_DIR/cloudflared-openchamber.service" << EOF
[Unit]
Description=Cloudflare Tunnel for openchamber
After=network.target openchamber.service
Requires=openchamber.service

[Service]
Type=simple
User=$current_user
EnvironmentFile=/etc/openchamber/env
ExecStart=$cloudflared_bin tunnel --no-autoupdate run --credentials-file=$cloudflared_etc/credentials.json --url=http://localhost:$port $tunnel_id
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

  systemctl daemon-reload
  systemctl enable --now openchamber.service cloudflared-openchamber.service
  systemctl restart openchamber.service cloudflared-openchamber.service
}

# TODO: add pm2 support
# install_global pm2

install_local() {
  [[ $EUID -eq 0 ]] || die "Local mode requires root: sudo bash install.sh"
  install_openchamber
  install_cloudflared
  log "[3/4] Provisioning tunnel..."
  provision_tunnel
  install_systemd_services
}

# ── Docker mode ────────────────────────────────────────────────────────────────
install_docker() {
  has docker || die "Docker not found. Install Docker first: https://docs.docker.com/get-docker/"
  log "Pulling latest images..."
  docker compose -f "$SCRIPT_DIR/docker-compose.yml" pull
  log "Starting services..."
  docker compose -f "$SCRIPT_DIR/docker-compose.yml" up -d
}

# ── Summary ────────────────────────────────────────────────────────────────────
print_summary() {
  local mode="${INSTALL_MODE:-docker}"
  printf '\n\e[32m=== Installation complete ===\e[0m\n\n'
  printf 'URL:  https://%s\n' "${TUNNEL_HOSTNAME}"
  printf 'Pass: UI_PASSWORD in .env\n\n'
  if [[ "$mode" == "local" ]]; then
    printf 'Manage services:\n'
    printf '  make status   - check service status\n'
    printf '  make restart  - restart services\n'
    printf '  make stop     - stop services\n'
  else
    printf 'Manage services:\n'
    printf '  make status   - check container status\n'
    printf '  make logs     - follow logs\n'
    printf '  make down     - stop containers\n'
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
main() {
  load_env
  validate_env

  local mode="${INSTALL_MODE:-docker}"
  log "Mode: $mode  |  Host: ${TUNNEL_HOSTNAME:-<not set>}"

  case "$mode" in
    local)
      install_local
      ;;
    docker)
      provision_tunnel
      install_docker
      ;;
    *)
      die "Unknown INSTALL_MODE='$mode'. Set 'local' or 'docker' in .env."
      ;;
  esac

  print_summary
}

main "$@"
