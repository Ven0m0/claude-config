---
name: hook-authoring
description: Rules for writing Claude Code hook scripts in shell, Python, or JS under claude/hooks/. Use when creating or editing hook files.
---

# Hook Authoring

Hooks live in `claude/hooks/` and are triggered by Claude Code lifecycle events.

## Shell Hooks

- Shebang: `#!/usr/bin/env bash`
- Always: `set -euo pipefail`
- Quote all variables: `"$VAR"`, never bare `$VAR`
- Conditionals: `[[ ... ]]`, not `[ ... ]`
- Validate after writing: `shellcheck claude/hooks/<name>.sh`

## Python Hooks

- Shebang: `#!/usr/bin/env python3`
- Target Python 3.14; use `uv run` to execute
- Type-hint all public functions
- No `subprocess.shell=True`; use `subprocess.run([...], check=True)` with a list
- Validate after writing: `uv run ruff check claude/hooks/<name>.py`

## JS Hooks

- Shebang: `#!/usr/bin/env node` or run via `bun`
- No `eval`; no string-built shell commands
- Validate after writing: `bunx @biomejs/biome check claude/hooks/<name>.js`

## All Hooks

- Read input from stdin as JSON; write output to stdout as JSON
- Non-zero exit blocks the Claude action; use intentionally
- Log to stderr, never stdout (stdout is the JSON response channel)
- Never hardcode tokens, keys, or user-specific paths
