---
description: Run all linters and formatters, report violations
subtask: true
---

Run linters for the scope in $ARGUMENTS (default: whole repo).

## Whole-repo checks

```
uv run ruff check .
uv run ruff format --check .
bunx @biomejs/biome check .
bun run tsc --noEmit
uv tool run "claudelint@0.3.3" --strict .
shellcheck claude/hooks/*.sh
```

## Targeted checks (when $ARGUMENTS specifies a path or language)

- Python file/dir: `uv run ruff check $ARGUMENTS && uv run ruff format --check $ARGUMENTS`
- JS/TS file/dir: `bunx @biomejs/biome check $ARGUMENTS`
- Shell scripts: `shellcheck $ARGUMENTS`
- Agent/skill docs: `uv tool run "claudelint@0.3.3" --strict $ARGUMENTS`

Report each violation with file:line and the rule ID. Do not auto-fix unless explicitly asked.
For `ruff` violations use `uv run ruff check --fix` only when instructed.
For `biome` violations use `bunx @biomejs/biome check --write` only when instructed.

## Staged diff for context

!`git diff --cached --stat 2>/dev/null | head -20`
