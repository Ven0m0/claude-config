# Skill Optimization Reference

Detailed patterns for optimizing Claude Code skills using the three-level content loading architecture.

## Three-Level Loading Architecture

### Level 1: Metadata (~100 tokens/skill, always loaded)

YAML frontmatter loaded at startup into system prompt. Enables discovery without context overhead.

**Optimization target**: Description field — max 1024 chars, must include all trigger keywords.

```yaml
# Optimized description example
description: |
  Database development for PostgreSQL: schema design, migrations, RLS policies,
  indexing, privacy patterns, query optimization, Prisma ORM. Use when working
  with tables, columns, indexes, migrations, RLS, Row-Level Security, database
  schema, SQL queries, Prisma schema, database optimization.
```

### Level 2: Instructions (<5K tokens, loaded when triggered)

SKILL.md body loaded when request matches description. Contains workflows and guidance.

**What stays**: Purpose, quick start, critical practices, brief examples (5-10 lines), cross-references.

**What moves out**: API docs, extensive examples, troubleshooting, pattern libraries, schemas.

### Level 3: Resources (on-demand, no startup cost)

Additional files loaded only when referenced. Scripts execute without entering context.

**File types**: REFERENCE.md, EXAMPLES.md, PATTERNS.md, scripts/*.sh, templates/*.md

## Extraction Patterns

### Pattern 1: Extract API Documentation

**Before**: 80+ lines of API docs in SKILL.md
**After**: 10-line summary with link

```markdown
## API Overview
Key methods: `create()`, `update()`, `delete()`, `query()`.
All return Promises. Auth required for write operations.

**Complete API reference**: [REFERENCE.md](REFERENCE.md#api-reference)
```

**Savings**: ~70 lines (~1,400 tokens)

### Pattern 2: Extract Pattern Library

**Before**: 200+ lines of code patterns in SKILL.md
**After**: 18-line summary with one quick example

```markdown
## Common Patterns

**Quick example** — error handling:
```python
try:
    result = client.query(sql)
except QueryError as e:
    logger.error(f"Query failed: {e}")
    raise
```

**Full pattern library**: [PATTERNS.md](PATTERNS.md)
```

**Savings**: ~182 lines (~3,640 tokens)

### Pattern 3: Extract Troubleshooting

**Before**: 300+ lines of debug guides in SKILL.md
**After**: Quick diagnostic table with link

```markdown
## Troubleshooting

| Symptom | Quick Fix |
|---------|-----------|
| Connection refused | Check host/port, verify service running |
| Auth failed | Verify credentials, check token expiry |
| Timeout | Increase timeout, check network, reduce payload |

**Detailed troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
```

**Savings**: ~282 lines (~5,640 tokens)

### Pattern 4: Convert Code to Scripts

**Before**: 55+ lines of bash in SKILL.md
**After**: 7-line reference

```markdown
## Validation
Run the validation script:
```bash
./scripts/validate.sh [target-directory]
```
**Savings**: ~48 lines (~960 tokens) + script never enters context

## Migration Workflow

### Phase 1: Discovery
```bash
# Check current size
wc -l .claude/skills/skill-name/SKILL.md

# List sections
grep "^##" .claude/skills/skill-name/SKILL.md

# Estimate tokens
lines=$(wc -l < SKILL.md); echo "$((lines * 20)) estimated tokens"
```

### Phase 2: Planning
- Identify sections >50 lines → extraction candidates
- Design target file hierarchy
- Plan content distribution (main vs reference)

### Phase 3: Implementation
1. Create reference files: `touch REFERENCE.md EXAMPLES.md && mkdir -p scripts`
2. For each extraction candidate:
   - Copy section content to appropriate reference file
   - Replace in SKILL.md with summary + link
   - Verify cross-reference works
3. Move executable code to `scripts/` with `chmod +x`

### Phase 4: Optimization
- Trim remaining SKILL.md content (tables over prose)
- Enrich YAML description with all trigger keywords
- Add ToC to reference files >100 lines

### Phase 5: Validation
```bash
# Must be under 500 lines
wc -l SKILL.md

# Verify all cross-references resolve
grep -oP '\[.*?\]\(.*?\.md.*?\)' SKILL.md | while read link; do
  file=$(echo "$link" | grep -oP '\(.*?\)' | tr -d '()')
  [ -f "$file" ] || echo "BROKEN: $link"
done
```

## YAML Description Optimization

### Include in Description
- What the skill does (capabilities)
- When to use it (trigger scenarios)
- Key technologies and file types
- Common action verbs users would say
- Related concept names

### Description Template
```yaml
description: |
  [What it does] for [technology/domain]: [capability list].
  Use when [trigger scenario 1], [trigger scenario 2], [trigger scenario 3],
  or when working with [file types/technologies]. Covers [topic 1],
  [topic 2], [topic 3].
```

### Anti-Pattern Descriptions
```yaml
# Too vague
description: Helps with documents.

# Missing triggers
description: Optimizes code for better performance.

# Too long (over 1024 chars)
description: |
  This comprehensive skill provides extensive functionality for...
  [500 more chars of unnecessary detail]
```

## Token Estimation

```bash
# Quick estimate: ~20 tokens per line
lines=$(wc -l < SKILL.md)
echo "~$((lines * 20)) tokens"

# More accurate: ~4 chars per token for English
chars=$(wc -c < SKILL.md)
echo "~$((chars / 4)) tokens"
```

## Quality Checklist

### Content Structure
- [ ] SKILL.md ≤500 lines
- [ ] Main file = quick reference only
- [ ] Detailed docs in reference files
- [ ] Reference files have ToC if >100 lines
- [ ] Cross-references use relative links
- [ ] No nested references (max 1 level deep)

### YAML Frontmatter
- [ ] Description includes all trigger keywords
- [ ] Description ≤1024 characters
- [ ] Description covers use cases and scenarios
- [ ] Name follows kebab-case convention
- [ ] Third-person voice in description

### Progressive Disclosure
- [ ] Overview → details pattern used
- [ ] Quick examples in main file (5-10 lines)
- [ ] Extensive examples in EXAMPLES.md
- [ ] Brief summaries with references to details

### Token Efficiency
- [ ] Tables preferred over prose
- [ ] No duplicate information across files
- [ ] Large code blocks in reference files
- [ ] Reusable code in scripts/ directory
