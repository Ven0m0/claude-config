# claude/workflows/

## Responsibility
Multi-step workflow definitions for CLAUDE.md lifecycle management and system setup. Each workflow is a structured process with numbered steps.

## Design
Markdown files defining step-by-step procedures. Workflows combine multiple commands, tools, and agent interactions into cohesive processes.

## Contents

| Workflow | Purpose |
|----------|---------|
| `audit-claudemd.md` | Score existing CLAUDE.md against quality rubric (100 points) with improvement recommendations |
| `create-claudemd.md` | Build new CLAUDE.md (user-level or project-level) from scratch via interactive process |
| `migrate-opus.md` | Migration workflow for Opus model upgrades |
| `optimize-claudemd.md` | Optimize existing CLAUDE.md for token efficiency and quality |
| `setup-enforcement.md` | Set up enforcement rules and hooks for a project |

## Integration
- Invoked by: Commands (`/claude-md`), agents (`llm-boost`), or directly by users
- Depends on: Scripts (`analyze-claude-md.ts`), agents, rules
