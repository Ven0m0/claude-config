---
name: agent-authoring
description: Rules and patterns for writing agent definitions under claude/agents/. Use when creating or editing .md agent files.
---

# Agent Authoring

Agent definitions live in `claude/agents/` as `hyphenated-name.md` files.

## Required Frontmatter

```yaml
---
name: kebab-case-name        # matches filename without .md
description: one sentence    # ≤512 chars; should make the agent self-select correctly
---
```

## Body Structure

1. **Role** — one sentence defining what this agent does and when to use it
2. **Capabilities** — bullet list of specific things it can do
3. **Constraints** — what it must NOT do (keeps scope tight)
4. **Instructions** — step-by-step behavior, referencing tools by name
5. **Output format** — how responses should be structured

## Quality Rules

- Description must be specific enough that an orchestrator picks it over another agent
- Constraints section is mandatory — omitting it produces agents that overreach
- Do not duplicate behavior already in a skill; reference the skill instead
- Keep the whole file under 400 lines
- No emojis anywhere in the file
- Validate after writing: `uv tool run "claudelint@0.3.3" --strict claude/agents/<name>.md`
