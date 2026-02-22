# GitHub Copilot Instructions

**Repository:** Claude Code Plugin Marketplace and Configuration Repository
**Purpose:** Code generation guardrails and project context for GitHub Copilot
**Tone:** Blunt, precise. Result-first. No emojis.

---

## Project Context

This repo is a **plugin marketplace and configuration ecosystem** for Claude Code and other AI assistants. Primary artifacts:

- `claude/agents/` - 12 sub-agent definitions (Markdown with YAML frontmatter)
- `claude/skills/` - 32 skill modules (SKILL.md + supporting files)
- `claude/hooks/` - Auto-running hook scripts (Python, Shell, JS)
- `plugins/` - 13 installable plugin packages
- `AGENTS.md` - Primary AI config (symlinked as CLAUDE.md, GEMINI.md)

---

## Core Principles

1. User instructions override all rules
2. Edit existing files over creating new ones (minimal diff)
3. Subtraction over addition - less code is better
4. Align with existing patterns in the codebase
5. No emojis - never in code, comments, commits, or docs

---

## Toolchain

Always prefer modern tools over legacy equivalents:

| Use | Instead of |
|---|---|
| `fd` | `find` |
| `rg` (ripgrep) | `grep` |
| `eza` | `ls` |
| `sd` | `sed` |
| `aria2` | `curl` |
| `jaq` or `jq` | manual JSON parsing |
| `parallel` | `xargs` |
| `bun` | `npm` / `node` |
| `uv` | `pip` / `poetry` |
| `biome` | `eslint` / `prettier` |
| `ruff` | `flake8` / `black` |

---

## Language Standards

### Bash / Shell

```bash
#!/usr/bin/env bash
set -euo pipefail

# Quote all variables
echo "${var}"

# Use [[ ]] not [ ]
if [[ "${var}" == "value" ]]; then

# No eval, no backticks
result=$(command)
```

- Validate with `shellcheck`
- Format with `shfmt`
- All scripts must be executable (`chmod +x`)

### Python

- Version: 3.13+
- Package manager: `uv`
- Linter/formatter: `ruff`
- Indent: 4 spaces
- Line length: 120 chars max
- Naming: `snake_case` functions, `PascalCase` classes, `UPPER_SNAKE_CASE` constants

```bash
# Install deps
uv add package-name

# Run linter
ruff check --fix .

# Format
ruff format .
```

### TypeScript / JavaScript

- Runtime: Bun
- Formatter/linter: Biome
- Indent: 2 spaces
- Naming: `camelCase` functions, `PascalCase` classes
- Strict TypeScript enabled

```bash
# Format and lint
biome check --apply .

# Type check
bun run tsc --noEmit
```

### Markdown

- No trailing whitespace
- Validate with `markdownlint`
- Line endings: LF
- File naming: `kebab-case.md`

---

## File Naming

| Type | Convention | Example |
|---|---|---|
| Skills | `hyphenated-dir/SKILL.md` | `linter-autofix/SKILL.md` |
| Agents | `hyphenated-name.md` | `code-explorer.md` |
| Plugins | `hyphenated-dir/` | `coding-assistant/` |
| Python | `snake_case.py` | `post_edit_format.py` |
| Config/Docs | `kebab-case.md` | `claude-md-guide.md` |

---

## Code Generation Rules

### General

- Max file size: 800 lines (prefer 200-400)
- Validate inputs at system boundaries only
- No defensive code for impossible states
- No feature flags unless required
- No backwards-compatibility shims unless asked

### Engineering Principles

- **KISS** - Keep It Simple, Stupid
- **YAGNI** - You Ain't Gonna Need It
- **DRY** - Don't Repeat Yourself
- **Fail Fast** - Validate early, fail loudly

### Security

- No SQL string concatenation
- No `eval` in any language
- No hardcoded credentials
- Sanitize all external inputs
- Use `"${var}"` quoting in shell

---

## Commit Messages

Format: `type(scope): description` (max 72 chars subject)

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Body explains WHY, not WHAT. No emojis.

```
feat(skills): add vulture dead code detection skill

Enables automated detection of unused Python code using vulture,
reducing maintenance burden and improving code hygiene.
```

---

## Quality Gates

Before suggesting code is complete:

```bash
# Python
ruff check . && ruff format --check .

# JS/TS
biome check .

# Shell
shellcheck script.sh

# YAML
yamllint .github/workflows/*.yml

# Markdown
markdownlint '**/*.md' --ignore node_modules

# Agent/Skill docs
claudelint --check AGENTS.md
```

---

## Skill and Agent Authoring

### Agent frontmatter (required fields)

```yaml
---
name: agent-name
description: One-line description for sub-agent selection
allowed-tools: Read, Write, Edit, Bash, Grep, Glob
model: sonnet  # or opus, haiku
---
```

### Skill structure

```
claude/skills/skill-name/
├── SKILL.md          # Required: skill documentation
├── examples.md       # Optional: usage examples
└── references/       # Optional: reference material
```

---

## Performance

- Minimize process forks; prefer shell builtins
- Batch I/O operations
- Anchor regex patterns for speed
- Background I/O tasks; sync at explicit wait points
- Use `rg --fixed-strings` for literal string searches

---

## Example: File Search

**Task:** Find all Python files modified in last 7 days

```bash
fd -e py -t f --changed-within 7d
```

**Task:** Search for pattern in Python files

```bash
rg "pattern" --type py
```

**Task:** Structural code search

```bash
ast-grep --pattern 'def $FUNC($$$): $$$' --lang python
```
