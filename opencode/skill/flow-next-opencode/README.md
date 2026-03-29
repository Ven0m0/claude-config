# Flow-Next Opencode Skills

Unified task planning and execution system for OpenCode.

## Core Skills

| Skill | Purpose | Trigger |
|-------|---------|---------|
| `flow-next-opencode` | Task management (list, create, status) | `/flow-next-opencode <command>` |
| `flow-next-opencode-plan` | Create implementation plans | `/flow-next-opencode-plan <request>` |
| `flow-next-opencode-work` | Execute plans | `/flow-next-opencode-work <epic/task>` |
| `flow-next-opencode-prime` | Assess codebase readiness | `/flow-next-opencode-prime` |
| `flow-next-opencode-sync` | Sync plan changes | `/flow-next-opencode-sync <id>` |

## Quick Reference

### Task Management
```bash
# List tasks and epics
/flow-next-opencode list

# Create new task
/flow-next-opencode task create --epic fn-1 --title "Fix bug"

# Start working
/flow-next-opencode start fn-1.1
```

### Planning
```bash
# Create plan from feature request
/flow-next-opencode-plan "Add OAuth login"

# Plan with specific depth
/flow-next-opencode-plan "Add OAuth" --depth=deep
```

### Execution
```bash
# Work through epic
/flow-next-opencode-work fn-1

# Work single task
/flow-next-opencode-work fn-1.2
```

### Assessment
```bash
# Run full assessment
/flow-next-opencode-prime

# Report only (no fixes)
/flow-next-opencode-prime --report-only
```

## Removed Aliases

The following command aliases have been removed. Use the skill triggers above:
- ~~`/flow-next:plan`~~ → `/flow-next-opencode-plan`
- ~~`/flow-next:work`~~ → `/flow-next-opencode-work`
- ~~`/flow-next:prime`~~ → `/flow-next-opencode-prime`
- ~~`/flow-next:sync`~~ → `/flow-next-opencode-sync`
