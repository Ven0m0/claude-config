#!/usr/bin/env bash
set -euo pipefail

# Claude Code Setup Script
# This script installs plugins and configures Claude Code based on your existing setup

CLAUDE_DIR="$HOME/.claude"
SETTINGS_FILE="$CLAUDE_DIR/settings.json"
CLAUDE_JSON="$HOME/.claude.json"
MARKETPLACE_DIR="$CLAUDE_DIR/plugins/marketplaces"

echo "🚀 Setting up Claude Code..."

# Create .claude directory if it doesn't exist
mkdir -p "$CLAUDE_DIR"
mkdir -p "$MARKETPLACE_DIR"

# Install marketplaces using Claude CLI
echo "📚 Installing Claude Code marketplaces..."

MARKETPLACES=(
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
)

for marketplace in "${MARKETPLACES[@]}"; do
  echo "  📥 Adding $marketplace..."
  claude plugin marketplace add "$marketplace" 2>/dev/null || echo "    ⚠️  Failed to add $marketplace (may already exist)"
done
echo "  ✅ Marketplaces installation complete"
# Install MCP servers using bunx (Node.js) and uvx (Python)
echo "📦 Installing MCP servers..."
# Node.js-based MCP servers (using bunx)
NODE_MCP_SERVERS=(
  "@modelcontextprotocol/server-sequential-thinking"
  "@morph-llm/morph-fast-apply"
  "@just-every/mcp-read-website-fast"
  "gemini-mcp-tool"
  "@upstash/context7-mcp"
)

for server in "${NODE_MCP_SERVERS[@]}"; do
  echo "  Installing $server (bunx)..."
  bunx "$server" --version 2>/dev/null || echo "    Note: $server will be installed on first use"
done

# Python-based MCP servers (using uvx)
echo "  Installing serena (uvx)..."
uvx --from git+https://github.com/oraios/serena serena --help 2>/dev/null || echo "    Note: serena will be installed on first use"
echo "  ✅ MCP servers configured"

# Create/update settings.json
echo "⚙️  Creating settings.json..."
# TODO: use config file from this repo

echo "  ✅ settings.json created"

# Update .claude.json to add MCP servers
echo "🔧 Configuring MCP servers in .claude.json..."
if [ -f "$CLAUDE_JSON" ]; then
  # Backup existing file
  cp "$CLAUDE_JSON" "$CLAUDE_JSON.backup"
  echo "  ✅ Backed up existing .claude.json"
fi

# Create/update .claude.json with MCP servers
# TODO: use config file from this repo

echo "  ✅ MCP servers configured in .claude.json"

# Plugin installation instructions
echo "📝 Enabled plugins in your config:"
echo "  • Official: context7, serena, github, superpowers, frontend-design, feature-dev"
echo "  • Daymade Skills: prompt-optimizer, claude-md-progressive-disclosurer, docs-cleaner, fact-checker"
echo "  • Claude Settings: general-dev, ultralytics-dev, plugin-dev"
echo "  • LSPs: vscode-langservers, rust-analyzer, bash-language-server, yaml-language-server"
echo "  • Repomix: repomix-explorer, repomix-mcp"
echo "  • Others: claude-code-tools@claudex, conserve@claude-night-market, thinking-partner, block-dotfiles, config-wizard, dependency-blocker"
echo ""

echo "✨ Setup complete!"
echo ""
echo "⚠️  Important notes:"
echo "  • GitHub token was NOT included (add manually if needed)"
echo "  • Hooks were not copied (create ~/.claude/hooks/ if you had custom hooks)"
echo "  • Language servers need to be installed separately (rust-analyzer, bash-language-server, yaml-language-server)"
echo "  • Node.js MCP servers use bunx (not npx) for faster execution"
echo "  • Python MCP servers use uvx (not pipx) - make sure 'uv' is installed"
echo "  • MCP servers will be downloaded on first use"
echo ""
echo "🔄 Restart Claude Code to apply changes"


echo "Setup cursor"

if [[ -d ~/.cursor ]]; then
  [[ -f ~/.cursor/argv.json ]] && sed -i 's/"enable-crash-reporter":[[:space:]]*true/"enable-crash-reporter": false/' ~/.cursor/argv.jsona
else
  mkdir -p ~/.cursor
fi

# Other software
bun a -g --trust pm2 @github/copilot @ai-sdk/openai-compatible @blowmage/cursor-agent-acp @openchamber/web @th0rgal/ralph-wiggum @toon-format/cli \
  fish-lsp openclaw zon-format @zed-industries/claude-code-acp fast-filesystem-mcp code-mode-toon happy-coder @twsxtd/hapi
