---
name: add-kilo-tool
description: Checklist for adding or renaming a tool in kilo-tools so registration and tests stay in step.
disable-model-invocation: true
argument-hint: "[tool-name-and-purpose]"
allowed-tools: Read Grep Glob Edit Bash
---

# Add a kilo-tools tool

## Usage

Tool to add: $ARGUMENTS (name and what it does).

1. **Implementation**: `kilo-tools/tools/<name>.ts` (or `plugins/` for a hook plus tool). Export the `tool({...})` and register it in `CustomToolsPlugin` in `kilo-tools/index.ts`, or return it from a plugin's `tool` map. `compose` throws if two plugins define the same tool name.
2. **Output size**: nothing compacts tool output, so a tool with large output must bound itself (see `sg`'s match and byte caps).
3. **Descriptions**: keep the tool description to one line; it is paid for on every turn.
4. **Paths**: resolve relative paths against `context.directory || context.worktree`, never `process.cwd()`. Spawned processes get `cwd` set explicitly.
5. **Tests**: add `<name>.test.ts` next to the tool.
6. **Both hosts**: the tool is registered for v1 (`server`) and v2 (`setup`) from the same `behaviour`; update the tool-name list in `v2.test.ts` ("registers tools with JSON Schema input") and check it passes.
7. Run the `kilo-tools-verify` skill.
