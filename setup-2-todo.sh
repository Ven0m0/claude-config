#!/usr/bin/env bash
# shellcheck enable=all shell=bash source-path=SCRIPTDIR external-sources=true
# Purpose: Setup Token-Optimized LLM Env (ZON, PLOON, Prunize, Context Engineering)
# Deps: bun, uv, claude, git, jq
set -euo pipefail; shopt -s nullglob globstar IFS=$'\n\t' LC_ALL=C

# --- Helpers ---
has() { command -v -- "$1" &>/dev/null; }
msg() { printf '[+] %s\n' "$@"; }
log() { printf '[!] %s\n' "$@" >&2; }
die() { printf '[x] %s\n' "$1" >&2; exit "${2:-1}"; }

# --- Checks ---
[[ $EUID -eq 0 ]] && die "Do not run as root."
has bun || die "bun missing."
has uv || die "uv missing."
has git || die "git missing."

main() {
  local -a bun_globals uv_tools claude_plugins
  # 1. Define Tools (Brave Search REMOVED)
  # Focusing on Token Efficiency & Context Engineering
  bun_globals=(
    "zon-format"                    # ZON: 35-70% reduction vs JSON
    "ploon-cli"                     # PLOON: Path-Level Object Notation
    "tooner"                        # TOON Formatter
    "@danyiel-colin/tree-sitter-toon"
    "repomix"                       # Context packing
    "superclaude"                   # Workflow enhancement
    "@modelcontextprotocol/server-github"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-sequential-thinking"
    "@morph-llm/morph-fast-apply"
    "@just-every/mcp-read-website-fast"
    "@mcp-b/smart-dom-reader"       # Efficient DOM reading
    "claudelint"                    # Linting interactions
    "mdminify"                      # Markdown minification
  )
  uv_tools=(
    "beads-mcp"
    "gemini-bridge"
  )
  # 2. Install Core Runtimes & Tools
  msg "Installing Token Optimization Tools..."
 bun a -g --trust "${bun_globals[@]}"
  msg "Installing UV Tools..."
  for tool in "${uv_tools[@]}"; do
    uv tool install "$tool" --force || log "Failed $tool"
  done

  # 3. Setup Prunize (Token Pruning)
  # Assuming git repo usage as standard package may not exist
  if [[ ! -d "$HOME/tools/prunize" ]]; then
    msg "Installing Prunize..."
    mkdir -p "$HOME/tools"
    git clone https://github.com/qirkpetrucci/prunize "$HOME/tools/prunize" || log "Prunize clone failed"
    # Link if executable exists, else instruction in workflow
    if [[ -f "$HOME/tools/prunize/prunize.py" ]]; then
       chmod +x "$HOME/tools/prunize/prunize.py"
       mkdir -p "$HOME/.local/bin"
       ln -sf "$HOME/tools/prunize/prunize.py" "$HOME/.local/bin/prunize"
    fi
  fi
  # 4. Synthesize LLM Workflows
  setup_workflows
  # 5. MCP Configuration (Excluding Brave, TODO sources)
  setup_mcp
  msg "Setup Complete. Review WORKFLOW_TOKEN_OPT.md for usage."
}
setup_workflows() {
  msg "Synthesizing Context Engineering Workflows..."
  local skill_dir="$HOME/.claude/skills/external"
  mkdir -p "$skill_dir"
  # Clone sources to extract skills
  local -A sources=(
    ["context-eng"]="https://github.com/muratcankoylan/Agent-Skills-for-Context-Engineering"
    ["agent-toolkit"]="https://github.com/softaworks/agent-toolkit"
    ["night-market"]="https://github.com/athola/claude-night-market"
  )
  for name in "${!sources[@]}"; do
    if [[ ! -d "$skill_dir/$name" ]]; then
      git clone --depth 1 "${sources[$name]}" "$skill_dir/$name" || log "Failed clone $name"
    else
      git -C "$skill_dir/$name" pull --rebase || :
    fi
  done
  # Generate Unified Workflow File
  cat <<EOF > WORKFLOW_TOKEN_OPT.md
# Token Optimization & Context Engineering Workflow

## 1. Context Pruning (Entropy Reduction)
**Goal:** Maximize signal-to-noise ratio.
- **Tools:** \`prunize\`, \`repomix\`, \`mdminify\`
- **Strategy:**
  1. **Prune**: Use \`prunize\` to strip low-value files (logs, lockfiles, TODOs).
  2. **Minify**: Pipe markdown through \`mdminify\` before context loading.
  3. **Pack**: Use \`repomix --remove-empty-lines --remove-comments\`.

## 2. Data Formatting (ZON/PLOON/TOON)
**Goal:** Reduce structured data tokens by 30-60%.
- **ZON**: Use for complex nested data (35-70% cheaper than JSON).
  \`\`\`bash
  zon encode data.json > context.zon
  \`\`\`
- **PLOON**: Use for deep hierarchies (path-level notation).
  \`\`\`bash
  ploon data.json --minify > context.pln
  \`\`\`
- **TOON**: Legacy support via \`tooner\`.

## 3. Active Agent Skills (Integrated)
Source: \`$skill_dir\`
1. **Context Engineering** (Muratcan Koylan):
   - Use \`context-compression\` for long sessions.
   - Apply \`context-degradation\` checks to prevent "lost-in-middle".
2. **Entropy Reduction** (Softaworks):
   - Run \`agent-md-refactor\` to condense documentation.
   - Use \`skill-judge\` to validate token usage of new prompts.
3. **Conservation** (Athola):
   - Active monitoring via \`conserve\` plugin.

## 4. Linting & Safety
- Run \`claudelint\` on all custom agent skills before deployment.
EOF
  msg "Generated WORKFLOW_TOKEN_OPT.md"
}

setup_mcp() {
  if has claude; then
    msg "Configuring Claude MCP (Clean Slate)..."
    
    # Core MCPs
    claude mcp add --transport stdio context7 -- bunx @context7/mcp-server || :
    claude mcp add --transport stdio sequential-thinking -- bunx @modelcontextprotocol/server-sequential-thinking || :
    claude mcp add --transport stdio memory -- bunx @modelcontextprotocol/server-memory || :
    claude mcp add --transport http github https://api.githubcopilot.com/mcp/ || :
    # Optimization MCPs
    claude mcp add --transport stdio read-fast -- bunx @just-every/mcp-read-website-fast || :
    claude mcp add --transport stdio dom-reader -- bunx @mcp-b/smart-dom-reader || :
  
    # Plugins (Filtered)
    local -a safe_plugins=(
      "athola/claude-night-market"       # For conserve
      "kadykov/mdminify"                 # Minification
      "stbenjam/claudelint"              # Linting
    )
    for p in "${safe_plugins[@]}"; do
      claude plugin marketplace add "$p" || :
    done
  fi
  
  # VS Code Extension Setup for TOON/ZON
  if has code; then
    msg "Installing VS Code Extensions..."
    code --install-extension NicholasPiesco.toonify --force || :
  fi
}

main "$@"
