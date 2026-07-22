# OpenCode Base Rules

This is the canonical base instruction file for OpenCode in this repo.
OpenCode reads this directly; do not inherit from the root `AGENTS.md`.

## Scope

- `opencode/` holds the tracked OpenCode config: `opencode.json`, `tui.json`, and this file
- Reusable plugins, tools, skills, and rules live in `kilo-tools/`, not here

## Source of Truth

| Artifact              | Path                     |
| ---------------------- | ------------------------ |
| Shared project config | `opencode/opencode.json` |
| TUI keybinds/theme    | `opencode/tui.json`      |
| Reusable plugins/tools | `kilo-tools/`             |

## Working Style

- Prefer minimal diffs and deletion over new abstraction
- Dedupe aggressively — if `oh-my-opencode` or `flow-next-opencode` already covers a workflow, don't duplicate it locally
- Preserve user changes outside the current task surface
- One command per real workflow, one agent per distinct role

## Preferred Tools

- Search: `rg` (ripgrep), never `grep`
- File discovery: `fd`, never `find`
- JSON: `jq -c` for compact output
- JS/TS: `bun` / `bunx`, never `npm`
- Python: `uv`, never `pip`

## Commands, Agents, and Skills

- Agents and models are configured directly in `opencode.json` (`agent.*`); there is no local `agents/`/`command/`/`skill/` layer
- Keep Flow Next assets only where they add unique value over installed plugins

## Validation

- After config edits: `python -m json.tool opencode/opencode.json >/dev/null`
- After skill or agent changes: grep for stale references before committing

## External File Loading

Load `@file` references with the Read tool only when relevant to the current task. Do not preload all references. Follow recursively when needed.
