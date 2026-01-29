# Claude Code Skills Guide

Skills extend Claude's knowledge with project-specific information and reusable workflows.

## Skill Basics

Skills are Markdown files in `.claude/skills/` directories:

```
.claude/skills/
├── api-conventions/
│   └── SKILL.md
├── testing-patterns/
│   └── SKILL.md
│   └── references/
│       └── examples.md
└── deploy-workflow/
    └── SKILL.md
    └── scripts/
        └── deploy.sh
```

## SKILL.md Structure

### Required Frontmatter

```yaml
---
name: skill-name
description: Brief description of what this skill provides
---
```

### Optional Frontmatter

```yaml
---
name: skill-name
description: Brief description
disable-model-invocation: true  # Manual-only invocation
model: opus                      # Preferred model
tools: Read, Grep, Bash         # Allowed tools
---
```

## Skill Types

### Knowledge Skills

Provide domain knowledge Claude applies automatically when relevant:

```markdown
---
name: api-conventions
description: REST API design conventions for our services
---

# API Conventions

## URL Structure
- Use kebab-case for paths: `/user-profiles/`
- Use camelCase for JSON properties
- Version in URL: `/v1/`, `/v2/`

## Response Format
- Always include `data` wrapper
- Pagination via `cursor` parameter
- Error format: `{ "error": { "code": "...", "message": "..." } }`

## Authentication
- Bearer tokens in Authorization header
- API keys via X-API-Key header
```

### Workflow Skills

Define repeatable processes invoked with `/skill-name`:

```markdown
---
name: fix-issue
description: Fix a GitHub issue end-to-end
disable-model-invocation: true
---

Fix GitHub issue: $ARGUMENTS

## Steps

1. **Fetch issue details**
   ```bash
   gh issue view $ARGUMENTS --json title,body,labels
   ```

2. **Analyze the problem**
   - Read related files mentioned in issue
   - Search codebase for relevant code
   - Identify root cause

3. **Implement fix**
   - Make minimal, focused changes
   - Follow existing patterns

4. **Verify fix**
   - Run tests: `npm test`
   - Run linter: `npm run lint`
   - Manual verification if UI change

5. **Create PR**
   ```bash
   git checkout -b fix/issue-$ARGUMENTS
   git add -A
   git commit -m "Fix #$ARGUMENTS: <description>"
   gh pr create --fill
   ```
```

### Reference Skills

Include supporting materials in subdirectories:

```
.claude/skills/testing-patterns/
├── SKILL.md
├── references/
│   ├── unit-test-examples.md
│   ├── integration-patterns.md
│   └── mocking-guide.md
└── scripts/
    └── test-helper.sh
```

Reference in SKILL.md:

```markdown
---
name: testing-patterns
description: Testing conventions and patterns
---

# Testing Patterns

See @references/unit-test-examples.md for examples.
See @references/mocking-guide.md for mocking patterns.

Run helper: @scripts/test-helper.sh
```

## Skill Invocation

### Automatic (Knowledge Skills)

Claude automatically applies relevant skills based on context.

### Manual (Workflow Skills)

Invoke with slash command:

```
/fix-issue 1234
/deploy production
/code-review src/auth/
```

## Best Practices

### Keep Skills Focused

```markdown
# GOOD: Focused skill
---
name: database-migrations
description: Database migration patterns for PostgreSQL
---

# BAD: Too broad
---
name: backend-everything
description: All backend development practices
---
```

### Use Action Verbs for Workflows

```markdown
# Good names
fix-issue
deploy-service
review-code
generate-api-client

# Avoid
issue-fixer
deployment
code-review-helper
```

### Include Verification Steps

```markdown
## Steps

1. Make changes
2. **Verify** (IMPORTANT)
   - Run tests
   - Check linter
   - Manual smoke test
3. Commit
```

### Reference External Docs

```markdown
For API documentation, see: https://api.example.com/docs

Use Context7 for library docs:
- Resolve library: `mcp__context7__resolve_library_id`
- Get docs: `mcp__context7__get_library_docs`
```

## Skill Discovery

### List Available Skills

```
/skill
```

### Search Skills

```
/skill search testing
```

### View Skill Content

```
/skill show api-conventions
```

## Debugging Skills

### Skill Not Loading

1. Verify frontmatter syntax (YAML)
2. Check file location (`.claude/skills/*/SKILL.md`)
3. Verify `name` is unique
4. Check `description` is present

### Skill Not Applied Automatically

1. Ensure `disable-model-invocation` is not set
2. Description should match relevant contexts
3. Keep skill focused on specific domain

### Workflow Not Executing

1. Check `$ARGUMENTS` placeholder usage
2. Verify script permissions (`chmod +x`)
3. Test scripts independently first

## Advanced Patterns

### Conditional Logic

```markdown
## Deployment Steps

If `$ARGUMENTS` is "production":
  - Require manual approval
  - Run full test suite
  - Deploy with zero-downtime

If `$ARGUMENTS` is "staging":
  - Auto-deploy after tests
  - Skip manual approval
```

### Multi-Step Workflows

```markdown
---
name: feature-complete
description: Complete feature development workflow
disable-model-invocation: true
---

# Feature Completion: $ARGUMENTS

## Phase 1: Implementation
1. Implement feature
2. Write unit tests
3. Verify locally

## Phase 2: Review
1. Self-review changes
2. Run security scan
3. Update documentation

## Phase 3: Integration
1. Create PR
2. Address review comments
3. Merge when approved
```

### Skill Composition

Reference other skills within workflows:

```markdown
## Code Review Phase

Apply the following skills:
- @.claude/skills/security-review/SKILL.md
- @.claude/skills/performance-review/SKILL.md
```
