# MCP Server Integration Guide

Model Context Protocol (MCP) servers extend Claude Code with external tools and data sources.

## Configuration Locations

| Scope | Location | Purpose |
|-------|----------|---------|
| User | `~/.claude.json` | Personal MCP servers |
| Project | `.mcp.json` | Team-shared servers |
| Managed | `/etc/claude-code/managed-mcp.json` | Enterprise servers |

## Basic Configuration

### Project MCP (`.mcp.json`)

```json
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-memory"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-github"],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

### User MCP (`~/.claude.json`)

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@anthropic/mcp-server-filesystem", "/path/to/allowed/dir"]
    }
  }
}
```

## Common MCP Servers

### Memory Server

Persistent memory across sessions.

```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-memory"]
  }
}
```

**Tools:**
- `mcp__memory__search` - Search memories
- `mcp__memory__save` - Save new memory
- `mcp__memory__get` - Get specific memory

### GitHub Server

GitHub API integration.

```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-github"],
    "env": {
      "GITHUB_TOKEN": "${GITHUB_TOKEN}"
    }
  }
}
```

**Tools:**
- `mcp__github__create_pull_request`
- `mcp__github__get_issue`
- `mcp__github__search_repositories`

### Context7 (Documentation)

Access library documentation.

```json
{
  "context7": {
    "command": "npx",
    "args": ["-y", "@anthropic/mcp-server-context7"]
  }
}
```

**Tools:**
- `mcp__context7__resolve_library_id` - Find library
- `mcp__context7__get_library_docs` - Get documentation

### Filesystem Server

Controlled filesystem access.

```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@anthropic/mcp-server-filesystem",
      "/allowed/path1",
      "/allowed/path2"
    ]
  }
}
```

**Tools:**
- `mcp__filesystem__read_file`
- `mcp__filesystem__write_file`
- `mcp__filesystem__list_directory`

## Environment Variables

### Inline Variables

```json
{
  "env": {
    "API_KEY": "sk-xxx"
  }
}
```

### Reference System Variables

```json
{
  "env": {
    "GITHUB_TOKEN": "${GITHUB_TOKEN}"
  }
}
```

### Multiple Environment Sources

```json
{
  "env": {
    "API_KEY": "${API_KEY}",
    "DEBUG": "true",
    "CUSTOM_VAR": "value"
  }
}
```

## Settings Integration

### Auto-Approve Project Servers

In `settings.json`:

```json
{
  "enableAllProjectMcpServers": true
}
```

### Selective Approval

```json
{
  "enabledMcpjsonServers": ["memory", "github"],
  "disabledMcpjsonServers": ["filesystem"]
}
```

### MCP Permissions

```json
{
  "permissions": {
    "allow": [
      "mcp__memory__*",
      "mcp__github__search_*"
    ],
    "deny": [
      "mcp__filesystem__write_*"
    ]
  }
}
```

## Timeout Configuration

```json
{
  "env": {
    "MCP_TIMEOUT": "30000",
    "MCP_TOOL_TIMEOUT": "60000"
  }
}
```

## Custom MCP Servers

### Python Server

```json
{
  "custom-server": {
    "command": "python",
    "args": ["-m", "my_mcp_server"],
    "cwd": "/path/to/server",
    "env": {
      "PYTHONPATH": "/path/to/server"
    }
  }
}
```

### Node.js Server

```json
{
  "custom-server": {
    "command": "node",
    "args": ["./server/index.js"],
    "cwd": "${workspaceFolder}"
  }
}
```

### Docker Server

```json
{
  "docker-server": {
    "command": "docker",
    "args": [
      "run", "-i", "--rm",
      "-v", "${workspaceFolder}:/workspace",
      "my-mcp-image"
    ]
  }
}
```

## Debugging MCP

### Check Server Status

```
/mcp
```

### View Server Logs

```
/mcp logs memory
```

### Restart Server

```
/mcp restart memory
```

### Test Tool Manually

```
Use mcp__memory__search with query "test"
```

## Troubleshooting

### Server Not Starting

1. Verify command exists: `which npx`
2. Check args syntax (JSON array)
3. Verify env vars are set
4. Check server logs: `/mcp logs servername`

### Tool Not Found

1. Verify server is running: `/mcp`
2. Check tool name: `mcp__servername__toolname`
3. Ensure tool is exposed by server

### Permission Denied

1. Check `permissions.deny` rules
2. Verify `enableAllProjectMcpServers` setting
3. Check `disabledMcpjsonServers` list

### Timeout Errors

1. Increase `MCP_TIMEOUT` for startup
2. Increase `MCP_TOOL_TIMEOUT` for operations
3. Check server performance

## Security Best Practices

### Principle of Least Privilege

```json
{
  "permissions": {
    "allow": [
      "mcp__github__search_*",
      "mcp__github__get_*"
    ],
    "deny": [
      "mcp__github__create_*",
      "mcp__github__delete_*"
    ]
  }
}
```

### Secrets Management

Never commit secrets:

```json
{
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

### Filesystem Isolation

Limit filesystem server to specific directories:

```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y", "@anthropic/mcp-server-filesystem",
      "./src",
      "./tests"
    ]
  }
}
```

### Network Restrictions

Use sandbox mode to restrict network access:

```json
{
  "sandbox": {
    "enabled": true,
    "network": {
      "allowLocalBinding": false
    }
  }
}
```
