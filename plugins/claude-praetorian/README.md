# claude-praetorian

Security guardrails and context memory for Claude Code sessions.

## Overview

Claude Praetorian provides two key capabilities:

1. **Context Memory** - Persist valuable context across Claude Code sessions using structured compaction
2. **Security Guardrails** - Protect sensitive information during exploration and research tasks

## Commands

| Command | Description |
|---|---|
| `/compact` | Save current context to praetorian memory |
| `/restore` | Load previous context from praetorian memory |
| `/search` | Search praetorian memory for past context |

## Installation

```bash
/plugin install claude-praetorian@claude-config-marketplace
```

## Usage

```bash
# Save context before session ends
/compact decisions "Auth implementation approach"

# Restore context at session start
/restore auth

# Search for specific past work
/search "API design"
```

## Hooks

Praetorian installs session lifecycle hooks:

- `session-start.js` - Load recent compactions on session start
- `session-end.js` - Prompt for context save on session end
- `pre-compact.js` - Pre-process context before compaction
- `post-exploration.js` - Save exploration findings automatically
- `post-research.js` - Save research results automatically

## Skills

- `claude-praetorian` - Core context management skill
