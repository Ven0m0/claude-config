# Architecture Rules

## Module Boundaries

```
claude/agents/     — agent .md definitions only; no code
claude/skills/     — skill SKILL.md files only; no code
claude/hooks/      — executable hook scripts (Python, shell, JS)
plugins/<name>/    — self-contained plugin; must not import from other plugins
opencode/command/  — opencode slash command templates (.md)
opencode/skill/    — opencode skill definitions (SKILL.md)
kilocode/rules/    — kilocode rule files (.md)
kilocode/skills/   — kilocode skill definitions (SKILL.md)
cursor/rules/      — Cursor rule files (.md or .mdc)
```

## Placement Rules

- New hook scripts go in `claude/hooks/` — not in plugin directories unless plugin-specific
- Agent definitions always in `claude/agents/hyphenated-name.md`
- Skills always in `claude/skills/hyphenated-dir/SKILL.md`
- Plugin-specific tests stay inside `plugins/<name>/tests/` — never in repo root
- Config files (`.editorconfig`, `biome.json`, `pyproject.toml`) stay at repo root

## Import Rules

- Python hooks must not import from plugin packages (they run standalone)
- Plugin Python code uses absolute imports from the plugin's own package
- Standard library first, third-party second, local last — enforced by Ruff `isort`

## What NOT to Touch

- `bun.lock`, `uv.lock` — do not edit manually; regenerate with `bun install` / `uv sync`
- `cursor/rules/` — preserve existing Cursor rules; only add, never delete
- `.github/copilot-instructions.md` — Copilot guidance; preserve and extend, never rewrite
- `CLAUDE.md` / `AGENTS.md` / `GEMINI.md` — symlinked; edit only `AGENTS.md`, others update automatically

## New File Checklist

Before adding any file ask: does an existing file already serve this purpose?
If creating a new plugin: does it have a `README.md`, a manifest, and at least one test?
