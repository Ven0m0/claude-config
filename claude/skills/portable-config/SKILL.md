---
name: portable-config
description: Environment-agnostic configuration patterns for sharing Claude Code setups. Handles path normalization across machines. Triggers: portable, CLAUDE_HOME, share-config.
allowed-tools: Bash, Read, Edit
---

# Portable Configuration Patterns

Ensures Claude Code configurations work seamlessly across different users and machines.

## Path Portability

Always replace absolute paths in configurations with the `{{CLAUDE_HOME}}` placeholder.

- **Bad**: `/Users/alice/.claude/settings.json`
- **Good**: `{{CLAUDE_HOME}}/settings.json`

## Workflow

1. **On Export**: Scan configuration files for local absolute paths and substitute with placeholders.
2. **On Import**: Detect placeholders and expand them to the current user's actual path.

## Commands

Use environment variables to manage persistent setup:

```bash
# Set persistent environment file
export CLAUDE_ENV_FILE="{{CLAUDE_HOME}}/env.sh"
```
