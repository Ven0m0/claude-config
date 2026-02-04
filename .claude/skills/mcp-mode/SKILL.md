---
name: mcp-mode
description: Progressive MCP integration for Claude Code. Discover tools incrementally, hydrate schemas on demand, and run procedural workflows that call MCP tools outside the LLM loop.
allowed-tools: Bash(*)
---

# MCP Mode

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
| Permissions | `bin/cm` must be executable (`chmod +x`) |
| MCP Config | Valid `mcp.json` in `~/.claude/` or `<project>/.claude/` |

## Commands

**IMPORTANT**: The `cm` script must be called with full path. **Try workspace first**:

1. **Workspace** (try first): `./.claude/skills/mcp-mode/bin/cm`
2. **Personal** (fallback): `~/.claude/skills/mcp-mode/bin/cm`

If workspace path fails with "not found", use personal path.

| Level | Command | Purpose |
|-------|---------|---------|
| 1 | `cm servers` | Discover available MCP servers |
| 2 | `cm index --server X` | List tools (name, description, required params) |
| 3 | `cm hydrate tool --server X` | Get full schema + TypeScript types |
| **4** | **`cm call tool --server X`** | **Execute tool directly (primary)** |
| 5 | `cm run --workflow file.js --server X` | Multi-tool workflow (advanced) |

All commands accept `--server <name>`. If only one server exists, it's auto-selected.

**Use `cm call` for single tool calls. Use `cm run` only for multi-tool workflows.**

## Key Insight

MCP Mode uses **separate config files** (`~/.claude/mcp.json`) from Claude Code's native configs (`~/.claude.json`, `.mcp.json`). This is critical:

- Servers in Claude Code's configs are **auto-injected** into context at startup (consuming tokens)
- Servers in MCP Mode's configs are **invisible** to Claude Code (no injection)
- `cm` connects to them on-demand via CLI

This is the **entire point** of MCP Mode: access MCP servers without context bloat.

## Idempotency

All mcp-mode commands are safe to rerun:
- `cm servers` / `cm index`: read-only discovery
- `cm hydrate`: overwrites previous hydration (timestamped)
- `cm run`: each run creates a new timestamped trace

No cleanup required between invocations.

## Tool Execution

**Primary: Direct Call (`cm call`)**

For single tool calls (most common use case):

```bash
# Hydrate once (caches schema)
cm hydrate list_collections --server context-repo

# Call directly - no workflow file needed
cm call list_collections --server context-repo
cm call list_collections --server context-repo --args '{"limit": 5}'
```

Results returned directly as JSON. This is the **preferred method** for interactive use.

**Advanced: Workflows (`cm run`)**

For multi-tool orchestration with loops, conditionals, or pre-programmed patterns:

```bash
cm run --server context-repo --tools a,b,c --workflow script.js
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
./.claude/skills/mcp-mode/bin/cm run --server contextrepo --tools search_documents --workflow workflow.js

# Personal skill
~/.claude/skills/mcp-mode/bin/cm run --server contextrepo --tools search_documents --workflow workflow.js
```

## Verification

After using mcp-mode, verify (using full path to `cm` for your installation):

```bash
# Workspace skill
./.claude/skills/mcp-mode/bin/cm doctor --server X

# Personal skill
~/.claude/skills/mcp-mode/bin/cm doctor --server X
```

- [ ] `cm doctor --server X` passes (connection works)
- [ ] Artifacts exist in `.claude/mcp-mode/` (cache, hydrated, runs)
- [ ] Workflow trace shows no errors (`runs/<server>/<ts>/run.json`)

## Proof Artifacts

After completing a workflow, produce evidence:

- **Discovery proof**: Screenshot or paste of `cm index --server X` output
- **Hydration proof**: Confirm `types.d.ts` exists and compiles (`tsc --noEmit`)
- **Execution proof**: Link to `run.json` trace showing `error: false`
- **For PRs**: Include trace file or summary in PR description

## Success Criteria

The skill completes successfully when these artifacts exist:

| Artifact | Path | Content |
|----------|------|---------|
| Tool cache | `.claude/mcp-mode/cache/<server>/tools.json` | Array of tool objects |
| Hydrated schemas | `.claude/mcp-mode/hydrated/<server>/<ts>/schemas.json` | Full JSON schemas |
| TypeScript types | `.claude/mcp-mode/hydrated/<server>/<ts>/types.d.ts` | Generated type definitions |
| Execution trace | `.claude/mcp-mode/runs/<server>/<ts>/run.json` | `{ error: false, result: ... }` |

Verify with the appropriate full path for your installation:
- Workspace: `./.claude/skills/mcp-mode/bin/cm doctor --server X`
- Personal: `~/.claude/skills/mcp-mode/bin/cm doctor --server X`

Command should exit 0.

## Fallbacks

| Issue | Resolution |
|-------|------------|
| Node.js version error | Upgrade to Node.js >= 18.0.0 |
| Permission denied on cm | Run `chmod +x bin/cm` in skill directory |
| Server not found | Run `cm servers` to list available servers |
| Connection timeout | Check `mcp.json` config, run `cm doctor` |
| Tool not found | Run `cm index --server X` to refresh cache |
| Workflow sandbox error | Check for disallowed `require`/`import`/`fetch` |

## Never Do

- Don't hardcode credentials in workflows (use `mcp.json` env)
- Don't skip `--server` flag when multiple servers exist
- Don't use `fetch`/`require`/`import` in workflow files (sandbox blocks them)

## Artifacts

All outputs written to `.claude/mcp-mode/`:

- `cache/<server>/tools.json`: tool inventory
- `hydrated/<server>/<ts>/`: schemas + types
- `runs/<server>/<ts>/run.json`: execution trace

All JSON artifacts are machine-parseable for downstream skill chaining. Workflows can read `tools.json` or `run.json` to inform subsequent steps.

## Supporting Files

- `bin/cm`: CLI entry point
- `lib/`: implementation modules
- `examples/workflows/`: sample workflow files
- `examples/hooks/`: PreToolUse hook examples
- `README.md`: full documentation

## Quick Reference

**Find cm**: Always at `./.claude/skills/mcp-mode/bin/cm` (workspace) or `~/.claude/skills/mcp-mode/bin/cm` (personal)

**Minimal workflow** (using workspace path):
```bash
# 1. Discover tools (snake_case names)
./.claude/skills/mcp-mode/bin/cm index --server X

# 2. Hydrate (use snake_case)
./.claude/skills/mcp-mode/bin/cm hydrate tool_name --server X

# 3. Execute (use camelCase in workflow)
echo 'workflow = async () => await t.toolName({})' > /tmp/wf.js
./.claude/skills/mcp-mode/bin/cm run --server X --tools tool_name --workflow /tmp/wf.js
```

For personal skill, replace `./.claude/` with `~/.claude/`.

**Common mistake**: Using `t.tool_name()` instead of `t.toolName()` in workflows.

## References

For project-specific conventions, see:
- `AGENTS.md`: project-wide agent guidance (if present)
- `~/.claude/mcp.json` or `.claude/mcp.json`: MCP server configuration
- `.claude/skills/*/SKILL.md`: related skills that may chain with MCP Mode

For mcp-mode internals:
- `README.md`: full CLI documentation
- `examples/`: sample workflows and hooks
