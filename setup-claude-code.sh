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
echo ""

# Install MCP servers using bunx (Node.js) and uvx (Python)
echo "📦 Installing MCP servers..."

# Node.js-based MCP servers (using bunx)
NODE_MCP_SERVERS=(
    "@modelcontextprotocol/server-sequential-thinking"
    "@morph-llm/morph-fast-apply"
    "@just-every/mcp-read-website-fast"
    "@modelcontextprotocol/server-brave-search"
    "@modelcontextprotocol/server-memory"
    "gemini-mcp-tool"
	"@upstash/context7-mcp"
)

for server in "${NODE_MCP_SERVERS[@]}"; do
    echo "  Installing $server (bunx)..."
    bunx --bun "$server" --version 2>/dev/null || echo "    Note: $server will be installed on first use"
done

# Python-based MCP servers (using uvx)
echo "  Installing serena (uvx)..."
uvx --from git+https://github.com/oraios/serena serena --help 2>/dev/null || echo "    Note: serena will be installed on first use"

echo "  ✅ MCP servers configured"
echo ""

# Create/update settings.json
echo "⚙️  Creating settings.json..."
cat > "$SETTINGS_FILE" << 'EOF'
{
	"$schema": "https://json.schemastore.org/claude-code-settings.json",
	"env": {
		"CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC": "1",
		"DISABLE_NON_ESSENTIAL_MODEL_CALLS": "1",
		"USE_BUILTIN_RIPGREP": "0",
		"DISABLE_PROMPT_CACHING": "0",
		"DISABLE_TELEMETRY": "1",
		"DISABLE_ERROR_REPORTING": "1",
		"ENABLE_LSP_TOOL": "1",
		"CLAUDE_BASH_MAINTAIN_PROJECT_WORKING_DIR": "1",
		"DISABLE_BUG_COMMAND": "1",
		"PYTHONPATH": ".",
		"BASH_DEFAULT_TIMEOUT_MS": "120000",
		"BASH_MAX_TIMEOUT_MS": "600000",
		"BASH_MAX_OUTPUT_LENGTH": "100000",
		"CLAUDE_CODE_MAX_OUTPUT_TOKENS": "8000",
		"MCP_TIMEOUT": "30000",
		"MCP_TOOL_TIMEOUT": "60000",
		"MAX_MCP_OUTPUT_TOKENS": "20000"
	},
	"includeCoAuthoredBy": false,
	"permissions": {
		"allow": [
			"Bash",
			"Bash(git:*)",
			"Bash(gh:*)",
			"Bash(cat:*)",
			"Bash(ls:*)",
			"Bash(eza:*)",
			"Bash(rg:*)",
			"Bash(fd:*)",
			"Bash(find:*)",
			"Bash(grep:*)",
			"Bash(head:*)",
			"Bash(tail:*)",
			"Bash(cp:*)",
			"Bash(bun:*)",
			"Bash(uv:*)",
			"Bash(python3:*)",
			"Bash(python:*)",
			"Bash(ruff:*)",
			"Bash(cargo fmt:*)",
			"Bash(rustfmt:*)",
			"Bash(jaq:*)",
			"Bash(jq:*)",
			"Bash(curl:*)",
			"Bash(wget:*)",
			"Bash(aria2c:*)",
			"Bash(axel:*)",
			"BashOutput",
			"Edit",
			"MultiEdit",
			"TodoWrite",
			"Write",
			"Glob",
			"Grep",
			"Read",
			"LS",
			"Skill",
			"SlashCommand",
			"KillShell",
			"Task",
			"WebSearch",
			"WebFetch",
			"mcp__*"
		],
		"defaultMode": "acceptEdits"
	},
	"model": "claude-sonnet-4.5",
	"enabledPlugins": {
		"context7@claude-plugins-official": true,
		"serena@claude-plugins-official": true,
		"prompt-optimizer@daymade-skills": true,
		"claude-code-tools@claudex": true,
		"repomix-explorer@repomix": true,
		"repomix-mcp@repomix": true,
		"general-dev@claude-settings": true,
		"ultralytics-dev@claude-settings": true,
		"claude-md-progressive-disclosurer@daymade-skills": true,
		"docs-cleaner@daymade-skills": true,
		"optimize-claude-md@lifegenie-marketplace": true,
		"conserve@claude-night-market": true,
		"github@claude-plugins-official": true,
		"vscode-langservers@claude-code-lsps": true,
		"rust-analyzer@claude-code-lsps": true,
		"bash-language-server@claude-code-lsps": true,
		"yaml-language-server@claude-code-lsps": true,
		"plugin-dev@claude-settings": true,
		"fact-checker@daymade-skills": true,
		"thinking-partner@lifegenie-marketplace": true,
		"block-dotfiles@wombat9000-marketplace": true,
		"config-wizard@wombat9000-marketplace": true,
		"dependency-blocker@wombat9000-marketplace": true,
		"superpowers@claude-plugins-official": true,
		"frontend-design@claude-plugins-official": true,
		"feature-dev@claude-plugins-official": true
	},
	"forceLoginMethod": "claudeai",
	"spinnerTipsEnabled": false,
	"alwaysThinkingEnabled": true
}
EOF

echo "  ✅ settings.json created"

# Update .claude.json to add MCP servers
echo "🔧 Configuring MCP servers in .claude.json..."
if [ -f "$CLAUDE_JSON" ]; then
    # Backup existing file
    cp "$CLAUDE_JSON" "$CLAUDE_JSON.backup"
    echo "  ✅ Backed up existing .claude.json"
fi

# Create/update .claude.json with MCP servers
cat > "$CLAUDE_JSON" << 'EOF'
{
  "installMethod": "native",
  "autoUpdates": true,
  "mcpServers": {
    "sequential-thinking": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--bun",
        "@modelcontextprotocol/server-sequential-thinking"
      ],
      "env": {}
    },
    "morphllm-fast-apply": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--bun",
        "@morph-llm/morph-fast-apply"
      ],
      "env": {}
    },
    "read-website-fast": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--bun",
        "@just-every/mcp-read-website-fast"
      ],
      "env": {}
    },
    "search": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--bun",
        "@modelcontextprotocol/server-brave-search"
      ],
      "env": {}
    },
    "memory": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--bun",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {}
    },
    "gemini-cli": {
      "type": "stdio",
      "command": "bunx",
      "args": [
        "--bun",
        "gemini-mcp-tool"
      ],
      "env": {}
    },
    "serena": {
      "type": "stdio",
      "command": "uvx",
      "args": [
        "--from",
        "git+https://github.com/oraios/serena",
        "serena",
        "start-mcp-server"
      ],
      "env": {}
    }
  }
}
EOF

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
