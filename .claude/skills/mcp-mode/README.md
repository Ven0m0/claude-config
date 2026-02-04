# MCP Mode

Progressive MCP integration for Claude Code. Access MCP tools without loading them into context.

---

> **The Problem:** MCP tool schemas are loaded into Claude Code's context window at session startup, consuming 30-50%+ of available tokens BEFORE any conversation begins. Real-world reports show 66,000+ tokens consumed at startup (33% of 200k context).
>
> **The Solution:** MCP Mode bypasses this entirely by using separate config files (`~/.claude/mcp.json`) that Claude Code doesn't see. Servers are connected on-demand via CLI, schemas loaded only when needed, and tool calls executed outside the context window.
>
> **Result:** Near-zero startup token cost, full context available for actual work.

---

## Installation

### Option A - Personal skill (recommended)

Copy this directory to `~/.claude/skills/mcp-mode/`

```bash
~/.claude/skills/mcp-mode/bin/cm --help
```

### Option B - Project skill (for teams)

Copy to `<repo>/.claude/skills/mcp-mode/`

```bash
./.claude/skills/mcp-mode/bin/cm --help
```

### Option C - npm (global install)

```bash
npm install -g mcp-mode
cm --help
```

---

## MCP Server Configuration

**CRITICAL:** MCP Mode uses **SEPARATE** config files from Claude Code's native configs to avoid context injection.

| Config | Path | Purpose |
|--------|------|---------|
| User config | `~/.claude/mcp.json` | Personal MCP servers for MCP Mode |
| Project config | `<project>/.claude/mcp.json` | Project-specific MCP servers |

**DO NOT** use Claude Code's native configs (`~/.claude.json`, `.mcp.json`) for servers you want to access via MCP Mode. Those servers will be auto-injected into context, defeating the purpose.

### Example Config

```json
{
  "mcpServers": {
    "context-repo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "context-repo-mcp"]
    },
    "my-api": {
      "type": "http",
      "url": "https://api.example.com/mcp",
      "headers": {
        "Authorization": "Bearer ${API_TOKEN}"
      }
    }
  }
}
```

### Migration from Claude Code

If you have servers in `~/.claude.json` or `.mcp.json` that you want to access via MCP Mode:

1. **Move** (don't copy) those server configs to `~/.claude/mcp.json`
2. Remove them from Claude Code's configs
3. This prevents duplicate schema injection

```bash
# Example: Create MCP Mode config directory
mkdir -p ~/.claude

# Move your server configs to the new location
# (manually edit the files to move mcpServers entries)
```

---

## Progressive Disclosure Model

| Level | Command | Purpose |
|-------|---------|---------|
| 1 | `cm servers` | Discover available MCP servers |
| 2 | `cm index --server X` | List tools on a server |
| 3 | `cm hydrate tool1 tool2 --server X` | Get full schemas |
| 4 | `cm call tool --server X` | Execute tool directly |
| 5 | `cm run --server X ...` | Execute workflow |

---

## Commands

### `cm servers` - List available MCP servers

```bash
cm servers
```

Shows all servers from `~/.claude/mcp.json` and `<project>/.claude/mcp.json`.

### `cm doctor` - Sanity check

```bash
cm doctor --server contextrepo
```

Checks: finds `mcp.json`, resolves server, attempts `initialize` + `tools/list`.

### `cm index` - List tools (compact)

```bash
cm index --server contextrepo
cm index --server contextrepo --json
```

Outputs a compact table (name + description + required params).

### `cm search` - Find tools by keyword

```bash
cm search "semantic search over docs" --limit 8 --server contextrepo
```

Searches the cached index.

### `cm hydrate` - Get full schemas

```bash
cm hydrate search_documents get_document --server contextrepo
```

Writes to `.claude/mcp-mode/hydrated/<server>/<timestamp>/`:
- `tools.json` - full tool definitions
- `types.d.ts` - TypeScript types
- `toolmap.json` - safe JS identifiers → tool names

### `cm call` - Execute tool directly

```bash
cm call list_collections --server contextrepo
cm call search_documents --server contextrepo --args '{"query": "hello", "limit": 5}'
```

This is the **primary method** for single tool calls. Uses daemon for faster execution.

### `cm run` - Execute workflow

```bash
cm run --server contextrepo --tools search_documents,get_document --workflow workflow.js
```

Example workflow:

```js
workflow = async () => {
  const docs = await t.searchDocuments({ query: "MCP Mode PRD", limit: 5 })
  const full = await Promise.all(docs.results.map(d => t.getDocument({ id: d.id })))
  return { count: full.length, ids: full.map(x => x.id) }
}
```

---

## Output & Audit Artifacts

All artifacts written to `.claude/mcp-mode/`:

| Path | Contents |
|------|----------|
| `cache/<server>/tools.json` | Cached tool inventory |
| `hydrated/<server>/<ts>/` | Schema bundles |
| `runs/<server>/<ts>/run.json` | Workflow result + trace |

---

## Daemon Mode (Performance)

The daemon maintains persistent MCP connections, reducing call latency by ~5x. Each project gets its own isolated daemon instance.

### Commands

```bash
cm daemon start          # Start daemon for current project
cm daemon stop           # Stop current project's daemon
cm daemon status         # Check current project's daemon
cm daemon status --all   # List ALL daemons across projects
cm daemon list           # Alias for status --all
cm daemon warm [server]  # Pre-warm connections
```

The daemon is optional - without it, everything works as before.

---

## Key Differences from Droid Mode

| Aspect | Droid Mode (Factory.ai) | MCP Mode (Claude Code) |
|--------|------------------------|--------------------------|
| User config | `~/.factory/mcp.json` | `~/.claude/mcp.json` |
| Project config | `.factory/mcp.json` | `.claude/mcp.json` |
| Data directory | `.factory/droid-mode/` | `.claude/mcp-mode/` |
| Daemon sockets | `~/.factory/run/` | `~/.cache/claude/run/` |
| CLI command | `dm` | `cm` |
| Env prefix | `DM_*` | `CM_*` |
| Skill location | `.factory/skills/droid-mode/` | `.claude/skills/mcp-mode/` |

---

## Security Posture

- Credentials remain in `mcp.json` env/headers, not in prompts
- Workflow sandbox blocks `require`, `import`, `process`, `fetch`
- Network access mediated through MCP server only
- Every tool call traced (name, args hash, duration, error flag)

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `CM_DEBUG` | Enable debug logging (set to "1") |
| `CM_DAEMON_IDLE_MS` | Daemon idle timeout (default 600000ms) |
| `CM_MCP_PROTOCOL_VERSION` | MCP protocol version override |
| `CM_SOCKET_PATH` | Custom daemon socket path |
| `CM_META_PATH` | Custom daemon metadata path |

---

## Design Philosophy

Treat MCP as infrastructure. Treat Skills as capability boundaries. Treat code as a reasoning amplifier - not as authority.
