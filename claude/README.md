# Claude/Copilot CLI Configuration

Optimized configuration for Claude Code and GitHub Copilot CLI with token-efficient commands, hooks, and settings.

## Quick Start

### Required Environment Variables

Set your GitHub token for CLI integration:

```bash
# Option 1: GitHub Token (recommended)
export GH_TOKEN="your_github_token_here"

# Option 2: Alternative name
export GITHUB_TOKEN="your_github_token_here"
```

Get a token at: https://github.com/settings/tokens (needs `repo` access)

### Persistent Environment with CLAUDE_ENV_FILE

For persistent environment variables across all Bash commands in Claude Code, use `CLAUDE_ENV_FILE`:

```bash
# Set the path to your environment setup script
export CLAUDE_ENV_FILE=/path/to/claude/env-setup.sh
claude
```

The `env-setup.sh` script is sourced before each Bash command, making environment variables, aliases, and shell functions available throughout your session.

**Setup options:**

1. **Use the provided env-setup.sh** (recommended for this repo):
   ```bash
   export CLAUDE_ENV_FILE="$(pwd)/claude/env-setup.sh"
   claude
   ```

2. **Create a custom env file** for project-specific needs:
   ```bash
   # Example: env-setup.sh
   conda activate myenv
   export MY_API_KEY="your-key"
   ```

3. **Use SessionStart hooks** for team-shared configurations (see hooks section)

### Configuration Structure

```
claude/
├── settings.json          # Main config (permissions, env, plugins)
├── env-setup.sh          # Environment setup for CLAUDE_ENV_FILE
├── .gitignore            # Prevents secrets/state from being committed
├── commands/             # 17 ultra-short command macros
├── hooks/                # 4 auto-format/lint hooks
├── agents/               # 5 specialized AI agents
├── skills/               # 22 capability extensions
└── rules/                # Performance guidelines
```

## Commands

All commands are ultra-compact "macros" (5-15 lines each) optimized for token efficiency.

### Available Commands

- `prime` - Load project context
- `clean` - Fix linting/formatting
- `optimize` - Analyze performance
- `refactor-code` - Systematic refactoring
- `dependency-audit` - Security audit
- `fix-error` - Error analysis
- `check-fact` - Verify statements
- And 10 more...

### Usage

Commands are available via the CLI's command system. See individual `.md` files in `commands/` for details.

## Hooks

Active hooks (auto-run on file edits):

1. **post-edit-format.py** - Auto-formats Python (ruff), JS/TS (biome), Rust (cargo fmt)
2. **enforce_rg_over_grep.py** - Policy: blocks `grep`/`find`, suggests `rg`/`fd`
3. **json-to-toon.mjs** - Compresses JSON/CSV in prompts (via plugin)
4. **auto-git-add.md** - Auto-stages edited files

## Settings Highlights

### Token Optimization

- **MCP Output**: 20K tokens (was 40K)
- **Bash Output**: 50K chars (was 100K)
- **Permissions**: Simplified to 20 allow rules (was 45)

### Tool Preferences

Modern tools enforced:

- `rg` (ripgrep) > `grep`
- `fd` > `find`
- `bun` > `npm`
- `uvx` (uv) > `pip`

## Optimization Results

| Area        | Before             | After             | Reduction |
| ----------- | ------------------ | ----------------- | --------- |
| Commands    | ~85KB              | ~43KB             | **49%**   |
| Hooks       | 8 files            | 4 files           | **50%**   |
| Settings    | 137 lines, invalid | ~100 lines, valid | **27%**   |
| Permissions | 45 entries         | 20 entries        | **56%**   |

**Total config size reduction: ~50%**

## Maintenance

### Updating Dependencies

```bash
# Check outdated packages
bun outdated  # or npm outdated

# Update incrementally
bun update <package>
```

### Adding New Commands

1. Create `commands/your-command.md`
1. Use this template:

```markdown
---
description: Short description
category: category-name
allowed-tools: Bash, Read  # optional
---

Your ultra-short command instructions here (5-15 lines max).
```

### Troubleshooting

**JSON validation failed?**

```bash
jq empty settings.json
```

**Hooks not running?**
Check that hooks are enabled in your project settings and the plugin system is active.

## Resources

- [GitHub Copilot CLI Docs](https://docs.github.com/en/copilot/using-github-copilot/using-github-copilot-in-the-cli)
- [Claude Code Docs](https://code.claude.com/docs)

## Security

- Never commit `.env` files or tokens
- Use environment variables for secrets
- `.gitignore` protects `.claude.json` (user state)

## License

Configuration files are provided as-is for personal/team use.
