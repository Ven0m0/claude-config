# claude/hooks/

## Responsibility
Event-driven automation hooks for Claude Code. Scripts triggered by lifecycle events (PreToolUse, PostToolUse, SessionStart, PreCompact, Stop) that enforce policies, auto-format code, manage context, and persist memory.

## Design
Hooks are Python/Shell scripts configured in `hooks.json` and `settings.json`. Each hook declares a matcher (tool name regex) and command. Hook types: `PreToolUse` (validate/block before execution), `PostToolUse` (react after execution), `SessionStart` (initialize session), `PreCompact` (preserve state before compaction).

## Contents

| Hook | Event | Purpose |
|------|-------|---------|
| `hooks.json` | config | Hook registry: PreToolUse quality gate, SessionStart MCP loader, PostToolUse formatters |
| `context_protector.py` | PreToolUse | Blocks large file reads to prevent context bloat (configurable threshold) |
| `enforce_rg_over_grep.py` | PreToolUse | Validates Bash commands use `rg` instead of `grep`, `fd` instead of `find` |
| `post-edit-format.py` | PostToolUse | Auto-formats Rust, Python, JS/TS files after edits |
| `precompact_context.py` | PreCompact | Preserves mode, git state, and recent files before compaction |
| `load-mcp-skills.sh` | SessionStart | Loads MCP Skills Registry for 90%+ context savings |
| `ralph-stop-hook.sh` | Stop | Ralph Planner stop hook |
| `json-to-toon.mjs` | PostToolUse | Converts JSON output to TOON format |
| `auto-git-add.json` | config | Auto git-add configuration |
| `auto-git-add.md` | docs | Documentation for auto git-add hook |

### Subdirectory: scripts/
Formatting scripts invoked by PostToolUse hooks:
- `quality_gate.py` -- PreToolUse quality gate for Bash commands
- `format_python_docstrings.py` -- Python docstring formatting
- `python_code_quality.py` -- Python code quality checks
- `prettier_formatting.py` -- Prettier for JS/TS/CSS/HTML
- `markdown_formatting.py` -- Markdown formatting
- `bash_formatting.py` -- Bash script formatting

### Subdirectory: memory-persistence/
Session memory lifecycle hooks:
- `session-start.sh` -- Surfaces recent knowledge entries on session start
- `session-end.sh` -- Persists session state on end
- `pre-compact.sh` -- Saves critical context before compaction

### Subdirectory: strategic-compact/
- `suggest-compact.sh` -- Suggests manual `/compact` at strategic workflow points

## Integration
- Configured in: `hooks.json` (plugin hooks) and `settings.json` (global hooks)
- Triggered by: Claude Code event system (PreToolUse, PostToolUse, SessionStart, etc.)
- Depends on: External tools (ruff, biome, prettier, cargo fmt), Python 3.11+
