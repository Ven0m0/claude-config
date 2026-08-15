---
paths:
  - '**/skills/*/SKILL.md'
---

# Skills Rules

## Required Structure

Every SKILL.md follows the Agent Skills standard (agentskills.io). Required frontmatter:

```yaml
---
name: skill-name # Unique, kebab-case, max 64 chars
description: > # Purpose, YAML folded scalar, max 1024 chars
  Brief description of what this skill does and when to use it.
---
```

Optional fields: `disable-model-invocation`, `model`, `allowed-tools` (space-delimited, not a YAML array),
`user-invocable`, `license` (default Apache-2.0), `compatibility`, `metadata` (map of quoted-string
key/value pairs: `version`, `category`, `status`, `updated`, `tags`, `author`).

Format rules: `allowed-tools: Read Grep Glob Bash` not `[Read, Grep, Glob, Bash]`; metadata values
always quoted strings (`version: "1.0.0"` not `1.0.0`).

## File Organization

```
.claude/skills/
  skill-name/
    SKILL.md           # Required, <=500 lines
    references/        # Optional supporting docs
    scripts/           # Optional helper scripts
```

## Skill Types

<knowledge_skills>
Auto-applied domain knowledge. Do not set `disable-model-invocation`.
</knowledge_skills>

<workflow_skills>
Repeatable processes with side effects. Set `disable-model-invocation: true`.
Use `$ARGUMENTS` placeholder for user input.
</workflow_skills>

## Content Guidelines

<guidelines>
- Be concise: direct instructions over verbose explanations
- Include verification steps with specific commands
- Use `$ARGUMENTS` placeholder for user-provided input
- Progressive detail: quick reference at top, details below
- Single responsibility: one skill per focused concern
- Keep updated when project conventions change
</guidelines>

## Tool Restrictions

| Type         | Tools                                     |
| ------------ | ----------------------------------------- |
| Read-Only    | Read, Grep, Glob                          |
| Modification | Read, Grep, Edit, Bash                    |
| Full Access  | Read, Grep, Glob, Edit, Write, Bash, Task |

By category (foundation/workflow/domain/language skills - see `metadata.category`):

- **Foundation**: Read, Grep, Glob, Context7 MCP only. Never Bash/Task.
- **Workflow**: Read, Write, Edit, Grep, Glob, Bash, TodoWrite. AskUserQuestion/Task for orchestrators only.
- **Domain / Language**: Read, Grep, Glob, Bash; Write/Edit only for implementation tasks. Never AskUserQuestion/Task.

## Progressive Disclosure

Three-level loading for token efficiency:

1. **Metadata** (~100 tokens): name, description, triggers - always loaded for skills in agent frontmatter.
2. **Body** (~5000 tokens): full SKILL.md content - loaded when trigger conditions match.
3. **Bundled** (variable): `references/`, `scripts/`, examples - loaded on-demand by Claude.

Keep SKILL.md itself under 500 lines; push detail into `references/` for level-3 loading.

## Debugging Skills

| Problem                | Solution                                                                    |
| ---------------------- | --------------------------------------------------------------------------- |
| Skill not loading      | Check YAML frontmatter syntax, verify path `.claude/skills/*/SKILL.md`      |
| Not auto-applied       | Remove `disable-model-invocation`, make description match relevant contexts |
| Workflow not executing | Check `$ARGUMENTS` usage, verify script permissions                         |

## Discovery

```
/skill                    # List all skills
/skill search testing     # Search skills
/skill show skill-name    # View skill content
```
