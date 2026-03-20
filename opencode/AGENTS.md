# OpenCode Base Rules

This is the canonical base instruction file for OpenCode in this repo.
OpenCode should read this file directly instead of inheriting the root `AGENTS.md`.

## Scope

- Applies to all content under `opencode/` and the linked runtime content under `.opencode/`
- Treat `opencode/` as the source-of-truth tree for custom OpenCode agents, commands, skills, tools, docs, and prompts
- Treat `.opencode/` as a runtime-facing compatibility layer that may symlink back into `opencode/`

## Working Style

- Prefer minimal diffs and deletion over new abstraction
- Dedupe aggressively when plugin-provided workflows already cover the same use case
- Keep local OpenCode prompts lean; avoid duplicating behavior from `oh-my-opencode` and `flow-next-opencode`
- Preserve user changes outside the current task surface
- Read the relevant file before editing it

## Source Of Truth

- Base instructions: `opencode/AGENTS.md`
- Main OpenCode config template: `opencode/opencode.jsonc`
- Synced JSON snapshot: `opencode/opencode.json`
- Runtime compatibility overlay: `.opencode/opencode.json`
- Custom OpenCode assets should live in `opencode/agents/`, `opencode/command/`, `opencode/skill/`, and `opencode/plugin/`

## Commands, Agents, And Skills

- Prefer one command per real workflow
- Prefer one agent per distinct role
- Remove aliases, thin wrappers, and stale prompts that no longer map to configured agents
- Keep Flow Next assets only where they add unique value over the local command layer
- When moving runtime assets from `.opencode/`, consolidate them into `opencode/` and keep `.opencode/` as a thin compatibility path

## Validation

- Validate `opencode/opencode.jsonc` after config edits
- Validate `opencode/opencode.json` and `.opencode/opencode.json` after sync or overlay edits
- When changing Markdown-only prompts/docs, run the narrowest relevant checks and grep for stale references

## External File Loading

When you encounter a file reference such as `@rules/general.md`, load it with the Read tool only when it is relevant to the current task.

- Do not preemptively load all referenced files
- Treat loaded referenced content as mandatory for the task at hand
- Follow referenced files recursively when needed
