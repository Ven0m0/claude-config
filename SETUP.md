# Setup Guide

This guide will help you install and configure the Claude Code Plugin Marketplace.

## Prerequisites

- **Claude Code CLI** installed ([Installation Guide](https://code.claude.com/docs/en/installation.md))
- **Git** installed on your system
- **Plugin-specific requirements** (see below for each plugin)

## Installation Steps

### Option 1: Add Marketplace to Claude Code (Recommended)

This is the easiest way to install all plugins:

```bash
# Start Claude Code
claude

# Add this marketplace
/plugin marketplace add Ven0m0/claude-config

# Install all plugins (see marketplace for full list)
/plugin install coding-assistant prompt-improver conserve config-wizard dependency-blocker block-dotfiles gemini-delegation @claude-config-marketplace
```

### Option 2: Install Individual Plugins

Install only the plugins you need:

```bash
claude

# Install just the coding assistant
/plugin install coding-assistant@claude-config-marketplace

# Or install prompt improver
/plugin install prompt-improver@claude-config-marketplace

# Or install conserve (context optimization)
/plugin install conserve@claude-config-marketplace
```

### Option 3: Local Development/Testing

Clone and test locally before publishing:

```bash
# Clone the repository
git clone https://github.com/Ven0m0/claude-config.git
cd claude-config

# In Claude Code, add as local marketplace
claude
/plugin marketplace add ./path/to/claude-config

# Install plugins from local marketplace
/plugin install coding-assistant@claude-config-marketplace
```

### Using the claude/ config pack

To use the shared config (agents, skills, rules, hooks) from this repo without installing plugins:

1. Clone the repo and open your project (or use the repo as your project).
2. Point Claude Code at the repo so that the `claude/` directory is used as config (e.g. set your project root to the repo, or copy/symlink the contents of `claude/` into `~/.claude/` or your project's `.claude/`).
3. If you use hooks, set `CLAUDE_PLUGIN_ROOT` (or `PLUGIN_DIR`) to the path that contains `claude/hooks/` and `claude/scripts/` so hook commands resolve. See [claude/README.md](claude/README.md) and [claude/docs/hooks.md](claude/docs/hooks.md).

## Plugin Requirements

### Coding Assistant

**Required:**

- No special requirements (uses Claude Code's built-in tools)

**Optional (for auto-formatting hook):**

```bash
# JavaScript/TypeScript
bun install -g @biomejs/biome

# Python (via uv - auto-installs on first use)
uv pip install uv
# or install ruff directly
uv pip install ruff

# Go (included with Go installation)
# Rust
rustup component add rustfmt
```

### Technical Writer

**Required:**

- No special requirements

### Data Analyst

**Required for analysis:**

```bash
uv pip install pandas numpy matplotlib seaborn
```

**Optional (for visualizations):**

```bash
uv pip install plotly
```

**Optional (for MCP database server):**

```bash
uv pip install uvx
uvx mcp-server-sqlite
```

## Verifying Installation

After installing plugins, verify they're active:

```bash
# List installed plugins
/plugin list

# List available skills
/help

# Test a skill
/code-review --help
```

You should see your installed plugins and their skills listed.

## Using the Plugins

### Coding Assistant Examples

```bash
# Review code
/code-review src/components/UserProfile.tsx

# Debug an issue
/debug "TypeError: Cannot read property 'map' of undefined"

# Refactor code
/refactor src/utils/helpers.js
```

### Technical Writer Examples

```bash
# Generate API documentation
/api-docs POST /api/v1/users

# Create a user guide
/user-guide "Getting Started with Our Platform"
```

### Data Analyst Examples

```bash
# Analyze a dataset
/analyze-data sales_data.csv

# Create visualizations
/visualize-data data.csv
```

## Configuration

### Disabling Auto-format Hook

If you don't want automatic code formatting, edit the plugin configuration:

```bash
# Navigate to plugin directory
cd ~/.claude/plugins/coding-assistant

# Edit plugin.json and remove the "hooks" field
# or comment it out
```

### Customizing MCP Servers

To use your own database with the data-analyst plugin:

```bash
# Navigate to plugin directory
cd ~/.claude/plugins/data-analyst

# Edit .mcp.json and update the db-path
```

## Troubleshooting

### Plugin Not Found

**Error:** `Plugin 'coding-assistant' not found in marketplace 'claude-config-marketplace'`

**Solution:**

1. Ensure the marketplace is added: `/plugin marketplace list`
2. Refresh marketplace: `/plugin marketplace refresh`
3. Try adding again: `/plugin marketplace add Ven0m0/claude-config`

### Skill Not Working

**Error:** `Skill '/code-review' not found`

**Solution:**

1. Check plugin is installed: `/plugin list`
1. Verify the plugin loaded correctly: `/plugin info coding-assistant`
1. Reinstall if needed: `/plugin uninstall coding-assistant && /plugin install coding-assistant@claude-config-marketplace`

### Hook Errors

**Error:** Hook script fails to execute

**Solution:**

1. Check formatter is installed (biome, ruff, etc.)
1. Make script executable: `chmod +x ~/.claude/plugins/coding-assistant/scripts/format.sh`
1. Test script manually: `~/.claude/plugins/coding-assistant/scripts/format.sh test.js`
1. Disable hook if not needed (edit plugin.json)

### MCP Server Not Starting

**Error:** SQLite MCP server fails to start

**Solution:**

1. Install uvx: `uv pip install uvx`
1. Verify mcp-server-sqlite: `uvx mcp-server-sqlite --help`
1. Check database path in `.mcp.json`
1. Create database directory if needed: `mkdir -p ~/.claude/plugins/data-analyst/data`

## Updating Plugins

Keep your plugins up to date:

```bash
# Update all plugins from a marketplace
/plugin marketplace update claude-config-marketplace

# Update specific plugin
/plugin update coding-assistant

# Check for updates
/plugin outdated
```

## Uninstalling

Remove plugins you no longer need:

```bash
# Uninstall a plugin
/plugin uninstall coding-assistant

# Remove marketplace
/plugin marketplace remove claude-config-marketplace
```

## Development

### Creating Custom Skills

To add your own skills to a plugin:

1. Navigate to plugin's skills directory
1. Create a new directory for your skill
1. Add a `SKILL.md` file with frontmatter
1. Reload the plugin

Example:

```bash
cd ~/.claude/plugins/coding-assistant/skills
mkdir my-skill
cat > my-skill/SKILL.md << 'EOF'
---
name: my-skill
description: What my skill does
user-invocable: true
---

Your skill instructions here...
EOF
```

### Contributing

Want to contribute? See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Getting Help

- **Documentation**: [README.md](README.md)
- **Plugin Docs**: Check individual plugin README files
- **Claude Code Docs**: https://code.claude.com/docs
- **Issues**: Open an issue on GitHub
- **Examples**: See the `examples/` directory

## Security

- **Review plugins** before installing
- **Check hooks** to understand what commands they run
- **Use caution** with plugins that execute system commands
- **Report security issues** privately to the maintainers

______________________________________________________________________

**You're all set! Start using your Claude Code plugins! 🚀**
