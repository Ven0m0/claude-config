# Hooks System

## Hook Types

| Type | Timing | Purpose |
|------|--------|---------|
| PreToolUse | Before tool execution | Validation, parameter modification |
| PostToolUse | After tool execution | Auto-format, checks |
| PreCompact | Before context compaction | State preservation |
| SessionStart | When session begins | Initialization |

## Current Hooks

<hook_registry>

### PreToolUse
- **enforce_rg_over_grep**: blocks `grep`, suggests `rg` (ripgrep)
- **quality_gate**: runs lint and type checks before git commits
- **context_protector**: blocks large file reads to protect context window

### PostToolUse
- **post-edit-format**: auto-formats edited files (Python, JS/TS, Rust, Go)
- **markdown_formatting**: formats code blocks in markdown files
- **python_docstrings**: formats Python docstrings to Google style

### PreCompact
- **precompact_context**: preserves git state and todos before context compaction

### SessionStart
- **load-mcp-skills**: loads MCP skills registry into context

</hook_registry>

## Configuration

Hooks are configured in `~/.claude/settings.json` or project `.claude/hooks/hooks.json`.

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|MultiEdit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "${CLAUDE_PLUGIN_ROOT}/hooks/post-edit-format.py"
          }
        ]
      }
    ]
  }
}
```

## Best Practices

<guidelines>
- PreToolUse hooks: exit with code 2 to block operations
- PostToolUse hooks: use `systemMessage` for non-blocking notifications
- Always handle errors gracefully - hooks should not crash the session
- Use environment variables like `CLAUDE_PLUGIN_ROOT` for paths
</guidelines>
