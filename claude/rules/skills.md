# Skills Rules

## Skill Structure

### Required Elements

Every SKILL.md must have:

```yaml
---
name: skill-name          # Unique, kebab-case
description: Brief desc   # What the skill provides
---
```

### Optional Frontmatter

```yaml
---
name: skill-name
description: Brief description
disable-model-invocation: true  # Manual only
model: opus                      # Preferred model
tools: Read, Grep, Bash         # Tool restrictions
---
```

## Naming Conventions

### Skill Names

```markdown
# GOOD: Action-oriented
fix-issue
deploy-service
review-code
generate-docs

# BAD: Noun-based
issue-fixer
deployment-helper
code-reviewer
```

### File Organization

```
.claude/skills/
├── skill-name/
│   ├── SKILL.md           # Required
│   ├── references/        # Optional supporting docs
│   │   └── examples.md
│   └── scripts/           # Optional helper scripts
│       └── helper.sh
```

## Skill Types

### Knowledge Skills (Auto-Applied)

For domain knowledge Claude applies automatically:

```markdown
---
name: api-conventions
description: REST API conventions for this project
---

# API Conventions
- Use kebab-case for URLs
- Use camelCase for JSON
- Always paginate lists
```

**Don't set `disable-model-invocation`** - let Claude apply automatically.

### Workflow Skills (Manual)

For repeatable processes:

```markdown
---
name: fix-issue
description: Fix a GitHub issue end-to-end
disable-model-invocation: true
---

Fix issue: $ARGUMENTS

1. Get issue: `gh issue view $ARGUMENTS`
2. Analyze and implement
3. Test thoroughly
4. Create PR
```

**Set `disable-model-invocation: true`** for workflows with side effects.

## Content Guidelines

### Be Concise

```markdown
# GOOD: Direct instructions
Use `rg` for search, not `grep`.
Run `uv pip install` for Python dependencies.

# BAD: Verbose explanations
When you need to search through files, you should consider
using ripgrep (rg) because it's faster and has better defaults
than traditional grep...
```

### Include Verification

```markdown
## Steps
1. Make changes
2. **Verify** (REQUIRED)
   - Run: `npm test`
   - Run: `npm run lint`
   - Check: No console.log statements
3. Commit
```

### Use `$ARGUMENTS` Placeholder

```markdown
---
name: review-file
description: Review a specific file
disable-model-invocation: true
---

Review file: $ARGUMENTS

1. Read $ARGUMENTS
2. Check for issues
3. Suggest improvements
```

## Reference Management

### Local References

```markdown
See @references/patterns.md for examples.
Run @scripts/helper.sh for setup.
```

### External References

```markdown
For React docs, use Context7:
1. `mcp__context7__resolve_library_id("react")`
2. `mcp__context7__get_library_docs(id, "hooks")`
```

## Tool Restrictions

### Read-Only Skills

```yaml
tools: Read, Grep, Glob
```

### Modification Skills

```yaml
tools: Read, Grep, Edit, Bash
```

### Full Access

```yaml
tools: Read, Grep, Glob, Edit, Write, Bash, Task
```

## Best Practices

### Single Responsibility

```markdown
# GOOD: Focused skill
---
name: database-migrations
description: PostgreSQL migration patterns
---

# BAD: Kitchen sink
---
name: backend-development
description: Everything about backend
---
```

### Progressive Detail

```markdown
# Quick reference at top
Key commands:
- Build: `npm run build`
- Test: `npm test`

# Details below
## Build System
[Detailed explanation...]
```

### Keep Updated

```markdown
# Review skills when:
- Project conventions change
- New tools are adopted
- Patterns evolve
- Feedback indicates confusion
```

## Debugging Skills

### Skill Not Loading

1. Check YAML frontmatter syntax
2. Verify file path: `.claude/skills/*/SKILL.md`
3. Ensure `name` is unique across all skills
4. Check `description` exists and is meaningful

### Skill Not Auto-Applied

1. Don't set `disable-model-invocation`
2. Make `description` match relevant contexts
3. Keep skill focused (broad skills get ignored)

### Workflow Not Executing

1. Check `$ARGUMENTS` usage
2. Verify script permissions
3. Test scripts independently
4. Check tool permissions

## Skill Discovery

```markdown
/skill                    # List all skills
/skill search testing     # Search skills
/skill show skill-name    # View skill content
```

## Version Control

### Commit Skills

```bash
git add .claude/skills/
git commit -m "Add/update skill-name skill"
```

### Share with Team

Skills in project `.claude/skills/` are automatically shared when committed.

### Personal Skills

Put personal skills in `~/.claude/skills/` (not committed).
