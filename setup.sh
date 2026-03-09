#!/usr/bin/env bash
# shellcheck enable=all shell=bash
# Consolidated Claude Code setup: marketplaces, MCP servers, tools, git config
# Merged from: setup.sh, setup-2-todo.sh, claude/setup.sh
set -euo pipefail
shopt -s nullglob globstar

# --- Constants ---
CLAUDE_DIR="${HOME}/.claude"
MARKETPLACE_DIR="${CLAUDE_DIR}/plugins/marketplaces"
EXTERNAL_SKILLS_DIR="${CLAUDE_DIR}/skills/external"

# --- Helpers ---
has(){ command -v -- "$1" &>/dev/null; }
msg(){ printf '[+] %s\n' "$@"; }
log(){ printf '[!] %s\n' "$@" >&2; }
die(){ printf '[x] %s\n' "$1" >&2; exit "${2:-1}"; }

# --- Checks ---
[[ ${EUID:-$(id -u)} -eq 0 ]] && die "Do not run as root."

check_deps(){
  local missing=()
  for tool in bun uv git; do
    has "$tool" || missing+=("$tool")
  done
  [[ ${#missing[@]} -eq 0 ]] || die "Missing required tools: ${missing[*]}"
}

# --- Marketplaces ---
setup_marketplaces(){
  msg "Installing Claude Code marketplaces..."
  local -a marketplaces=(
    "anthropics/claude-plugins-official"
    "daymade/claude-code-skills"
    "cskiro/claudex"
    "yamadashy/repomix"
    "fcakyon/claude-codex-settings"
    "lifegenieai/lifegenie-claude-marketplace"
    "athola/claude-night-market"
    "wombat9000/claude-plugins"
    "Piebald-AI/claude-code-lsps"
    "SuperClaude-Org/SuperClaude_Plugin"
    "elb-pr/claudikins-marketplace"
    "rand/rlm-claude-code"
    "cexll/myclaude"
    "edmundmiller/dotfiles"
    "zircote/lsp-marketplace"
    "kadykov/mdminify"
    "stbenjam/claudelint"
    "mksglu/context-mode"
  )
  for mp in "${marketplaces[@]}"; do
    claude plugin marketplace add "$mp" 2>/dev/null || log "Already exists or failed: $mp"
  done
}

# --- MCP Servers ---
setup_mcp(){
  msg "Configuring MCP servers..."
  if ! has claude; then
    log "claude CLI not found, skipping MCP configuration"
    return
  fi
  claude mcp add --transport stdio context7 -- bunx @context7/mcp-server || :
  claude mcp add --transport stdio sequential-thinking -- bunx @modelcontextprotocol/server-sequential-thinking || :
  claude mcp add --transport stdio memory -- bunx @modelcontextprotocol/server-memory || :
  claude mcp add --transport http github https://api.githubcopilot.com/mcp/ || :
  claude mcp add --transport stdio read-fast -- bunx @just-every/mcp-read-website-fast || :
  claude mcp add --transport stdio dom-reader -- bunx @mcp-b/smart-dom-reader || :
}

# --- Bun Global Packages ---
setup_bun_globals(){
  msg "Installing bun global packages..."
  local -a pkgs=(
    # Token optimization formats
    "zon-format"
    "ploon-cli"
    "tooner"
    "@danyiel-colin/tree-sitter-toon"
    "@toon-format/cli"
    # Context engineering
    "repomix"
    "superclaude"
    # MCP servers
    "@modelcontextprotocol/server-github"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-sequential-thinking"
    "@morph-llm/morph-fast-apply"
    "@just-every/mcp-read-website-fast"
    "@mcp-b/smart-dom-reader"
    "gemini-mcp-tool"
    "@upstash/context7-mcp"
    # Utilities
    "claudelint"
    "mdminify"
    "claude-code-lint"
  )
  bun i -g --trust "${pkgs[@]}" || log "Some bun packages may have failed"
}

# --- UV Tools ---
setup_uv_tools(){
  msg "Installing uv tools..."
  [[ -d "${HOME}/.venv" || -d .venv ]] || uv venv --seed
  for tool in beads-mcp gemini-bridge basedpyright; do
    uv tool install "$tool" --force || log "Failed: $tool"
  done
}

# --- Git Config (from claude/setup.sh) ---
setup_git_config(){
  msg "Optimizing git configuration..."
  git config --global --add safe.directory "$(realpath .)"
  git config --global index.threads 0
  git config --global core.preloadindex true
  git config --global diff.context 3
  git config --global diff.suppressBlankEmpty true
  git config --global diff.compactionHeuristic true
  git config --global diff.ignoreSubmodules true
  git config --global diff.algorithm histogram
  git config --global merge.conflictStyle zdiff3
  git config --global fetch.parallel 0
  git config --global pack.threads 0
  git config --global status.short true
  git config --global commit.verbose false
}

# --- External Skills ---
setup_external_skills(){
  msg "Cloning external skill repositories..."
  mkdir -p "${EXTERNAL_SKILLS_DIR}"
  local -A sources=(
    ["context-eng"]="https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering"
    ["agent-toolkit"]="https://github.com/softaworks/agent-toolkit"
    ["night-market"]="https://github.com/athola/claude-night-market"
  )
  for name in "${!sources[@]}"; do
    if [[ ! -d "${EXTERNAL_SKILLS_DIR}/$name" ]]; then
      git clone --depth 1 "${sources[$name]}" "${EXTERNAL_SKILLS_DIR}/$name" || log "Failed clone: $name"
    else
      git -C "${EXTERNAL_SKILLS_DIR}/$name" pull --rebase || log "Failed pull: $name"
    fi
  done
}

# --- Optional: Prunize ---
setup_prunize(){
  if [[ -d "${HOME}/tools/prunize" ]]; then
    msg "Prunize already installed"
    return
  fi
  msg "Installing prunize..."
  mkdir -p "${HOME}/tools"
  git clone --depth 1 https://github.com/qirkpetrucci/prunize "${HOME}/tools/prunize" || { log "Prunize clone failed"; return; }
  if [[ -f "${HOME}/tools/prunize/prunize.py" ]]; then
    chmod +x "${HOME}/tools/prunize/prunize.py"
    mkdir -p "${HOME}/.local/bin"
    ln -sf "${HOME}/tools/prunize/prunize.py" "${HOME}/.local/bin/prunize"
  fi
}

# --- Optional: Tweakcc ---
setup_tweakcc(){
  msg "Setting up tweakcc..."
  has uv || wget -qO- https://astral.sh/uv/install.sh | sh
  mkdir -p "${CLAUDE_DIR}/tweakcc"
  export TWEAKCC_CONFIG_DIR="${CLAUDE_DIR}/tweakcc" TWEAKCC_CC_INSTALLATION_PATH="/opt/claude-code/bin/claude"
  sudo bunx tweakcc --apply || log "tweakcc may require manual setup"
}

# --- Optional: Cursor ---
setup_cursor(){
  msg "Configuring Cursor..."
  mkdir -p "${HOME}/.cursor"
  if [[ -f "${HOME}/.cursor/argv.json" ]]; then
    sed -i 's/"enable-crash-reporter":[[:space:]]*true/"enable-crash-reporter": false/' "${HOME}/.cursor/argv.json"
  fi
}

# --- Optional: VS Code Extensions ---
setup_vscode(){
  if ! has code; then
    log "VS Code not found, skipping extensions"
    return
  fi
  msg "Installing VS Code extensions..."
  code --install-extension NicholasPiesco.toonify --force || log "Failed: toonify extension"
}

# --- Help ---
show_help(){
  cat <<'HELP'
Usage: ./setup.sh [OPTIONS]

Core (always runs):
  Marketplaces, MCP servers, bun globals, uv tools, git config, external skills

Options:
  --with-prunize     Install prunize (token pruning)
  --with-tweakcc     Apply tweakcc optimizations (requires sudo)
  --with-cursor      Configure Cursor editor
  --with-vscode      Install VS Code extensions
  --skip-git-config  Skip global git configuration
  --skip-mcp         Skip MCP server configuration
  --dry-run          Preview actions without executing
  --help             Show this message
HELP
}

# --- Main ---
main(){
  local dry_run=0 with_prunize=0 with_tweakcc=0 with_cursor=0 with_vscode=0
  local skip_git=0 skip_mcp=0

  while [[ $# -gt 0 ]]; do
    case "$1" in
      --dry-run)        dry_run=1 ;;
      --with-prunize)   with_prunize=1 ;;
      --with-tweakcc)   with_tweakcc=1 ;;
      --with-cursor)    with_cursor=1 ;;
      --with-vscode)    with_vscode=1 ;;
      --skip-git-config) skip_git=1 ;;
      --skip-mcp)       skip_mcp=1 ;;
      --help)           show_help; exit 0 ;;
      *)                log "Unknown option: $1"; show_help; exit 1 ;;
    esac
    shift
  done
  if [[ $dry_run -eq 1 ]]; then
    msg "DRY-RUN: would run setup_marketplaces, setup_mcp, setup_bun_globals,"
    msg "  setup_uv_tools, setup_git_config, setup_external_skills"
    [[ $with_prunize -eq 1 ]] && msg "  + setup_prunize"
    [[ $with_tweakcc -eq 1 ]] && msg "  + setup_tweakcc"
    [[ $with_cursor -eq 1 ]]  && msg "  + setup_cursor"
    [[ $with_vscode -eq 1 ]]  && msg "  + setup_vscode"
    return
  fi
  check_deps
  mkdir -p "${CLAUDE_DIR}" "${MARKETPLACE_DIR}"
  setup_marketplaces
  [[ $skip_mcp -eq 0 ]]  && setup_mcp
  setup_bun_globals
  setup_uv_tools
  [[ $skip_git -eq 0 ]]  && setup_git_config
  setup_external_skills
  [[ $with_prunize -eq 1 ]] && setup_prunize
  [[ $with_tweakcc -eq 1 ]] && setup_tweakcc
  [[ $with_cursor -eq 1 ]]  && setup_cursor
  [[ $with_vscode -eq 1 ]]  && setup_vscode
  claude plugin marketplace update 2>/dev/null || :
  msg "Setup complete. Restart Claude Code to apply changes."
}
main "$@"
