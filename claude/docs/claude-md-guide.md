# CLAUDE.md Authoring Guide

Best practices, examples, and scoring rubric for CLAUDE.md files.

## Key Principles

- **Concise**: Target <300 lines (ideal <100)
- **Grounded**: All claims verifiable in codebase
- **Progressive disclosure**: Reference docs instead of embedding
- **Pointers not copies**: Reference files, don't duplicate code
- **Delegate to tools**: Don't embed linting rules - let Biome/ESLint handle it
- **Universal applicability**: Only always-relevant guidance

## Good Example (87 lines)

```markdown
# Project Context

This is a React 18 + TypeScript web application for task management.

**Tech Stack:**
- React 18.2 with functional components + hooks (see `package.json:12-13`)
- TypeScript 5.3 (see `tsconfig.json`)
- Vite 5.x for build tooling (see `vite.config.ts`)
- Zustand for state management (see `src/store/`)

## Project Structure

src/
--- components/     # React components
--- hooks/          # Custom hooks (ALWAYS follow patterns here)
--- store/          # Zustand state slices
--- api/            # API client and endpoints
--- types/          # TypeScript type definitions

See `docs/architecture.md` for detailed architecture decisions.

## Key Commands

npm run dev           # Start dev server
npm test              # Unit tests with Vitest
npm run test:e2e      # E2E tests with Playwright

## Important Patterns

**Custom Hooks:** ALWAYS follow patterns in `src/hooks/` directory
**State:** Use Zustand slices (see `src/store/tasks.ts`)
**API:** All calls through React Query hooks
**Components:** Functional only, props interface in same file

## Key Principles

- TypeScript strict mode enabled - fix type errors, don't use `any`
- DO NOT suggest code style changes - Biome handles this automatically
```

## Anti-Patterns

- Style rules that duplicate linter config
- Code templates that go stale
- Duplicating OpenAPI specs or README content
- Documenting aspirational/unimplemented features
- Obsolete file paths
- Over-instruction (>200 directives)

## Scoring Rubric (100 Points)

### Structure and Organization (25 pts)

| Criterion | Points | Scoring |
|-----------|--------|---------|
| Length optimization | 5 | <250: 5, 250-300: 4, 300-400: 3, 400-500: 2, >500: 1 |
| XML tag usage | 5 | 4+ tags: 5, 2-3: 3, 1: 2, 0: 0 |
| Section hierarchy | 5 | Clear headers, logical flow, good grouping |
| Modular references | 5 | Links to external files for detailed content |
| Scanability | 5 | Tables/bullets vs prose ratio, visual clarity |

### Content Quality (25 pts)

| Criterion | Points | Scoring |
|-----------|--------|---------|
| Concrete examples | 5 | Code blocks with real patterns |
| Commands with flags | 5 | Complete, executable commands |
| Version specificity | 5 | Explicit tech versions present |
| "Why" context | 5 | Motivation phrases for decisions |
| Decision guidance | 5 | Decision matrices, quick reference tables |

### Boundary Definition (20 pts)

| Criterion | Points | Scoring |
|-----------|--------|---------|
| Always/Ask/Never tiers | 10 | Explicit section with all three tiers |
| Protected areas | 5 | Files/paths with clear restrictions |
| Workflow gates | 5 | Required checkpoints (pre-commit, etc.) |

### Claude 4.x Optimization (15 pts)

| Criterion | Points | Scoring |
|-----------|--------|---------|
| Avoiding aggressive triggers | 5 | 0 instances: 5, 1-3: 4, 4-7: 3, 8-12: 2, 13+: 1 |
| Positive framing | 5 | "Do X" over "Don't do Y" |
| Context for motivation | 5 | Rules include reasoning |

### Token Efficiency (15 pts)

| Criterion | Points | Scoring |
|-----------|--------|---------|
| No redundancy | 5 | No repeated instructions |
| Essential content only | 5 | Every line earns its place |
| Hierarchy utilization | 5 | Proper global vs project vs directory split |

### Star Rating

| Score | Rating |
|-------|--------|
| 90-100 | Excellent - follows all best practices |
| 80-89 | Good - minor improvements possible |
| 70-79 | Adequate - several areas need work |
| 60-69 | Needs Work - significant issues |
| <60 | Poor - major restructuring needed |

## Verification Checklist

- [ ] Under 300 lines (ideally <100)
- [ ] All file paths exist
- [ ] All commands work
- [ ] All dependencies are accurate
- [ ] No code duplication
- [ ] No style policing (delegate to linters)
- [ ] Uses progressive disclosure
- [ ] References actual files
- [ ] No invented features

---

## Skill Best Practices

### For Users

**Activation:**
- Use clear trigger phrases matching skill descriptions
- Provide sufficient context (file paths, scope, constraints)
- Check allowed-tools in frontmatter

**Workflow:**
- Start simple, build up to complex
- Verify each step before proceeding

### For Developers

**Development Guidelines:**
- Include explicit trigger phrases in descriptions
- Use minimal necessary tools
- Document security implications
- Provide usage examples

**Performance:**
- Scope skills to specific domains
- Keep descriptions under 1024 chars
- Avoid overlapping trigger phrases

**Security:**
- Never include secrets in skill files
- Validate all inputs
- Use read-only tools when possible
