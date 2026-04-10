---
name: kilo-config
description: Help users configure and troubleshoot Kilo CLI, KiloCode Gateway, and agent settings. Use when discussing kilo.jsonc configuration, model selection, MCP servers, rules, or skills.
---

# Kilo Configuration Guide

## Configuration File Locations

| Scope | Path |
|-------|------|
| Project | `./.kilo/kilo.jsonc` (preferred), `./kilo.jsonc` |
| Global | `~/.config/kilo/kilo.jsonc` |

`.kilocode/` is kept only as a legacy compatibility path. The shared project config lives in `.kilo/`.

## Model Format

Kilo Gateway uses `provider/model-name` format:

```json
{
  "model": "anthropic/claude-sonnet-4.6"
}
```

## Available Model Categories

**Repo baseline**:
- `github-copilot/gpt-5` - default and planning
- `github-copilot/gpt-5-mini` - lightweight path
- `github-copilot/gpt-5.1-codex` - build, code, and debug
- `github-copilot/gpt-5.1-codex-mini` - explore
- `github-copilot/gemini-3.1-pro-preview` - research
- `github-copilot/claude-sonnet-4.5` - review

**Fallback providers kept in config**:
- `anthropic/*` via `ANTHROPIC_API_KEY`
- `gemini/*` via `GEMINI_API_KEY`
- `kilo/*` via `KILO_API_KEY`

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
      "url": "https://example.com/mcp",
      "headers": {
        "Authorization": "Bearer {env:API_TOKEN}"
      }
    }
  }
}
```

Repo baseline MCPs:

- `github-mcp-server` with `Authorization: Bearer {env:GITHUB_TOKEN}`
- `ref-tools` with `x-ref-api-key: {env:REF_API_KEY}`
- `exa` with `x-api-key: {env:EXA_API_KEY}`
- `gh_grep` without auth

The repo baseline removes local-only MCP wrappers like `icm` so the shared config stays Linux and Windows 10/11 compatible.

## Project Rules and Modes

- Shared project rules live in `.kilo/rules/` and are loaded from `.kilo/kilo.jsonc`
- Shared skills live in `.kilo/skill/`
- Project custom modes live in `.kilocodemodes`

## Agent Configuration

```json
{
  "model": "github-copilot/gpt-5",
  "small_model": "github-copilot/gpt-5-mini",
  "provider": {
    "github-copilot": {
      "options": {
        "apiKey": "{env:GITHUB_TOKEN}",
        "enterpriseUrl": "{env:GITHUB_ENTERPRISE_URL}",
        "setCacheKey": true
      }
    }
  },
  "agent": {
    "code": {
      "model": "github-copilot/gpt-5.1-codex",
      "temperature": 0.1,
      "options": {
        "reasoningEffort": "medium",
        "reasoningSummary": "auto",
        "textVerbosity": "low"
      }
    }
  }
}
```

## Troubleshooting

- Use `kilo mcp list` to verify MCP servers
- Reload window after config changes
- Check Output panel → "Kilo Code" for errors
