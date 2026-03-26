---
description: Validate TypeScript types and plugin structure
subtask: true
---

This repo has no compiled build output, but "build" means type-checking and structural validation.

Run these in order for $ARGUMENTS (default: whole repo):

1. TypeScript type check: `bun run tsc --noEmit`
2. Plugin validator (if plugins/ changed): `node plugins/plugin-validator/test.js`
3. claudelint structural check: `uv tool run "claudelint@0.3.3" --strict .`

Report all errors with file path, line number, and error message.
Do not suggest workarounds that suppress type errors (e.g., `as any`, `// @ts-ignore`).

## Changed files

!`git diff --name-only HEAD 2>/dev/null | head -30`
