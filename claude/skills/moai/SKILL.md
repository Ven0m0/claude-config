---
name: moai-foundation-claude
description: Core Claude Code extension-authoring playbook for skills, agents, commands, plugins, hooks, and settings. Use when creating or reviewing Claude Code extensions and automation workflows.
license: Apache-2.0
compatibility: Designed for Claude Code
allowed-tools: Read, Grep, Glob, Bash
user-invocable: false
metadata:
  version: "6.0.0"
  category: "foundation"
  status: "active"
  updated: "2026-02-22"
  tags: "foundation, claude-code, skill-authoring, agent-authoring, plugins, hooks, commands"
---

# Claude Code Authoring Foundation

Use this skill as the default foundation for extension work in this repo.

## When to use

- Building or refactoring a `SKILL.md`
- Creating or tightening an agent file in `claude/agents/`
- Creating plugin scaffolding or command packs
- Reviewing hook configuration and permission boundaries
- Migrating verbose docs to compact progressive-disclosure structure

## Fast workflow

<workflow>
1. Classify task: skill, agent, plugin, command, hook, or settings.
2. Load only required references from `reference/README.md`.
3. Implement smallest working change with least-privilege tools.
4. Validate: lint/tests/command checks relevant to touched files.
5. Summarize changes, risk, and follow-up work.
</workflow>

## Authoring rules

### Skills

- Keep frontmatter minimal and valid.
- Description must answer: what it does, when to use it, trigger phrases.
- Keep `SKILL.md` concise; move long examples to one-hop reference files.
- Do not embed copied vendor docs; use short summaries plus canonical links.
- Prefer deterministic checklists/workflows over long prose.

### Agents

- One-sentence mission.
- Explicit constraints and tool boundaries.
- Output contract with clear deliverables.
- Avoid repeated global policy text already covered in shared docs.

### Commands and plugins

- Keep command interfaces explicit and small.
- Use argument placeholders consistently (`$ARGUMENTS`, `$1`, `$2`).
- In plugins, keep manifest/tool scopes tight and document required setup only.

### Hooks and safety

- Use hooks for policy enforcement, not noisy logging.
- Never log secrets.
- Fail with actionable messages when blocking.

## Token efficiency checklist

- Is this instruction duplicated elsewhere?
- Can a table replace paragraphs?
- Can examples be reduced to one representative pattern?
- Can a local copy of docs be replaced with a URL?
- Can this be verified by a script or command?

## Output format

When this skill drives work, return:

1. Scope and assumptions
2. Files changed
3. Validation performed
4. Residual risks and next steps

## Resources

- `../AGENT_SKILL_SPEC.md` - Anthropic and Copilot alignment baseline
- `reference/README.md` - canonical link map and local standards
- `examples.md` - compact implementation templates
