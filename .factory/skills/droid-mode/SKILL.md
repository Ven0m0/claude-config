---
name: droid-mode
description: Progressive Code-Mode MCP integration for Factory Droid. Discover tools incrementally, hydrate schemas on demand, and run procedural workflows that call MCP tools outside the LLM loop.
---

# Droid Mode

Access MCP tools **without loading them into context**. Progressive discovery → schema hydration → procedural execution.

## When to Use

- MCP servers with **many tools** (avoid context bloat)
- **Token efficiency** (don't dump schemas into prompts)
- **Procedural workflows** (filter/join/iterate between tool calls)
- **Auditability** (explicit scripts + saved artifacts)

## Requirements

| Requirement | Details |
|-------------|---------|
| Node.js | >= 18.0.0 |
| Permissions | `bin/dm` must be executable (`chmod +x`) |
| MCP Config | Valid `mcp.json` with at least one server |

## Commands

**IMPORTANT**: The `dm` script must be called with full path. **Try workspace first**:

1. **Workspace** (try first): `./.factory/skills/droid-mode/bin/dm`
2. **Personal** (fallback): `~/.factory/skills/droid-mode/bin/dm`

If workspace path fails with "not found", use personal path.

| Level | Command | Purpose |
|-------|---------|---------|
| 1 | `dm servers` | Discover available MCP servers |
| 2 | `dm index --server X` | List tools (name, description, required params) |
| 3 | `dm hydrate tool --server X` | Get full schema + TypeScript types |
| **4** | **`dm call tool --server X`** | **Execute tool directly (primary)** |
| 5 | `dm run --workflow file.js --server X` | Multi-tool workflow (advanced) |

All commands accept `--server <name>`. If only one server exists, it's auto-selected.

**Use `dm call` for single tool calls. Use `dm run` only for multi-tool workflows.**

## Key Insight

Servers with `disabled: true` in `mcp.json` are **fully available** to droid-mode:

- `disabled: true` = "don't inject tools into Droid's context"
- droid-mode connects directly, bypassing context injection
- Result: token-efficient, on-demand MCP access

This is the entire point of the skill.

## Idempotency

All droid-mode commands are safe to rerun:
- `dm servers` / `dm index`: read-only discovery
- `dm hydrate`: overwrites previous hydration (timestamped)
- `dm run`: each run creates a new timestamped trace

No cleanup required between invocations.

## Tool Execution

**Primary: Direct Call (`dm call`)**

For single tool calls (most common use case):

```bash
# Hydrate once (caches schema)
dm hydrate list_collections --server context-repo

# Call directly - no workflow file needed
dm call list_collections --server context-repo
dm call list_collections --server context-repo --args '{"limit": 5}'
```

Results returned directly as JSON. This is the **preferred method** for interactive use.

**Advanced: Workflows (`dm run`)**

For multi-tool orchestration with loops, conditionals, or pre-programmed patterns:

```bash
dm run --server context-repo --tools a,b,c --workflow script.js
```

| Input | Flag | Required | Example |
|-------|------|----------|---------|
| Workflow file | `--workflow` | Yes | `workflow.js` |
| Tool list | `--tools` | Yes | `search,query` |
| Server name | `--server` | If multiple servers | `contextrepo` |

Use workflows for complex automation, not everyday single-tool calls.

## Naming Convention

Tool names use **snake_case** in CLI flags but **camelCase** in workflow code:

| Context | Format | Example |
|---------|--------|---------|
| CLI `--tools` flag | snake_case | `--tools list_collections` |
| Workflow `t.` accessor | camelCase | `t.listCollections({})` |

**Conversion rule**: Remove underscores, capitalize each word after first.
- `list_collections` → `listCollections`
- `search_documents` → `searchDocuments`
- `get_file_content` → `getFileContent`

## Workflow Example

```js
// workflow.js
// Note: Tool name converts from snake_case to camelCase
// search_documents → t.searchDocuments()
workflow = async () => {
  const docs = await t.searchDocuments({ query: "PRD", limit: 5 })
  return docs.results.map(d => d.id)
}
```

```bash
# Workspace skill
./.factory/skills/droid-mode/bin/dm run --server contextrepo --tools search_documents --workflow workflow.js

# Personal skill
~/.factory/skills/droid-mode/bin/dm run --server contextrepo --tools search_documents --workflow workflow.js
```

## Verification

After using droid-mode, verify (using full path to `dm` for your installation):

```bash
# Workspace skill
./.factory/skills/droid-mode/bin/dm doctor --server X

# Personal skill
~/.factory/skills/droid-mode/bin/dm doctor --server X
```

- [ ] `dm doctor --server X` passes (connection works)
- [ ] Artifacts exist in `.factory/droid-mode/` (cache, hydrated, runs)
- [ ] Workflow trace shows no errors (`runs/<server>/<ts>/run.json`)

## Proof Artifacts

After completing a workflow, produce evidence:

- **Discovery proof**: Screenshot or paste of `dm index --server X` output
- **Hydration proof**: Confirm `types.d.ts` exists and compiles (`tsc --noEmit`)
- **Execution proof**: Link to `run.json` trace showing `error: false`
- **For PRs**: Include trace file or summary in PR description

## Success Criteria

The skill completes successfully when these artifacts exist:

| Artifact | Path | Content |
|----------|------|---------|
| Tool cache | `.factory/droid-mode/cache/<server>/tools.json` | Array of tool objects |
| Hydrated schemas | `.factory/droid-mode/hydrated/<server>/<ts>/schemas.json` | Full JSON schemas |
| TypeScript types | `.factory/droid-mode/hydrated/<server>/<ts>/types.d.ts` | Generated type definitions |
| Execution trace | `.factory/droid-mode/runs/<server>/<ts>/run.json` | `{ error: false, result: ... }` |

Verify with the appropriate full path for your installation:
- Workspace: `./.factory/skills/droid-mode/bin/dm doctor --server X`
- Personal: `~/.factory/skills/droid-mode/bin/dm doctor --server X`

Command should exit 0.

## Fallbacks

| Issue | Resolution |
|-------|------------|
| Node.js version error | Upgrade to Node.js >= 18.0.0 |
| Permission denied on dm | Run `chmod +x bin/dm` in skill directory |
| Server not found | Run `dm servers` to list available servers |
| Connection timeout | Check `mcp.json` config, run `dm doctor` |
| Tool not found | Run `dm index --server X` to refresh cache |
| Workflow sandbox error | Check for disallowed `require`/`import`/`fetch` |

## Never Do

- Don't hardcode credentials in workflows (use `mcp.json` env)
- Don't skip `--server` flag when multiple servers exist
- Don't use `fetch`/`require`/`import` in workflow files (sandbox blocks them)

## Artifacts

All outputs written to `.factory/droid-mode/`:

- `cache/<server>/tools.json`: tool inventory
- `hydrated/<server>/<ts>/`: schemas + types
- `runs/<server>/<ts>/run.json`: execution trace

All JSON artifacts are machine-parseable for downstream skill chaining. Workflows can read `tools.json` or `run.json` to inform subsequent steps.

## Supporting Files

- `bin/dm`: CLI entry point
- `lib/`: implementation modules
- `examples/workflows/`: sample workflow files
- `examples/hooks/`: PreToolUse hook examples
- `README.md`: full documentation

## Quick Reference

**Find dm**: Always at `./.factory/skills/droid-mode/bin/dm` (workspace) or `~/.factory/skills/droid-mode/bin/dm` (personal)

**Minimal workflow** (using workspace path):
```bash
# 1. Discover tools (snake_case names)
./.factory/skills/droid-mode/bin/dm index --server X

# 2. Hydrate (use snake_case)
./.factory/skills/droid-mode/bin/dm hydrate tool_name --server X

# 3. Execute (use camelCase in workflow)
echo 'workflow = async () => await t.toolName({})' > /tmp/wf.js
./.factory/skills/droid-mode/bin/dm run --server X --tools tool_name --workflow /tmp/wf.js
```

For personal skill, replace `./.factory/` with `~/.factory/`.

**Common mistake**: Using `t.tool_name()` instead of `t.toolName()` in workflows.

## References

For project-specific conventions, see:
- `AGENTS.md`: project-wide agent guidance (if present)
- `mcp.json`: MCP server configuration
- `.factory/skills/*/SKILL.md`: related skills that may chain with droid-mode

For droid-mode internals:
- `README.md`: full CLI documentation
- `examples/`: sample workflows and hooks
