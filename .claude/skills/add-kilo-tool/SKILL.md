---
name: add-kilo-tool
description: Checklist for adding or renaming a tool in kilo-tools so registration, compaction rules, healer rules and tests stay in step.
disable-model-invocation: true
argument-hint: "[tool-name-and-purpose]"
allowed-tools: Read Grep Glob Edit Bash
---

# Add a kilo-tools tool

## Usage

Tool to add: $ARGUMENTS (name and what it does).

1. **Name**: add it to the `TOOL` object in `kilo-tools/tool-names.ts`. Registration and the skip list both read it, so a rename cannot leave them stale. Use `[TOOL.name]` as the key where the tool is registered.
2. **Implementation**: `kilo-tools/tools/<name>.ts` (or `plugins/` for a hook plus tool). Export the `tool({...})` and register it in `CustomToolsPlugin` in `kilo-tools/index.ts`, or return it from a plugin's `tool` map. `compose` throws if two plugins define the same tool name.
3. **Compaction**: every name in `TOOL` is exempt from output compaction (`SKIP_COMPACTION_FOR`). That is right for hash-annotated or short output. A tool with large output must bound itself (see `hl_grep`'s 300-match cap and `gitingest`'s byte cap), because nothing else will.
4. **JSON healing**: if the tool prints file contents or command output verbatim, add it to `VERBATIM_OUTPUT` in `tool-names.ts` so the healer never rewrites it.
5. **Paths**: resolve relative paths against `context.directory || context.worktree`, never `process.cwd()`. Spawned processes get `cwd` set explicitly.
6. **Tests**: add `<name>.test.ts` next to the tool. The `v2.test.ts` test "every registered tool is either exempt from compaction..." fails if step 1 is skipped.
7. **Both hosts**: the tool is registered for v1 (`server`) and v2 (`setup`) from the same `behaviour`; check `v2.test.ts` still passes.
8. Run the `kilo-tools-verify` skill.
