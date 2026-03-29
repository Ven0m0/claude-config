---
name: kilo-config
description: Help users configure and troubleshoot Kilo CLI, KiloCode Gateway, and agent settings. Use when discussing kilo.json configuration, model selection, MCP servers, or skills.
---

# Kilo Configuration Guide

## Configuration File Locations

| Scope | Path |
|-------|------|
| Project | `./kilo.json`, `./.kilo/kilo.json` |
| Global | `~/.config/kilo/kilo.json` |

## Model Format

Kilo Gateway uses `provider/model-name` format:

```json
{
  "model": "anthropic/claude-sonnet-4.6"
}
```

## Available Model Categories

**Auto Models** (recommended):
- `kilo-auto/frontier` - Best capabilities, routes to top models
- `kilo-auto/balanced` - Cost-effective with good performance
- `kilo-auto/free` - Free tier models

**Anthropic**:
- `anthropic/claude-opus-4.6` - Most capable
- `anthropic/claude-sonnet-4.6` - Balanced
- `anthropic/claude-haiku-4.5` - Fast

**Free Models**:
- `minimax/minimax-m2.1:free`
- `z-ai/glm-5:free`
- `arcee-ai/trinity-large-preview:free`

## MCP Server Configuration

Local server:
```json
{
  "mcp": {
    "my-server": {
      "type": "local",
      "command": ["npx", "-y", "@modelcontextprotocol/server-name"]
    }
  }
}
```

Remote server:
```json
{
  "mcp": {
    "my-server": {
      "type": "remote",
      "url": "https://example.com/mcp"
    }
  }
}
```

## Agent Configuration

```json
{
  "agent": {
    "my-agent": {
      "model": "kilo-auto/balanced",
      "reasoningEffort": "high",
      "temperature": 0.2
    }
  }
}
```

## Troubleshooting

- Use `kilo mcp list` to verify MCP servers
- Reload window after config changes
- Check Output panel → "Kilo Code" for errors
