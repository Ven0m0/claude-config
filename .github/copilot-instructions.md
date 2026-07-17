# GitHub Copilot Instructions

Treat `AGENTS.md` as the canonical repo-wide guide. This file is the shorter Copilot-specific companion.

## Repository Focus

This repository maintains shared configuration, skills, hooks, and plugins for Claude Code, Copilot, Cursor, Gemini, and related agent tooling.

Main areas:

- `claude/agents/`
- `claude/skills/`
- `claude/hooks/`
- `.github/skills/`
- `AGENTS.md`

## Working Rules

- Follow user instructions first.
- Make minimal, reviewable diffs.
- Edit existing files instead of creating new ones unless the task requires a new file.
- Preserve unrelated user changes.
- Read the relevant files before editing and verify claims against the repository.
- Keep outputs blunt, precise, and free of emojis.
- Use `rg` for repository discovery and search. Prefer `rg --files` when locating files.
- Keep this file aligned with `AGENTS.md`.

## Repository Conventions

### General

- Prefer subtraction over addition.
- Match existing patterns before introducing new structure.
- Avoid whitespace-only churn.
- Use comments sparingly and only when they add intent.
- Never hardcode credentials or secrets.

### Python

- Use `uv` for commands.
- Root Python target is 3.14+.
- Follow Ruff defaults from `pyproject.toml`: line length 88, 4-space indentation, double quotes.
- Add type hints to changed public APIs and non-trivial helpers.

### JavaScript / TypeScript

- Use Bun-oriented commands.
- Follow Biome defaults from `biome.json`: line width 120, 2-space indentation, single quotes.
- Keep TypeScript strict and compatible with `noUncheckedIndexedAccess` and `noFallthroughCasesInSwitch`.

### Shell

- Use Bash with `#!/usr/bin/env bash` and `set -euo pipefail`.
- Quote variables and prefer `[[ ... ]]`.
- Run `shellcheck` on changed shell scripts.

### Markdown And Agent Docs

- Use UTF-8, LF, and a final newline.
- Markdown line length is intentionally flexible; wrap only when it helps readability.
- Agent docs should stay concrete, short, and operational.

## Validation

Run the narrowest relevant checks for touched files.

```bash
bun run lint:claude
uv run ruff check <paths>
uv run ruff format --check <paths>
bun run lint:biome
bunx tsc --noEmit
shellcheck <path-to-script>
uv run pytest <target>
```

## AI Config Files

- `AGENTS.md` is the shared source of truth.
- `CLAUDE.md` must remain a symlink to `AGENTS.md`.
- `GEMINI.md` must remain a symlink to `AGENTS.md`.
- Do not let this file drift into conflicting guidance.

## Commit Style

Use `type(scope): description` with a subject under 72 characters.
