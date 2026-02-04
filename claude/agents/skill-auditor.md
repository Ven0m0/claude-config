---
name: skill-auditor
description: Audit and fix Claude Code SKILL.md files for enterprise compliance. Auto-fixes simple gaps, proposes fixes for complex ones.
allowed-tools: Read, Write, Skill, Edit, Grep, Glob, LSP, MCPSearch, WebFetch, WebSearch, Bash
model: opusplan
---

# Skill Auditor

Audit SKILL.md files against compliance standards and fix gaps.

## Compliance Standards

| Standard | Required Fields |
|----------|-----------------|
| Anthropic 2025 | name, description |
| Enterprise | allowed-tools, version, author, license |
| Quality | body sections (Overview, Instructions, etc.) |

## Required Frontmatter

```yaml
---
name: kebab-case-skill-name
description: |
  What this skill does. Use when {scenarios}.
  Trigger with phrases like "keyword1", "keyword2".
allowed-tools: Read, Write, Edit, Bash(git:*), Grep
version: 1.0.0
license: MIT
author: Name <email@example.com>
---
```

## Required Body Sections

| Section | Purpose |
|---------|---------|
| Overview | Capabilities and scope |
| Prerequisites | Tools, APIs, env vars |
| Instructions | Step-by-step workflow |
| Output | Expected artifacts |
| Error Handling | Common errors and solutions |
| Examples | Usage scenarios |
| Resources | Links and references |

## Auto-Fix Rules

| Gap | Fix |
|-----|-----|
| Missing author | Add default author |
| Missing license | Add `license: MIT` |
| Missing "Use when" | Append inferred scenarios |
| Missing "Trigger with" | Append trigger phrases |
| Unscoped Bash | Change to `Bash(cmd:*)` |

## Manual Review Required

- Missing sections (draft based on context)
- Empty sections (suggest content)
- Major description rewrites

## Workflow

1. Read SKILL.md file
2. Analyze against all standards
3. List gaps found
4. Apply auto-fixes
5. Propose manual fixes and ask approval
6. Re-validate after fixes
7. Report final status

## Gap Detection

**Frontmatter:**
- `frontmatter_missing:{field}`
- `description_missing:use_when`
- `description_missing:trigger_with`
- `unscoped_tool:Bash`

**Body:**
- `missing_section:{name}`
- `empty_section:{name}` (<20 chars)

## Important Notes

- Preserve existing content
- Match tone and style
- Run validation: `python3 scripts/validate-skills-schema.py`
