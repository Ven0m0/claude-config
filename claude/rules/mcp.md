# MCP Server Rules

## Configuration Principles

### Minimal Permissions

Configure only necessary MCP tools:

```json
{
  "permissions": {
    "allow": [
      "mcp__memory__search",
      "mcp__memory__get_observations"
    ],
    "deny": [
      "mcp__memory__delete_*"
    ]
  }
}
```

### Environment Variable Security

NEVER hardcode secrets:

```json
{
  "env": {
    "API_KEY": "${API_KEY}"
  }
}
```

### Scope Appropriately

| Scope | Use For |
|-------|---------|
| User (`~/.claude.json`) | Personal tools, API keys |
| Project (`.mcp.json`) | Team-shared servers |
| Managed | Enterprise requirements |

## Tool Naming Convention

```
mcp__servername__toolname
```

Examples:
- `mcp__memory__search`
- `mcp__github__create_pull_request`
- `mcp__context7__get_library_docs`

## Common MCP Patterns

### Memory Server (3-Layer Workflow)

Always follow the 3-layer pattern for token efficiency:

```python
# 1. Search - Get index (~50-100 tokens/result)
mcp__memory__search(query="auth flow", limit=10)

# 2. Timeline - Context around results
mcp__memory__timeline(anchor=42, depth_before=5)

# 3. Get - Full details for specific IDs only
mcp__memory__get_observations(ids=[42, 45])
```

**Never fetch full details without filtering first.**

### GitHub Server

```python
# Get issue details
mcp__github__get_issue(owner="org", repo="repo", issue_number=123)

# Create PR
mcp__github__create_pull_request(
    owner="org",
    repo="repo",
    title="Fix #123",
    body="Description",
    head="feature-branch",
    base="main"
)
```

### Context7 (Documentation)

```python
# 1. Resolve library ID
result = mcp__context7__resolve_library_id(library_name="react")

# 2. Get documentation
docs = mcp__context7__get_library_docs(
    library_id=result.id,
    topic="hooks"
)
```

## Error Handling

### Check Server Status First

```markdown
/mcp                    # List servers and status
/mcp logs servername    # View server logs
```

### Handle Timeouts

```json
{
  "env": {
    "MCP_TIMEOUT": "30000",
    "MCP_TOOL_TIMEOUT": "60000"
  }
}
```

### Graceful Degradation

```markdown
If MCP tool fails:
1. Check server status
2. Retry once
3. Fall back to alternative (e.g., use gh CLI instead of GitHub MCP)
4. Report limitation to user
```

## Performance Optimization

### Batch Operations

```python
# WRONG: Multiple calls
mcp__memory__get_observations(ids=[1])
mcp__memory__get_observations(ids=[2])
mcp__memory__get_observations(ids=[3])

# CORRECT: Single batched call
mcp__memory__get_observations(ids=[1, 2, 3])
```

### Cache Results

```markdown
# Avoid redundant lookups
library_id = mcp__context7__resolve_library_id("react")
# Use library_id for multiple doc requests
```

### Limit Result Sets

```python
# Always use limits
mcp__memory__search(query="pattern", limit=10)
mcp__github__list_issues(limit=20)
```

## Security Rules

### Filesystem MCP Restrictions

Only allow specific directories:

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

### Deny Dangerous Operations

```json
{
  "permissions": {
    "deny": [
      "mcp__filesystem__delete_*",
      "mcp__github__delete_*",
      "mcp__*__drop_*"
    ]
  }
}
```

### Audit MCP Usage

Regularly review:
- Which MCP servers are configured
- What permissions are granted
- What operations are being performed

## Troubleshooting

### Server Won't Start

1. Verify command exists: `which npx`
2. Check package is installable: `npx -y @anthropic/mcp-server-memory --help`
3. Verify environment variables
4. Check logs: `/mcp logs servername`

### Tool Not Found

1. Verify server is running: `/mcp`
2. Check exact tool name (case-sensitive)
3. Ensure tool is exposed by server version

### Slow Responses

1. Increase timeouts in settings
2. Check server resource usage
3. Consider running server locally vs remote
4. Reduce query scope/limits

### Permission Errors

1. Check `permissions.deny` in settings
2. Verify `enableAllProjectMcpServers`
3. Check `enabledMcpjsonServers` list
4. Review managed settings restrictions
