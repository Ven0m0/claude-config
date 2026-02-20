---
description: Extract reusable knowledge into skills - online learning system
model: opus
---

<task>
Extract reusable knowledge from this session into skills. Evaluate what was learned, check for existing skills, and create new ones when valuable patterns are discovered.
</task>

<instructions>

## When to Use

| Trigger | Example |
|---------|---------|
| Non-obvious debugging | Spent 10+ minutes investigating; solution not in docs |
| Misleading errors | Error message pointed wrong direction; found real cause |
| Workarounds | Found limitation and creative solution |
| Tool integration | Figured out undocumented tool/API usage |
| Trial-and-error | Tried multiple approaches before success |
| Repeatable workflow | Multi-step task that will recur |

## Phase 1: Evaluate

<evaluation>
1. "What did I just learn that was not obvious before starting?"
2. "Would future-me benefit from having this documented?"
3. "Was the solution non-obvious from documentation alone?"
4. "Is this a multi-step workflow I'd repeat on similar tasks?"

If no to all, skip extraction.

Quality criteria: reusable, non-trivial, verified (actually worked).
Do not extract: single-step tasks, one-off fixes, knowledge easily found in docs.
</evaluation>

## Phase 2: Check Existing Skills

```bash
ls .claude/skills/ 2>/dev/null
rg -i "keyword" .claude/skills/ 2>/dev/null
```

| Found | Action |
|-------|--------|
| Nothing related | Create new skill |
| Same trigger and fix | Update existing (bump version) |
| Partial overlap | Update existing with new variant |

## Phase 3: Create the Skill

Location: `.claude/skills/[skill-name]/SKILL.md`

<skill_template>
---
name: descriptive-kebab-case-name
description: |
  What the skill does. Specific trigger conditions (exact error messages, symptoms).
  When to use it (contexts, scenarios).
author: Claude Code
version: 1.0.0
---

# Skill Name

## Problem
[Clear description]

## Context / Trigger Conditions
[When to use - exact error messages, symptoms, scenarios]

## Solution
[Step-by-step solution]

## Verification
[How to verify it worked]

## Example
[Concrete example]
</skill_template>

## Phase 4: Quality Gates

<checklist>
- Description contains specific trigger conditions
- Solution verified to work
- Content specific enough to be actionable
- Content general enough to be reusable
- No sensitive information
- Under 500 lines (move large docs to references/)
</checklist>

</instructions>
