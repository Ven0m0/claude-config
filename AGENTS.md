# Agent Guide

> Canonical repo-wide instructions for coding agents.
> Keep `CLAUDE.md` and `GEMINI.md` as symlinks to this file.

## Repository Scope

This repository maintains agent configuration, skills, hooks, and plugins for Claude Code, Copilot, Cursor, Gemini, and related tooling.

Primary areas:

- `claude/agents/` - agent definitions
- `claude/skills/` - reusable skills and supporting files
- `claude/hooks/` - Python, shell, and JS hook scripts
- `.github/skills/` - GitHub Copilot skills
- `.github/copilot-instructions.md` - Copilot-specific companion guide

## Instruction Priority

1. Direct user, system, and developer instructions
2. Directory-local guidance that applies to the file being changed
3. This file
4. Tool-specific companion docs such as `.github/copilot-instructions.md`

## Working Rules

- Make the smallest change that fully solves the task.
- Edit existing files instead of creating new ones unless a new file is required.
- Preserve unrelated user changes and avoid whitespace-only churn.
- Read the relevant files before editing and verify behavior from the codebase.
- Keep guidance and docs short, concrete, and repository-specific.
- Prefer subtraction over addition. Do not add shims, compatibility layers, or feature flags unless requested.
- No emojis in code, comments, commit messages, or docs.
- When updating shared AI guidance, keep `AGENTS.md` and `.github/copilot-instructions.md` aligned.
- Use `rg` for discovery and search, including `rg --files` when you need to locate files.

## Preferred Tooling

- Python: `uv`, `ruff`, `pytest`
- JavaScript/TypeScript: `bun`, `bunx`, `biome`
- Shell: `shellcheck`
- Agent docs: `claudelint`
- File discovery: `rg --files`
- Structured search: `rg` before broader filesystem scans

Prefer repository scripts when they exist, such as `bun run lint:claude`.

## Source Of Truth For Style

Check these files before making style-sensitive changes:

- `.editorconfig`
- `pyproject.toml`
- `biome.json`
- `tsconfig.json`
- plugin-local config files when working inside a plugin

## Repository Conventions

### General

- Keep files focused and easy to review.
- Use descriptive names instead of abbreviations.
- Comments should explain why, not restate what the code already says.
- Validate inputs at boundaries and fail with actionable errors.
- Never hardcode credentials or introduce secret material.
- Avoid `eval`, string-built shell commands, and other unnecessary dynamic execution.

### Python

- Root tooling targets Python `>=3.14`.
- Follow Ruff defaults from `pyproject.toml`: 4-space indentation, line length 88, double quotes.
- Add type hints to changed public functions and non-trivial helpers.
- Prefer absolute imports when the package layout supports them.

### JavaScript / TypeScript

- Use Bun-oriented commands.
- Follow Biome defaults from `biome.json`: 2-space indentation, line width 120, single quotes.
- Keep TypeScript compatible with root `tsconfig.json` strictness, including `noUncheckedIndexedAccess` and `noFallthroughCasesInSwitch`.

### Shell

- Use `#!/usr/bin/env bash` and `set -euo pipefail` in Bash scripts.
- Quote variables and prefer `[[ ... ]]` over `[ ... ]`.
- Validate changed shell files with `shellcheck`.

### Markdown And Agent Docs

- Keep files UTF-8 with LF endings and a final newline.
- Markdown files do not have a fixed line-length limit in `.editorconfig`; wrap only when it improves readability.
- Agent docs should stay direct, operational, and easy to scan.
- Agent file naming uses `hyphenated-name.md`.
- Skill layout uses `claude/skills/<skill-name>/SKILL.md`.

## Agent And Skill Authoring

### Agents

Use YAML frontmatter with the required fields used throughout `claude/agents/`:

```yaml
---
name: agent-name
description: One-line description for agent selection
model: sonnet
---
```

Claude Code agents also accept `allowed-tools` to restrict the tool set.

### Skills

Use this layout unless the task requires otherwise:

```
<skill-name>/
├── SKILL.md
└── examples.md        # optional
```

## Validation

Run the narrowest checks that cover the files you changed.

### Shared Instruction Files

```bash
bun run lint:claude
```

### Python

```bash
uv run ruff check <paths>
uv run ruff format --check <paths>
uv run pytest <target>
```

### JavaScript / TypeScript

```bash
bun run lint:biome
bun run lint:biome:fix
bunx tsc --noEmit
```

### Shell

```bash
shellcheck <path-to-script>
```

### Common Targeted Test Commands

```bash
uv run pytest <plugin-dir>/tests/
```

## AI Config Maintenance

- `AGENTS.md` is the canonical shared guide.
- `CLAUDE.md` and `GEMINI.md` must remain symlinks to `AGENTS.md`.
- `.github/copilot-instructions.md` should be a shorter Copilot-focused companion, not a conflicting second source of truth.
- If the symlink needs repair, recreate it as `ln -sfn AGENTS.md CLAUDE.md` from the repo root.

## Commit Style

- Use `type(scope): description`.
- Common types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
- Keep the subject under 72 characters.
- Use the body for motivation when extra context is useful.
