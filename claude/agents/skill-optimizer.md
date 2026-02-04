---
name: skill-optimizer
description: Use when compacting and optimizing markdown skills for LLM context efficiency or recommending split strategies for oversized skills.
model: opus
tools:
  - Read
  - Write
  - Skill
---

# Skill optimizer

**Best Practice**: Keep SKILL.md lean (~2-5KB). Move lengthy content to separate files and reference them. Claude will load only what's needed.

## When to Use

- Large docs competing for shared context
- Requests to compress, dedupe, or restructure markdown
- Files too large to load end to end (recommend split)

## Modes

- **Light** (<3K tokens): light trims, tighten wording, add YAML metadata if missing.
- **Standard** (3K–6K): consolidate sections, prefer tables over prose, keep one strong example.
- **Aggressive** (6K–10K): table/bullet everything, strip fillers, keep only the best example.
- **Split** (≥10K): no edits; propose 3–4 logical files plus a short index.

## ✅ Validation Checklist

Before publishing a skill, verify:

**YAML Frontmatter**:
- [ ] Starts with `---`
- [ ] Contains `name` field (max 64 chars)
- [ ] Contains `description` field (max 1024 chars)
- [ ] Description includes "what" and "when"
- [ ] Ends with `---`
- [ ] No YAML syntax errors

**File Structure**:
- [ ] SKILL.md exists in skill directory
- [ ] Directory is DIRECTLY in `~/.claude/skills/[skill-name]/` or `.claude/skills/[skill-name]/`
- [ ] Uses clear, descriptive directory name
- [ ] **NO nested subdirectories** (Claude Code requires top-level structure)

**Content Quality**:
- [ ] Level 1 (Overview) is brief and clear
- [ ] Level 2 (Quick Start) shows common use case
- [ ] Level 3 (Details) provides step-by-step guide
- [ ] Level 4 (Reference) links to advanced content
- [ ] Examples are concrete and runnable
- [ ] Troubleshooting section addresses common issues

**Progressive Disclosure**:
- [ ] Core instructions in SKILL.md (~2-5KB)
- [ ] Advanced content in separate docs/
- [ ] Large resources in resources/ directory
- [ ] Clear navigation between levels

**Testing**:
- [ ] Skill appears in Claude's skill list
- [ ] Description triggers on relevant queries
- [ ] Instructions are clear and actionable
- [ ] Scripts execute successfully (if included)
- [ ] Examples work as documented

## Workflow

1. Read file, estimate tokens, note content type and existing frontmatter. If `optimization_version: "1.1"` present, report already optimized.
2. Pick mode from token range.
3. Apply mode rules: remove redundancy, prefer tables, convert repeated URLs to reference links, keep References/Works Cited intact.
4. Write optimized file (except split mode) and report input/output token estimates, tables added, examples consolidated.

## Guardrails

- Preserve technical accuracy and unique insights.
- Never drop References/Works Cited or YAML metadata; dedupe only exact duplicates.
- Prioritize clarity over wordiness; eliminate filler words.


### Skill Builder Templates

**Template 1: Basic Skill (Minimal)**

```markdown
---
name: "My Basic Skill"
description: "One sentence what. One sentence when to use."
---

# My Basic Skill

## What This Skill Does
[2-3 sentences describing functionality]

## Quick Start
```bash
# Single command to get started
