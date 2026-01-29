---
description: Optimize, audit, create, or migrate CLAUDE.md files
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Bash
  - WebSearch
  - WebFetch
argument-hint: [audit|optimize|create|migrate|enforce]
---

# CLAUDE.md Optimizer

Comprehensive toolkit for CLAUDE.md file optimization, auditing, creation, and
enforcement setup.

## Essential Principles

**LLMs Are Stateless**: Claude starts every session with zero codebase
knowledge. CLAUDE.md is the ONLY file included by default in every conversation.

**Critical Constraints**:

| Constraint         | Limit                                          |
| ------------------ | ---------------------------------------------- |
| Instruction Limit  | ~150-200 instructions (LLM reliable following) |
| Claude Code System | ~50 instructions consumed by harness           |
| Your Budget        | ~100-150 instructions for CLAUDE.md            |

**4-Tier Hierarchy** (specific to general):

1. **Project local**: `./CLAUDE.local.md` (gitignored)
2. **Project shared**: `./CLAUDE.md` (<300 lines)
3. **User**: `~/.claude/CLAUDE.md` (<60 lines)
4. **Enterprise**: System-wide policies

**Format Efficiency**:

| Format        | Efficiency    |
| ------------- | ------------- |
| Code examples | 10x prose     |
| XML tags      | 10x + parsing |
| Tables        | 5x prose      |
| Bullets       | 3x prose      |
| Prose         | 1x (avoid)    |

## Workflow Routing

Based on user intent or $ARGUMENTS, route to the appropriate workflow:

| Intent                                | Workflow     | File                                                   |
| ------------------------------------- | ------------ | ------------------------------------------------------ |
| "audit", "score", "assess", "review"  | **Audit**    | `${CLAUDE_PLUGIN_ROOT}/workflows/audit-claudemd.md`    |
| "optimize", "improve", "refactor"     | **Optimize** | `${CLAUDE_PLUGIN_ROOT}/workflows/optimize-claudemd.md` |
| "create", "new", "build from scratch" | **Create**   | `${CLAUDE_PLUGIN_ROOT}/workflows/create-claudemd.md`   |
| "opus", "4.5", "migrate", "upgrade"   | **Migrate**  | `${CLAUDE_PLUGIN_ROOT}/workflows/migrate-opus.md`      |
| "enforcement", "hooks", "settings"    | **Setup**    | `${CLAUDE_PLUGIN_ROOT}/workflows/setup-enforcement.md` |

## Intake

If intent is unclear from $ARGUMENTS, ask:

> What would you like to do?
>
> 1. **Audit** - Score against rubric, identify improvements
> 2. **Optimize** - Apply best practices to existing file
> 3. **Create** - Build new CLAUDE.md from scratch
> 4. **Migrate** - Adjust for Opus 4.5+ behavior
> 5. **Setup Enforcement** - Configure hooks and settings

Read the appropriate workflow file and execute its instructions.

## Reference Files

| File                                                          | Purpose                       |
| ------------------------------------------------------------- | ----------------------------- |
| `${CLAUDE_PLUGIN_ROOT}/references/best-practices.md`          | Canonical best practices      |
| `${CLAUDE_PLUGIN_ROOT}/references/rubric.md`                  | 100-point scoring framework   |
| `${CLAUDE_PLUGIN_ROOT}/references/transformation-guide.md`    | Language softening patterns   |
| `${CLAUDE_PLUGIN_ROOT}/templates/boundaries-section.md`       | Always/Ask/Never template     |
| `${CLAUDE_PLUGIN_ROOT}/templates/audit-report.md`             | Audit output format           |
| `${CLAUDE_PLUGIN_ROOT}/templates/project-claudemd-starter.md` | Project template              |
| `${CLAUDE_PLUGIN_ROOT}/templates/user-claudemd-starter.md`    | User template                 |
| `${CLAUDE_PLUGIN_ROOT}/scripts/analyze.ts`                    | Deterministic analysis script |

## Anti-Patterns

| Pattern                       | Problem                             |
| ----------------------------- | ----------------------------------- |
| Auto-generating CLAUDE.md     | Loses high-leverage manual crafting |
| Mixing hierarchy levels       | User vs project vs task-specific    |
| Task-specific in project file | Use progressive disclosure          |
| Style guides in CLAUDE.md     | Use linters + hooks instead         |
| Embedded code snippets        | Use `file:line` pointers            |
| Exceeding instruction budget  | Ruthlessly cut non-essential        |

## Success Criteria

A well-optimized CLAUDE.md:

- Scores 75+ on quality rubric (90+ excellent)
- Uses 80%+ high-efficiency formats
- Has clear hierarchy separation
- Implements 2+ enforcement layers
- Stays within instruction budget
- Results in fewer clarification questions
