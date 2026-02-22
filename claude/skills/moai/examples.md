# moai-foundation-claude Examples

Minimal examples for common extension tasks.

## 1) Compact skill template

```markdown
---
name: example-skill
description: Handles X workflow. Use when Y. Triggers: "x", "y", "z".
allowed-tools: Read, Grep, Glob
---

# Example Skill

## Workflow
1. Gather inputs.
2. Run scoped search.
3. Apply change.
4. Validate and summarize.
```

## 2) Compact agent template

```markdown
---
name: example-agent
description: Focused specialist for X tasks.
allowed-tools: Read, Edit, Grep, Glob
model: sonnet
---

<role>
You handle X tasks with minimal context.
</role>

<instructions>
1. Confirm scope.
2. Make smallest safe change.
3. Validate.
</instructions>

<constraints>
- Do not broaden scope without explicit request.
- Do not skip validation.
</constraints>
```

## 3) Hook policy snippet

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "python3 scripts/policy_check.py"
          }
        ]
      }
    ]
  }
}
```

## 4) GitHub custom agent frontmatter (compatible subset)

```yaml
---
name: test-planner
description: Creates test plans and implementation checklists.
tools: ["read", "search", "edit"]
---
```

## 5) Output summary template

```text
SCOPE:
- what was changed

FILES:
- path/to/file

VALIDATION:
- command: result

RISKS:
- residual risk
```
