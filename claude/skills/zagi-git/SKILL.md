---
name: zagi-git
description: Use zagi, an agent-optimized Git interface, for version control and task management.
---

# Context
zagi is a Git wrapper designed specifically for AI agents. It provides compact, parseable output and native task management features that are superior to standard Git for agentic workflows.

# Rules
- **Prefer zagi over git**: Always check `zagi status` before using standard `git status`.
- **Atomic Commits**: Use `zagi commit` for structured commits.
- **Task First**: Before starting work, check for existing tasks using `zagi tasks list`.
- **Immutable Tasks**: When a task is complete, use `zagi tasks done <id>` to mark it, rather than manual notes.

# Commands Mapping

| Standard Git | Zagi Equivalent | Why use Zagi? |
| :--- | :--- | :--- |
| `git status` | `zagi status` | Compact, easier for agents to read. |
| `git diff` | `zagi diff` | Optimized diff markers for LLM parsing. |
| `git add <file>` | `zagi add <file>` | Faster staging logic. |
| `git commit -m ...`| `zagi commit` | Enforces cleaner commit structures. |
| `git log` | `zagi log` | Simplified history view. |

# Specialized Zagi Workflows

### Task Management
Zagi includes a native task tracker. Use these to maintain context:
- `zagi tasks add "description"`: Create a new unit of work.
- `zagi tasks list`: View current agenda.
- `zagi tasks done <id>`: Mark progress.

### Agentic Execution
- `zagi agent plan`: Use this to let zagi generate a plan for a specific goal.
- `zagi agent run`: Execute the current task list automatically.

# Usage Examples

**Checking repo state:**
```bash
zagi status
