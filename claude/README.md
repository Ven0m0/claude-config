# Claude Code Configuration

Config pack for Claude Code: commands, hooks, rules, agents, and settings.

## Quick Start

Set your GitHub token for CLI integration:

```bash
export GH_TOKEN="your_github_token_here"        # or GITHUB_TOKEN
```

Get a token at: https://github.com/settings/tokens (needs `repo` access)

### How to use this directory

Copy or symlink this `claude/` directory (or its contents) into your Claude Code config -
`~/.claude/` (user) or your project's `.claude/` (project). `CLAUDE.md`, agents, rules, and
hooks then load from there.

### Key documentation

| Doc                                                               | Purpose                                                    |
| ------------------------------------------------------------------ | ------------------------------------------------------------ |
| [docs/progressive-disclosure.md](docs/progressive-disclosure.md) | Content architecture (quick ref, implementation, advanced) |
| [docs/prompt-best-practices.md](docs/prompt-best-practices.md)   | Prompt design best practices                                |
| [docs/claude-md-guide.md](docs/claude-md-guide.md)                | CLAUDE.md authoring best practices and scoring rubric       |
| [docs/hooks.md](docs/hooks.md)                                    | Hook lifecycle and this repo's active hook config           |

Start with `CLAUDE.md` for project-wide rules and agent orchestration.

### Configuration structure

```
claude/
├── CLAUDE.md             # Entry point: tool prefs, code standards, agent orchestration
├── settings.json         # Permissions, env, hooks, MCP servers, model options
├── .mcp.json             # Additional MCP server definitions
├── .lsp.json             # LSP server config
├── agent.sh              # LLM-provider switcher (ANTHROPIC_BASE_URL)
├── commands/              # Slash-command macros
├── hooks/                # session-init.sh (SessionStart); other hooks live inline in settings.json
├── agents/               # Specialized subagents (see CLAUDE.md)
├── skills/                # Project-local skills (currently empty)
├── rules/                # Path-scoped rules: claude/ (general) and languages/ (per-language)
├── docs/                 # Reference docs
└── scripts/              # Utilities (analyze-claude-md.ts)
```

## Commands

Available under `commands/`: `analyze-issue`, `ci-gen`, `clean`, `dependency-audit`, `docs`,
`fix`, `pipeline-optimize`. See each file for details.

## Hooks

Configured directly in `settings.json`'s `hooks` key:

- **SessionStart**: runs `hooks/session-init.sh`.
- **PostToolUse** (Edit/MultiEdit/Write): shellcheck + shfmt on `.sh` files, `git add` on the
  edited file, `prettier` formatting.

There is no separate `hooks.json` - `settings.json` is the single source of truth for hook
wiring in this repo.

## Troubleshooting

**JSON validation failed?**

```bash
jq empty settings.json
jq empty .mcp.json
```

**Hooks not running?**
Check that hooks are enabled in your project settings and the commands in `settings.json`
resolve relative to `$CLAUDE_PROJECT_DIR`.

## Resources

- [Claude Code Docs](https://code.claude.com/docs)

## Security

- Never commit `.env` files or tokens
- Use environment variables for secrets
- `.gitignore` protects `.claude.json` (user state)

## License

Configuration files are provided as-is for personal/team use.
