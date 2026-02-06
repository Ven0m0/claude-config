---
name: claude-md
description: Audit, refresh, or improve a .claude.md / AGENTS.md file for accuracy and best practices
subagent: project-setup:claude-md-auditor
---

# Manage CLAUDE.md

Audit, refresh, or interactively improve your project's `.claude.md` or `AGENTS.md` file.

**Modes** (from `$ARGUMENTS`):
- `audit` or no args: Audit only - verify claims against codebase, report findings
- `refresh`: Audit + generate refreshed content with parallel exploration agents
- `improve`: Interactive guided improvement with prioritized fixes and user feedback

## Workflow

1. **Locate file**: CLAUDE.md -> AGENTS.md -> .claude/CLAUDE.md (offer to create if missing)
2. **Audit**: Read file, verify every claim against the actual codebase
3. **Report**: Categorize findings as accurate, stale, missing, or obsolete

### Refresh Mode (additional steps)

4. Launch 4 parallel exploration agents to verify: structure, tech stack, commands, patterns
5. Generate refreshed version following conciseness best practices
6. Present diff and ask user to approve, modify, or keep existing content

### Improve Mode (additional steps)

4. Present findings categorized by priority (critical/high/medium/low)
5. Ask user which improvements to prioritize
6. Apply improvements iteratively with user feedback
7. Final review before writing changes

## Content Guidelines

- Be concise: prefer tables and bullet points over prose
- Be specific: "Run `make test`" not "run the tests"
- Be current: only document what actually exists
- Target <300 lines; use progressive disclosure
- Link, don't duplicate: reference files instead of copying content

## Related Commands

- `/create-claude-md` - Create new .claude.md from scratch (interactive)
