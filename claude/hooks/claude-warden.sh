#!/usr/bin/env bash
# shellcheck enable=all shell=bash
set -euo pipefail

# claude-warden: Token-saving hook stub
# Based on johnzfitch/claude-warden patterns:
# - Inject quiet flags to reduce output noise
# - Truncate verbose output
# - Enforce subagent budgets

# shellcheck source=claude/hooks/session-init.sh
# shellcheck disable=SC1091
[[ -f "${CLAUDE_DIR:-${HOME}/.claude}/hooks/session-init.sh" ]] && source "${CLAUDE_DIR:-${HOME}/.claude}/hooks/session-init.sh"

has(){ command -v -- "$1" &>/dev/null; }

WARDEN_CONFIG="${CLAUDE_DIR:-${HOME}/.claude}/config/warden.json"
WARDEN_LOG="${CLAUDE_DIR:-${HOME}/.claude}/logs/warden.log"

init_warden(){
  mkdir -p "$(dirname "$WARDEN_LOG")" "$(dirname "$WARDEN_CONFIG")"
  if [[ ! -f "$WARDEN_CONFIG" ]]; then
    cat > "$WARDEN_CONFIG" <<'EOF'
{
  "version": "0.1.0",
  "quiet_flags": {
    "enabled": true,
    "claudelint": "--quiet",
    "ruff": "--quiet"
  },
  "output_truncation": {
    "enabled": true,
    "max_lines": 100
  },
  "subagent_budget": {
    "enabled": false,
    "max_tokens": 4096
  }
}
EOF
  fi
}

truncate_output(){
  local output="$1"
  local max_lines="${2:-100}"
  mapfile -t lines <<< "$output"
  if [[ ${#lines[@]} -gt $max_lines ]]; then
    printf '%s\n' "${lines[@]:0:$max_lines}"
    printf '\n... Output truncated (%d total lines) ...\n' "${#lines[@]}"
  else
    printf '%s\n' "$output"
  fi
}

inject_quiet_flags(){
  local cmd="$1"
  shift
  case "$cmd" in
    claudelint) printf '%s --quiet ' "$cmd" ;;
    ruff)       printf '%s --quiet ' "$cmd" ;;
    *)          printf '%s ' "$cmd" ;;
  esac
  printf '%s ' "$@"
}

log_warden(){
  local msg="$1"
  mkdir -p "$(dirname "$WARDEN_LOG")"
  printf '[%s] %s\n' "$(date -Iseconds)" "$msg" >> "$WARDEN_LOG"
}

main(){
  local hook_type="${1:-}"
  case "$hook_type" in
    session-start)
      init_warden
      log_warden "Session started with claude-warden"
      ;;
    pre-tool)
      local tool="${2:-}"
      log_warden "Pre-tool: $tool"
      ;;
    post-tool)
      local tool="${2:-}"
      log_warden "Post-tool: $tool"
      ;;
    *)
      init_warden
      ;;
  esac
}

main "$@"
