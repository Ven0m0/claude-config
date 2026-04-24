# OpenCode Base Rules

This is the canonical base instruction file for OpenCode in this repo.
OpenCode reads this directly; do not inherit from the root `AGENTS.md`.

## Scope

- `opencode/` is the source-of-truth tree for agents, commands, skills, tools, docs, and prompts
- `.opencode/` is a runtime compatibility layer that symlinks back into `opencode/`

## Source of Truth

| Artifact              | Path                                                                            |
| --------------------- | ------------------------------------------------------------------------------- |
| Shared project config | `opencode/opencode.json`                                                        |
| Runtime overlay       | `.opencode/opencode.json`                                                       |
| Custom assets         | `opencode/agents/`, `opencode/command/`, `opencode/skill/`, `opencode/plugins/` |

> Config sync: `opencode/opencode.json` → `.opencode/opencode.json`

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

- Remove aliases, thin wrappers, and stale prompts that no longer map to configured agents
- Keep Flow Next assets only where they add unique value over the local command layer
- When moving assets from `.opencode/`, consolidate into `opencode/` and keep `.opencode/` as a thin compatibility path

## Validation

- After config edits: `python -m json.tool opencode/opencode.json >/dev/null`
- After overlay sync: `python -m json.tool .opencode/opencode.json >/dev/null`
- After skill or agent changes: grep for stale references before committing

## External File Loading

Load `@file` references with the Read tool only when relevant to the current task. Do not preload all references. Follow recursively when needed.
