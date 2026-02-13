# Repository Atlas: claude/

## Project Responsibility
The main configuration pack for Claude Code -- a comprehensive AI agent orchestration system providing 18 specialized agents, 59 reusable skills, 31 slash commands, event-driven hooks, behavioral rules, and reference documentation. This directory is the core of the claude-config marketplace ecosystem (~3.3MB).

## Architecture Overview

```
claude/
  AGENTS.md          -- Agent routing table and orchestration rules (master config)
  CLAUDE.md          -- Project-level Claude Code configuration
  settings.json      -- Permissions, env vars, model routing, plugin registry
  agents/            -- 18 agent personalities with model routing
  skills/            -- 59 reusable workflow templates
  commands/          -- 31 slash commands for CLI automation
  hooks/             -- Event-driven automation (format, validate, protect)
  rules/             -- Behavioral constraints and coding standards
  docs/              -- 20 reference documents (progressive disclosure)
  scripts/           -- 9 utility scripts (analysis, formatting, validation)
  mcp/               -- 3 MCP server configs (Z.AI web reader/search/zread)
  output-styles/     -- 2 response formatting styles
  partnerships/      -- 1 alternative model provider config (GLM-4)
  workflows/         -- 5 multi-step CLAUDE.md lifecycle workflows
```

## System Entry Points
- `AGENTS.md` -- Master orchestration config: agent routing table, tool preferences, code standards, LSP enforcement, communication style
- `settings.json` -- Runtime config: 34 env vars, 45 permission rules, model routing (opusplan main, haiku subagent), 35+ enabled plugins, hook configuration
- `CLAUDE.md` -- Project-level instructions loaded by Claude Code on session start

## Data Flow

```
User request
  -> AGENTS.md (routing rules) -> select agent from agents/
  -> Agent loads skills from skills/ (on-demand)
  -> Hooks fire on events (PreToolUse, PostToolUse, SessionStart)
  -> Rules constrain behavior (security, testing, tool usage)
  -> Docs provide reference (progressive disclosure from CLAUDE.md)
  -> Scripts execute automation (formatting, validation)
```

## Directory Map

| Directory | Responsibility | Files | Detailed Map |
|-----------|---------------|-------|--------------|
| `agents/` | 18 specialized agent personalities with model routing (haiku/sonnet/opus) | 17 agents + 5 moai builders | [View Map](agents/codemap.md) |
| `commands/` | 31 slash commands for CLI workflow automation | 31 commands | [View Map](commands/codemap.md) |
| `docs/` | 20 reference documents for progressive disclosure | 20 docs | [View Map](docs/codemap.md) |
| `hooks/` | Event-driven automation: formatting, validation, context protection, memory | 10 hooks + 6 formatter scripts + 4 memory/compact scripts | [View Map](hooks/codemap.md) |
| `rules/` | Behavioral constraints: constitution, coding standards, 7 language rules, workflow | 20 root rules + 10 categorized rules | [View Map](rules/codemap.md) |
| `scripts/` | Utility scripts for analysis, formatting, validation, initialization | 9 scripts (TS, Python, Shell) | [View Map](scripts/codemap.md) |
| `skills/` | 59 reusable workflow templates across 11 categories | 59 skills with modules/references/scripts | [View Map](skills/codemap.md) |
| `mcp/` | MCP server configuration templates (Z.AI services) | 3 JSON configs | [View Map](mcp/codemap.md) |
| `output-styles/` | Response formatting style definitions | 2 styles (main, orchestrator) | [View Map](output-styles/codemap.md) |
| `partnerships/` | Alternative model provider integrations | 1 config (GLM-4 via Z.AI) | [View Map](partnerships/codemap.md) |
| `workflows/` | Multi-step CLAUDE.md lifecycle management | 5 workflows | [View Map](workflows/codemap.md) |

## Key Design Decisions

- **Progressive disclosure** -- CLAUDE.md is lean; details live in docs/, skills load on-demand
- **Multi-model routing** -- haiku for exploration, sonnet for implementation, opus for reasoning
- **Event-driven hooks** -- Auto-format, policy enforcement, context protection without manual intervention
- **Skill-based architecture** -- 59 skills loaded on-demand, not permanently in context
- **Token optimization** -- TOON format (31% savings), MCP skills registry (90% savings), strategic compaction
- **Security by default** -- Deny .env reads, enforce rg over grep, block large file reads, mandatory verification
