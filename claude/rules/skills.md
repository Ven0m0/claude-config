---
paths:
  - "**/skills/*/SKILL.md"
---

# Skills Rules

## Required Structure

Every SKILL.md must have YAML frontmatter:

```yaml
---
name: skill-name          # Unique, kebab-case
description: Brief desc   # What the skill provides
---
```

Optional fields: `disable-model-invocation`, `model`, `allowed-tools`, `user-invocable`

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

| Type | Tools |
|------|-------|
| Read-Only | Read, Grep, Glob |
| Modification | Read, Grep, Edit, Bash |
| Full Access | Read, Grep, Glob, Edit, Write, Bash, Task |

## Debugging Skills

| Problem | Solution |
|---------|----------|
| Skill not loading | Check YAML frontmatter syntax, verify path `.claude/skills/*/SKILL.md` |
| Not auto-applied | Remove `disable-model-invocation`, make description match relevant contexts |
| Workflow not executing | Check `$ARGUMENTS` usage, verify script permissions |

## Discovery

```
/skill                    # List all skills
/skill search testing     # Search skills
/skill show skill-name    # View skill content
```
