---
model: haiku
name: maintenance
description: Run autofix maintenance commands to keep code clean and consistent.
allowed-tools: Bash
---

# Maintenance Skill

Run linter autofix and code quality maintenance before validation.

## Commands

Sequential autofix workflow:

```bash
claudelint check-all --fix >/dev/null 2>&1
ruff check --fix-only --unsafe-fixes . >/dev/null 2>&1
```

## When to Use

- Before committing code
- After completing a feature or bug fix
- During code review preparation
- As part of pre-validation workflow

## What Gets Fixed

| Tool | Fixes |
|------|-------|
| claudelint | General code quality, style consistency |
| ruff | Python import sorting, unused imports, common Python issues |

## Notes

- Both commands redirect output to `/dev/null` for quiet operation
- Commands run sequentially; claudelint first, then ruff
- Only applies safe fixes that do not change runtime behavior
