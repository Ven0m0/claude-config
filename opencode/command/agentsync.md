---
description: Sync agent configuration files across Claude Code, Copilot, Cursor, and OpenCode
---

# Agent Sync

Synchronize agent configuration files and instructions across different AI coding tools.

## Supported Tools

- Claude Code (`claude/`)
- Copilot (`.github/copilot-instructions.md`)
- Cursor (`.cursor/`, `cursor/rules/`)
- OpenCode (`opencode/`)

## Usage

```
/agentsync [options]

Options:
  --dry-run    Show what would be synced without making changes
  --force      Overwrite existing files without prompting
  --verbose    Show detailed output
```

## Workflow

1. **Detect configurations** in each tool's expected locations
2. **Compare** files to identify differences
3. **Map common patterns** (e.g., AGENTS.md ↔ copilot-instructions.md ↔ opencode/AGENTS.md)
4. **Propagate changes** from a source or merge across all

## Sync Priority

When conflicts occur, prefer:
1. Most recent modification timestamp
2. User-specified source with `--source=<tool>`
3. Claude Code conventions (as the most complete model)

## Common Patterns

| Pattern | Claude Code | Copilot | Cursor | OpenCode |
|---------|-------------|---------|--------|----------|
| Agent instructions | `AGENTS.md` | `.github/copilot-instructions.md` | `.cursor/rules/` | `opencode/AGENTS.md` |
| Skills | `claude/skills/` | - | - | `opencode/skill/` |
| Hooks | `claude/hooks/` | - | - | - |
| Commands | - | - | - | `opencode/command/` |

## Notes

- Only syncs non-tool-specific configurations
- Skips API keys, tokens, and personal preferences
- Respects `.gitignore` patterns

## Notes/Inspiration

Inspired by [`@dallay/agentsync`](https://www.npmjs.com/package/@dallay/agentsync) - Config syncer across Claude/Copilot/Cursor/OpenCode.
