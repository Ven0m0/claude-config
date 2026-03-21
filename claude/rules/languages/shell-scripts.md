---
paths:
  - "scripts/**/*.sh"
---

# Shell Script Rules

Scripts in this project follow strict conventions for Claude Code hook compatibility.

## Required Structure
1. `#!/bin/bash` shebang + `set -euo pipefail`
2. `trap cleanup EXIT` with at minimum `:` placeholder
3. Use `${CLAUDE_PROJECT_DIR:-$(pwd)}` for project root
4. Parse stdin JSON with jq first, grep/sed fallback for jq-less environments
5. Exit 0 on success; exit 2 for Stop/TaskCompleted/ConfigChange/TeammateIdle hooks (blocks action)

## I/O Safety
- Use `printf '%s\n' "$VAR"` instead of `echo "$VAR"` when piping external data
- Sanitize all external input: `head -1 | tr -d '\n\r'` for single-line values
- Truncate long values: `cut -c1-500` for messages, `cut -c1-100` for identifiers

## Shellcheck
- `# shellcheck disable=SCXXXX` for intentional suppressions only
- All scripts must pass `shellcheck scripts/*.sh` with zero warnings
