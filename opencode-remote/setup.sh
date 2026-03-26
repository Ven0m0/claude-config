#!/usr/bin/env bash
# setup.sh - Provision Cloudflare tunnel for openchamber (idempotent)
# Run once per machine. Re-running detects existing resources and skips creation.

set -euo pipefail

# ── Constants ──────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR
readonly CF_API="https://api.cloudflare.com/client/v4"
readonly CURL_OPTS=(--connect-timeout 30 --max-time 120 -sS)

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
  chmod 600 "$env_file"
  ENV_FILE="$env_file"
}

# ── Validation ─────────────────────────────────────────────────────────────────
validate_env() {
  local required_vars=("CLOUDFLARE_API_TOKEN" "UI_PASSWORD" "TUNNEL_HOSTNAME" "TUNNEL_NAME")
  for var in "${required_vars[@]}"; do
    if [[ -z "${!var:-}" ]]; then
      echo "ERROR: $var is not set in .env" >&2
      exit 1
    fi
  done

  if [[ "$UI_PASSWORD" == "change_me_to_something_secure" ]]; then
    echo "ERROR: Please set a real UI_PASSWORD in .env before running setup." >&2
    exit 1
  fi
}

check_dependencies() {
  local deps=("curl" "jq")
  for cmd in "${deps[@]}"; do
    if ! command -v "$cmd" &>/dev/null; then
      echo "ERROR: '$cmd' is required but not installed." >&2
      exit 1
    fi
  done
}

