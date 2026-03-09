# Setup Guide

Install and configure the Claude Code Plugin Marketplace.

## Prerequisites

- **Claude Code CLI** installed
- **Git**, **bun**, **uv** installed
- Optional: `rg`, `fd`, `jq` for full skill support

## Installation

### Option 1: Add Marketplace (Recommended)

```bash
claude
/plugin marketplace add Ven0m0/claude-config
/plugin install coding-assistant prompt-improver conserve config-wizard dependency-blocker @claude-config-marketplace
```

### Option 2: Install Individual Plugins

```bash
claude
/plugin install coding-assistant@claude-config-marketplace
/plugin install conserve@claude-config-marketplace
```

### Option 3: Local Development

```bash
git clone https://github.com/Ven0m0/claude-config.git
cd claude-config
claude
/plugin marketplace add ./path/to/claude-config
```

### Using the claude/ Config Pack

Copy or symlink `claude/` into `~/.claude/` for agents, skills, hooks, and rules without installing plugins. Set `CLAUDE_PLUGIN_ROOT` so hook commands resolve. See [claude/docs/hooks.md](claude/docs/hooks.md).

### Run Consolidated Setup Script

```bash
./setup.sh                          # Core setup (marketplaces, MCP, tools, git)
./setup.sh --with-prunize --with-tweakcc  # Include optional modules
./setup.sh --dry-run                # Preview without executing
./setup.sh --help                   # Show all options
```

## Plugin Requirements

### Coding Assistant

No special requirements. Optional auto-formatting:

```bash
bun install -g @biomejs/biome      # JS/TS
uv pip install ruff                 # Python
rustup component add rustfmt       # Rust
```

## Verifying Installation

```bash
/plugin list          # List installed plugins
/help                 # List available skills
/code-review --help   # Test a skill
```

## Using the Plugins

### Coding Assistant Examples

```bash
/code-review src/components/UserProfile.tsx
/debug "TypeError: Cannot read property 'map' of undefined"
/refactor src/utils/helpers.js
```

## Configuration

### Disabling Auto-format Hook

Edit `~/.claude/plugins/coding-assistant/plugin.json` and remove the `hooks` field.

## Troubleshooting

### Plugin Not Found

1. Check marketplace is added: `/plugin marketplace list`
2. Refresh: `/plugin marketplace refresh`
3. Re-add: `/plugin marketplace add Ven0m0/claude-config`

### Skill Not Working

1. Check plugin is installed: `/plugin list`
2. Verify plugin loaded: `/plugin info coding-assistant`
3. Reinstall: `/plugin uninstall coding-assistant && /plugin install coding-assistant@claude-config-marketplace`

### Hook Errors

1. Check formatter is installed (biome, ruff, etc.)
2. Make script executable: `chmod +x ~/.claude/plugins/coding-assistant/scripts/format.sh`
3. Test manually: `~/.claude/plugins/coding-assistant/scripts/format.sh test.js`

### MCP Server Not Starting

1. Verify uvx: `uvx --help`
2. Check MCP server: `uvx mcp-server-sqlite --help`
3. Review `.mcp.json` configuration

## Updates and Uninstalling

```bash
/plugin marketplace update claude-config-marketplace
/plugin update coding-assistant
/plugin uninstall coding-assistant
/plugin marketplace remove claude-config-marketplace
```

## Development

### Creating Custom Skills

```bash
cd ~/.claude/plugins/coding-assistant/skills
mkdir my-skill
# Add SKILL.md with frontmatter (see existing skills for template)
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Help

- [README.md](README.md) - Main documentation
- [claude/docs/skills-index.md](claude/docs/skills-index.md) - All skills
- Individual plugin README files
- [Issues](https://github.com/Ven0m0/claude-config/issues)

## Security

- Review plugins before installing
- Check hooks to understand what commands they run
- Report security issues privately to maintainers
