# OpenCode Base Rules

## Working Style

- Prefer minimal diffs and deletion over new abstraction
- Dedupe aggressively when plugin-provided workflows already cover the same use case
- Keep local OpenCode prompts lean; avoid duplicating behavior from `oh-my-opencode` and `flow-next-opencode`
- Preserve user changes outside the current task surface
- Read the relevant file before editing it

## Commands, Agents, And Skills

- Prefer one command per real workflow
- Prefer one agent per distinct role
- Remove aliases, thin wrappers, and stale prompts that no longer map to configured agents
- Keep Flow Next assets only where they add unique value over the local command layer

## External File Loading

When you encounter a file reference such as `@rules/general.md`, load it with the Read tool only when it is relevant to the current task.

- Do not preemptively load all referenced files
- Treat loaded referenced content as mandatory for the task at hand
- Follow referenced files recursively when needed
