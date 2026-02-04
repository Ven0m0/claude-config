# Droid Mode

Progressive Code-Mode MCP integration for Factory Droid. Access MCP tools without loading them into context.

---

> I spend most of my time in Factory.ai's Droid CLI, and I'm a big believer in MCP - it's the right abstraction for giving AI agents access to external tools. But I kept bumping into an interesting constraint. Every MCP server adds its tool schemas to the context window, which means adding servers costs tokens whether you use those tools or not. I wanted ten servers available; I didn't want to pay for ten servers in every prompt. This seemed like a solvable inefficiency, and I was curious enough to dig in.
>
> Droid Mode is what emerged: a Skill that provides daemon-backed MCP access with progressive disclosure. Built on 28 years of Linux system administration experience, it treats MCP servers as infrastructure - persistent connections, lazy schema loading, code-mode execution outside the context window. The result is zero token overhead and 13% better latency than native MCP. Per-project daemon isolation handles governance, and everything is traced for accountability. It's experimental research software, but I've tested it thoroughly and use it daily. I'm sharing it as an early AI explorer who believes we're just scratching the surface of what performant agent architectures can look like.
>
> \- [GitMaxd](https://github.com/Gitmaxd)

---

## Installation

### Option A - Project skill (recommended for teams)

Copy this directory to `<repo>/.factory/skills/droid-mode/`

```bash
./.factory/skills/droid-mode/bin/dm --help
```

### Option B - User skill (personal)

Copy to `~/.factory/skills/droid-mode/`

```bash
~/.factory/skills/droid-mode/bin/dm --help
```

### Option C - npx (scaffolding)

```bash
npx droid-mode init
```

---

## MCP Server Configuration

This skill connects to MCP servers configured in:

- Project: `.factory/mcp.json`
- User: `~/.factory/mcp.json` (overrides project)

### Recommended Setup

Keep MCP servers `disabled: true` so they don't bloat Droid's context:

```json
{
  "mcpServers": {
    "context-repo": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "context-repo-mcp"],
      "disabled": true
    }
  }
}
```

This is the **entire point** of droid-mode: access MCP servers without context bloat.

### CLI Overrides

For CI or quick experiments:

- `--http-url <url>` with optional `--headers-json '{"Authorization":"Bearer ..."}'`
- `--stdio-command <cmd>` with optional `--stdio-args "a,b,c"` and `--env-json '{"KEY":"VALUE"}'`

---

## Progressive Disclosure Model

| Level | Command | Purpose |
|-------|---------|---------|
| 1 | `dm servers` | Discover available MCP servers |
| 2 | `dm index --server X` | List tools on a server |
| 3 | `dm hydrate tool1 tool2 --server X` | Get full schemas |
| 4 | `dm run --server X ...` | Execute workflow |

---

## Commands

### `dm servers` - List available MCP servers

```bash
dm servers
```

Shows all servers from `mcp.json`. Servers with `disabled: true` show as "disabled (good!)".

### `dm doctor` - Sanity check

```bash
dm doctor --server contextrepo
```

Checks: finds `mcp.json`, resolves server, attempts `initialize` + `tools/list`.

### `dm index` - List tools (compact)

```bash
dm index --server contextrepo
dm index --server contextrepo --json
```

Outputs a compact table (name + description + required params).

### `dm search` - Find tools by keyword

```bash
dm search "semantic search over docs" --limit 8 --server contextrepo
```

Searches the cached index.

### `dm hydrate` - Get full schemas

```bash
dm hydrate search_documents get_document --server contextrepo
```

Writes to `.factory/droid-mode/hydrated/<server>/<timestamp>/`:
- `tools.json` - full tool definitions
- `types.d.ts` - TypeScript types
- `toolmap.json` - safe JS identifiers → tool names

### `dm run` - Execute workflow

```bash
dm run --server contextrepo --tools search_documents,get_document --workflow workflow.js
```

Example workflow:

```js
workflow = async () => {
  const docs = await t.searchDocuments({ query: "Droid Mode PRD", limit: 5 })
  const full = await Promise.all(docs.results.map(d => t.getDocument({ id: d.id })))
  return { count: full.length, ids: full.map(x => x.id) }
}
```

---

## Output & Audit Artifacts

All artifacts written to `.factory/droid-mode/`:

| Path | Contents |
|------|----------|
| `cache/<server>/tools.json` | Cached tool inventory |
| `hydrated/<server>/<ts>/` | Schema bundles |
| `runs/<server>/<ts>/run.json` | Workflow result + trace |

---

## Daemon Mode (Performance)

The daemon maintains persistent MCP connections, reducing call latency by ~5x. Each project gets its own isolated daemon instance.

### Per-Project Isolation

Droid Mode automatically creates separate daemons for each project, preventing configuration cross-contamination:

```bash
# Each project gets its own daemon
cd ~/project-a && dm daemon start  # → dm-daemon-<hash-a>.sock
cd ~/project-b && dm daemon start  # → dm-daemon-<hash-b>.sock

# View all daemons across projects
dm daemon status --all

# Output:
# project                    pid    status   started
# -------------------------  -----  -------  ----------
# /Users/me/project-a        12345  running  2026-01-04
# /Users/me/project-b        12346  running  2026-01-04
```

This ensures:
- **Configuration isolation**: Each daemon loads its project's `mcp.json`
- **Connection separation**: MCP server connections don't leak between projects
- **Governance compliance**: Projects with different access policies stay separated

### Benchmark Results

| Mode | Per-Call (warm) | 10 Operations |
|------|-----------------|---------------|
| Without Daemon | ~2,900ms | 29.9s |
| **With Daemon** | **~620ms** | **10.2s** |

### Commands

```bash
dm daemon start          # Start daemon for current project
dm daemon stop           # Stop current project's daemon
dm daemon status         # Check current project's daemon
dm daemon status --all   # List ALL daemons across projects
dm daemon list           # Alias for status --all
dm daemon warm [server]  # Pre-warm connections
```

The daemon is optional-without it, everything works as before.

---

## Security Posture

- Credentials remain in `mcp.json` env/headers, not in prompts
- Workflow sandbox blocks `require`, `import`, `process`, `fetch`
- Network access mediated through MCP server only
- Every tool call traced (name, args hash, duration, error flag)

Optional: Add a **PreToolUse hook** to block direct `mcp__*` calls. See `examples/hooks/`.

---

## Design Philosophy

Treat MCP as infrastructure. Treat Skills as capability boundaries. Treat code as a reasoning amplifier - not as authority.
