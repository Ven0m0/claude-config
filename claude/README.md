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

### How to use this directory

- **Config pack**: Copy or symlink this `claude/` directory (or its contents) into your Claude Code config: `~/.claude/` (user) or your project's `.claude/` (project). Then `CLAUDE.md`, `AGENTS.md`, agents, skills, rules, and hooks are loaded from there.
- **Marketplace**: This repo is also a plugin marketplace. Plugins live under `plugins/`; adding the marketplace (`/plugin marketplace add Ven0m0/claude-config`) installs those plugins. The `claude/` directory is the shared config pack; to use it you still need to point Claude Code at this repo or copy `claude/` into your config (see [SETUP.md](../SETUP.md)).
- **Hooks**: Hooks in `hooks/hooks.json` use `${CLAUDE_PLUGIN_ROOT}` or `${PLUGIN_DIR}`. When using the repo as the config source, set the repo root (or the directory containing `claude/`) as that variable so hook scripts resolve. When copying only `claude/` to `~/.claude/`, you may need to set `CLAUDE_PLUGIN_ROOT` to the directory that contains `hooks/` and `scripts/`, or adjust paths. See [docs/hooks.md](docs/hooks.md).

### Key documentation

| Doc | Purpose |
|-----|---------|
| [docs/progressive-disclosure.md](docs/progressive-disclosure.md) | Content architecture (quick ref, implementation, advanced) |
| [docs/prompt-best-practices.md](docs/prompt-best-practices.md) | Prompt design best practices |
| [docs/skills-index.md](docs/skills-index.md) | Concise skills reference (33 skills) |
| [docs/toon.md](docs/toon.md) | TOON format and token-efficient data |
| [docs/claude-md-guide.md](docs/claude-md-guide.md) | CLAUDE.md authoring best practices and scoring rubric |

Start with `CLAUDE.md` (points to `AGENTS.md`) for project-wide rules and agent orchestration.

> **Note:** Removed copies of official Anthropic docs. See [code.claude.com/docs](https://code.claude.com/docs) for official documentation on settings, subagents, MCP, and prompt caching.

### Agent and skill optimization

| Use case | Agent or skill |
|----------|----------------|
| Optimize agents / run more optimizations | **improve-agent** |
| Optimize markdown for tokens | **markdown-optimizer** |
| CLAUDE.md audit/optimize/create/migrate | **claudemd**, **claude-md-auditor** |
| Skill definitions and validation | **skill-auditor** |
| Optimize skills for token efficiency | **skill-optimizer** skill |
| Doc token analysis and restructuring | **llm-docs-optimizer** skill |
| Tool substitution (fd, rg, bun, uv) | **modern-tool-substitution** skill |
| Hook config and lifecycle | **hooks-configuration** skill |

See [AGENTS.md](AGENTS.md) for the full agent table and when to delegate.

### Token reduction and TOON/ZON

| Use case | Resource |
|----------|----------|
| Choose ZON/TOON/PLOON for data dirs | **toon-formatter** skill |
| Encode/validate TOON | **toon-formatter** skill; [scripts/validate-toon.py](scripts/validate-toon.py) |
| Context/token budget | **strategic-compact** skill, **moai** skill |
| Model params by task type | [docs/llm-tuning.md](docs/llm-tuning.md) |

See [docs/toon.md](docs/toon.md) and [AGENTS.md](AGENTS.md) (Workflow and doc optimization).

### Configuration structure

```
claude/
├── AGENTS.md             # Agent list, tool prefs, code standards, orchestration
├── CLAUDE.md             # Entry point (→ AGENTS.md)
├── settings.json         # Permissions, env, model options
├── env-setup.sh          # Environment setup for CLAUDE_ENV_FILE
├── commands/             # Command macros
├── hooks/                # Auto-format, lint, MCP load hooks
├── agents/               # Specialized agents (see AGENTS.md)
├── skills/               # 33 consolidated skill extensions
├── rules/                # Rules and workflow
├── docs/                 # Reference docs (14 files)
├── workflows/            # CLAUDE.md workflows (audit, create, optimize)
└── scripts/              # Utilities (analyze-claude-md, validate-toon, etc.)
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
| Skills      | 60 directories     | 33 directories    | **45%**   |
| Docs        | 20 files (~320KB)  | 14 files (~120KB) | **63%**   |

**Total config size reduction: ~55%**

### Recent Consolidation (2026-02-18)

**Skills (60 → 33):**
- Merged TOON skills: `use-toon`, `toon-formatter`, `ref-toon-format` → `toon-formatter`
- Merged MoAI skills: `moai`, `moai-foundation-claude`, `moai-foundation-context` → `moai`
- Merged MCP skills: `mcp-builder`, `mcp-tools-as-code`, `mcp-to-skill-converter` → `mcp-builder`
- Removed minimal/redundant skills: 26 directories

**Docs (20 → 14):**
- Removed official doc copies: `claude-code-settings.md` (105KB), `prompt-caching.md` (78KB), `skills-ref.md` (33KB), `subagents.md` (34KB), `mcp.md` (43KB), `best-practices-claude.md` (36KB)
- Merged: `best-practices-skills.md` → `claude-md-guide.md`
- Created: `skills-index.md` (concise skill reference)

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
