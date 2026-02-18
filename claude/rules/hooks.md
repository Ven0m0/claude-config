# Hooks System

## Hook Types

- **PreToolUse**: Before tool execution (validation, parameter modification)
- **PostToolUse**: After tool execution (auto-format, checks)
- **PreCompact**: Before context compaction (state preservation)
- **SessionStart**: When session begins (initialization)

## Current Hooks

### PreToolUse

- **enforce_rg_over_grep**: Blocks usage of `grep`, suggests `rg` (ripgrep)
- **quality_gate**: Runs lint and type checks before git commits
- **context_protector**: Blocks large file reads to protect context window

### PostToolUse

- **post-edit-format**: Auto-formats edited files (Python, JS/TS, Rust, Go)
- **markdown_formatting**: Formats code blocks in markdown files
- **python_docstrings**: Formats Python docstrings to Google style

### PreCompact

- **precompact_context**: Preserves git state and todos before context compaction

### SessionStart

- **load-mcp-skills**: Loads MCP skills registry into context

## Configuration

Hooks are configured in `~/.claude/settings.json` or project `.claude/hooks/hooks.json`.

Example:
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

- PreToolUse hooks should exit with code 2 to block operations
- PostToolUse hooks should use `systemMessage` for non-blocking notifications
- Always handle errors gracefully - hooks should not crash Claude
- Use environment variables like `CLAUDE_PLUGIN_ROOT` for paths
