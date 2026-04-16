---
name: plugin-conventions
description: Structural rules and conventions for authoring installable plugins in the claude-config marketplace. Use when creating or modifying anything under plugins/.
---

# Plugin Conventions

Each plugin lives under `plugins/<name>/` and must contain:

- `README.md` — purpose, slash commands exposed, install instructions
- `PLUGIN.md` or `plugin.json` — machine-readable manifest
- `tests/` — at least one test file appropriate to the plugin's language

## Directory Rules

- Python-heavy plugins: `pyproject.toml` at plugin root, tests run via `uv run pytest plugins/<name>/tests/`
- Shell-heavy plugins: tests use bats (`*.bats`), run via `bats plugins/<name>/tests/`
- JS plugins: test file at `test.js`, run via `node plugins/<name>/test.js`
- Multi-language: Makefile with `test` and `lint` targets; run via `make -C plugins/<name> test`

## Manifest Fields

Required in plugin manifest:

- `name` — matches directory name exactly
- `version` — semver
- `description` — one sentence, no trailing period
- `commands` — list of slash commands this plugin provides

## Naming

- Plugin directory: `kebab-case`
- Exposed slash commands: `/kebab-case`
- Python modules inside plugin: `snake_case.py`
- Hook scripts: `snake_case.{py,sh,js}`

## Validation

Run after any plugin change:

```
uv tool run "claudelint@0.3.3" --strict plugins/<name>/
node plugins/plugin-validator/test.js
```
