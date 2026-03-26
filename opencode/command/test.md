---
description: Run the relevant test suite and report failures
subtask: true
---

Run tests for the scope given in $ARGUMENTS.

If no argument: run the full suite.
If argument is "conserve": `uv run pytest plugins/conserve/tests/ -v`
If argument is "prompt-improver": `uv run pytest plugins/prompt-improver/tests/ -v`
If argument is "dependency-blocker": `make -C plugins/dependency-blocker test`
If argument is a file path: run that path directly with pytest or bats depending on extension.
If argument is a pattern: `uv run pytest plugins/conserve/tests/ -k "$ARGUMENTS" -v`

Always show full failure output. After failures, suggest the narrowest fix — do not refactor unrelated code.

## Current working directory file tree (depth 2)

!`fd -d 2 -t f . plugins/ 2>/dev/null | head -40`