# ── Cloudflare API helpers ─────────────────────────────────────────────────────
setup_cf_auth() {
  local token_len=${#CLOUDFLARE_API_TOKEN}
  if [[ $token_len -ge 40 ]]; then
    CF_AUTH_HEADERS=(-H "Authorization: Bearer $CLOUDFLARE_API_TOKEN")
  else
    if [[ -z "${CLOUDFLARE_EMAIL:-}" ]]; then
      echo "ERROR: Your credential looks like a Global API Key (${token_len} chars)." >&2
      echo "Global API Keys require your Cloudflare account email." >&2
      echo "Add to .env:  CLOUDFLARE_EMAIL=your@email.com" >&2
      echo "" >&2
      echo "Or create a proper API Token (recommended) at:" >&2
      echo "  https://dash.cloudflare.com/profile/api-tokens" >&2
      echo "  Needs: Zone:DNS:Edit + Account:Cloudflare Tunnel:Edit" >&2
      exit 1
    fi
    CF_AUTH_HEADERS=(-H "X-Auth-Email: $CLOUDFLARE_EMAIL" -H "X-Auth-Key: $CLOUDFLARE_API_TOKEN")
  fi
}

cf_api() {
  local method="$1" path="$2"
  shift 2
  curl "${CURL_OPTS[@]}" -X "$method" "$CF_API$path" \
    "${CF_AUTH_HEADERS[@]}" \
    -H "Content-Type: application/json" \
    "$@"
}

cf_check() {
  local response="$1" context="$2"
  if ! echo "$response" | jq -e '.success == true' &>/dev/null; then
    echo "ERROR: Cloudflare API call failed ($context):" >&2
    echo "$response" | jq -r '.errors[] | "  - " + .message' 2>/dev/null || echo "$response" >&2
    exit 1
  fi
}

# ── Account & Zone ─────────────────────────────────────────────────────────────
get_account() {
  echo "[1/6] Finding Cloudflare account..."
  local resp
  resp=$(cf_api GET "/accounts?per_page=1")
  cf_check "$resp" "list accounts"
  ACCOUNT_ID=$(echo "$resp" | jq -r '.result[0].id')
  ACCOUNT_NAME=$(echo "$resp" | jq -r '.result[0].name')
  if [[ -z "$ACCOUNT_ID" || "$ACCOUNT_ID" == "null" ]]; then
    echo "ERROR: Could not find Cloudflare account. Check your API token permissions." >&2
    exit 1
  fi
  echo "  Account: $ACCOUNT_NAME ($ACCOUNT_ID)"
}

find_zone() {
  echo "[2/6] Finding DNS zone for $TUNNEL_HOSTNAME..."
  ZONE_ID=""
  ZONE_NAME=""

  # Parse hostname into parts and try progressively shorter suffixes
  local IFS='.'
  read -ra PARTS <<< "$TUNNEL_HOSTNAME"
  for ((i=1; i<${#PARTS[@]}-1; i++)); do
    local candidate
    candidate=$(IFS='.'; echo "${PARTS[*]:$i}")
    local resp
    resp=$(cf_api GET "/zones?name=$candidate")
    if echo "$resp" | jq -e '.result | length > 0' &>/dev/null; then
      ZONE_ID=$(echo "$resp" | jq -r '.result[0].id')
      ZONE_NAME=$(echo "$resp" | jq -r '.result[0].name')
      break
    fi
  done

  if [[ -z "$ZONE_ID" ]]; then
    echo "ERROR: Could not find a Cloudflare zone for $TUNNEL_HOSTNAME." >&2
    echo "Make sure the domain is added to your Cloudflare account with nameservers pointing to Cloudflare." >&2
    exit 1
  fi
  echo "  Zone: $ZONE_NAME ($ZONE_ID)"
}

# ── Tunnel management ──────────────────────────────────────────────────────────
create_or_find_tunnel() {
  echo "[3/6] Checking for existing tunnel '$TUNNEL_NAME'..."
  local resp
  resp=$(cf_api GET "/accounts/$ACCOUNT_ID/cfd_tunnel?name=$TUNNEL_NAME&is_deleted=false")
  cf_check "$resp" "list tunnels"

  if echo "$resp" | jq -e '.result | length > 0' &>/dev/null; then
    TUNNEL_ID=$(echo "$resp" | jq -r '.result[0].id')
    echo "  Found existing tunnel: $TUNNEL_ID (skipping creation)"
  else
    echo "  Creating new tunnel '$TUNNEL_NAME'..."
    local create_resp
    create_resp=$(cf_api POST "/accounts/$ACCOUNT_ID/cfd_tunnel" \
      -d "$(jq -n --arg name "$TUNNEL_NAME" '{"name":$name,"config_src":"local"}')")
    cf_check "$create_resp" "create tunnel"
    TUNNEL_ID=$(echo "$create_resp" | jq -r '.result.id')
    echo "  Created tunnel: $TUNNEL_ID"

    # Save credentials if provided in response
    local creds
    creds=$(echo "$create_resp" | jq '.result.credentials_file // empty')
    if [[ -n "$creds" && "$creds" != "null" ]]; then
      mkdir -p "$SCRIPT_DIR/cloudflared"
      echo "$creds" > "$SCRIPT_DIR/cloudflared/credentials.json"
      chmod 600 "$SCRIPT_DIR/cloudflared/credentials.json"
      echo "  Saved credentials.json"
    fi
  fi

  # Ensure credentials exist
  local creds_file="$SCRIPT_DIR/cloudflared/credentials.json"
  if [[ ! -f "$creds_file" ]]; then
    echo "  credentials.json missing, fetching from API..."
    local creds_resp
    creds_resp=$(cf_api GET "/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/credentials")
    cf_check "$creds_resp" "get tunnel credentials"
    mkdir -p "$SCRIPT_DIR/cloudflared"
    echo "$creds_resp" | jq '.result' > "$creds_file"
    chmod 600 "$creds_file"
    echo "  Saved credentials.json"
  fi
}

get_tunnel_token() {
  echo "[4/6] Fetching tunnel token..."
  local resp
  resp=$(cf_api GET "/accounts/$ACCOUNT_ID/cfd_tunnel/$TUNNEL_ID/token")
  cf_check "$resp" "get tunnel token"
  TUNNEL_TOKEN=$(echo "$resp" | jq -r '.result')

  # Update .env with token
  if grep -q "^TUNNEL_TOKEN=" "$ENV_FILE" 2>/dev/null; then
    sed -i "s|^TUNNEL_TOKEN=.*|TUNNEL_TOKEN=$TUNNEL_TOKEN|" "$ENV_FILE"
  else
    echo "TUNNEL_TOKEN=$TUNNEL_TOKEN" >> "$ENV_FILE"
  fi
  chmod 600 "$ENV_FILE"
  echo "  Token saved to .env"
}

write_cloudflared_config() {
  echo "[5/6] Writing cloudflared/config.yml..."
  local service_host="openchamber"
  local port="${OPENCHAMBER_PORT:-3000}"
  [[ "${INSTALL_MODE:-docker}" == "local" ]] && service_host="localhost"

  mkdir -p "$SCRIPT_DIR/cloudflared"
  cat > "$SCRIPT_DIR/cloudflared/config.yml" << EOF
tunnel: $TUNNEL_ID
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: $TUNNEL_HOSTNAME
    service: http://${service_host}:${port}
  - service: http_status:404
EOF
  echo "  Written: cloudflared/config.yml"
}

configure_dns() {
  echo "[6/6] Configuring DNS CNAME record..."
  local record_name="${TUNNEL_HOSTNAME%".$ZONE_NAME"}"
  local cname_target="$TUNNEL_ID.cfargotunnel.com"

  local resp
  resp=$(cf_api GET "/zones/$ZONE_ID/dns_records?name=$TUNNEL_HOSTNAME&type=CNAME")

  local dns_payload
  dns_payload=$(jq -n --arg name "$record_name" --arg content "$cname_target" \
    '{"type":"CNAME","name":$name,"content":$content,"proxied":true,"ttl":1}')

  if echo "$resp" | jq -e '.result | length > 0' &>/dev/null; then
    local record_id
    record_id=$(echo "$resp" | jq -r '.result[0].id')
    echo "  Updating existing CNAME record..."
    local update_resp
    update_resp=$(cf_api PUT "/zones/$ZONE_ID/dns_records/$record_id" -d "$dns_payload")
    cf_check "$update_resp" "update DNS record"
  else
    echo "  Creating CNAME record: $TUNNEL_HOSTNAME -> $cname_target"
    local create_resp
    create_resp=$(cf_api POST "/zones/$ZONE_ID/dns_records" -d "$dns_payload")
    cf_check "$create_resp" "create DNS record"
  fi
  echo "  DNS: $TUNNEL_HOSTNAME -> $cname_target (proxied)"
}

print_summary() {
  echo ""
  echo "=== Setup complete ==="
  echo ""
  if [[ "${INSTALL_MODE:-docker}" == "local" ]]; then
    echo "Cloudflare tunnel provisioned. Continuing local installation..."
  else
    echo "Next steps:"
    echo "  docker compose up -d"
    echo "  # or for local install:"
    echo "  sudo bash install-local.sh"
    echo ""
    echo "Then open: https://$TUNNEL_HOSTNAME"
    echo "(UI Password is in .env as UI_PASSWORD)"
  fi
}

# ── Main ───────────────────────────────────────────────────────────────────────
main() {
  load_env
  validate_env
  check_dependencies
  setup_cf_auth

  echo "=== OpenChamber Cloudflare Setup ==="
  echo "Hostname: $TUNNEL_HOSTNAME"
  echo "Tunnel:   $TUNNEL_NAME"
  echo ""

  get_account
  find_zone
  create_or_find_tunnel
  get_tunnel_token
  write_cloudflared_config
  configure_dns
  print_summary
}

main "$@"
