# Setup enforcement (hooks and settings)

Stub workflow for configuring hooks and settings to enforce CLAUDE.md and project standards.

## When to use

- User wants "enforcement", "hooks", or "settings" for automatic formatting, linting, or policy.
- See [../docs/hooks.md](../docs/hooks.md) and the **hooks-configuration** skill for hook lifecycle and patterns.
- See [../settings.json](../settings.json) for permissions and env; copy or merge into `~/.claude/settings.json` or project `.claude/settings.json` as needed.
- Ensure `CLAUDE_PLUGIN_ROOT` (or `PLUGIN_DIR`) is set when using repo hooks so script paths in hooks.json resolve.
