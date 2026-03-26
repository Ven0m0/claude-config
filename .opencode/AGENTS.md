# OpenCode Base Rules

## Working Style

- Prefer minimal diffs and deletion over new abstraction
- Dedupe aggressively when plugin-provided workflows already cover the same use case
- Preserve user changes outside the current task surface
- Read the relevant file before editing it

## External File Loading

When you encounter a file reference such as `@../AGENTS.md`, load it with the Read tool only when it is relevant to the current task.

- Do not preemptively load all referenced files
- Treat loaded referenced content as mandatory for the task at hand
- Follow referenced files recursively when needed
