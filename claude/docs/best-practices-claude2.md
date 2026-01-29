# CLAUDE.md Best Practices

> **Last Updated**: 2026-01-15
> **Sources**: Anthropic official docs, GitHub research (2,500+ repos), Claude 4.5 prompt engineering

This is a **canonical document** - research agents update it incrementally rather than rebuilding.

---

## Core Principles

### 1. Structure & Length
- **Under 300 lines ideal**, under 500 acceptable
- Use XML tags for machine parseability (`<coding_guidelines>`, `<boundaries>`, etc.)
- Tables and bullets over dense prose for scanability
- Extract detailed content to module files, keep main file lean

### 2. Content Quality
- **One code example beats paragraphs of explanation**
- Include commands with flags, not just tool names
- Specify exact versions (e.g., "Next.js 16", not "Next.js")
- Add "Why" context - Claude generalizes from motivation

### 3. Boundaries (Critical)
GitHub research found the **Always/Ask/Never** structure significantly improves AI behavior:
```markdown
### ✅ Always Do
- [Required action with reason]

### ⚠️ Ask First
- [Protected action] — [why confirmation needed]

### ❌ Avoid
- [Action to avoid] (consequence)
```

### 4. Claude 4.5 Optimization
- **Avoid aggressive triggers**: NEVER, MUST, CRITICAL, ALWAYS, MANDATORY
- Claude Opus 4.5 over-responds to urgent language
- Use **positive framing**: "Use X when..." not "Don't use Y"
- Provide **motivation/context** for rules

### 5. Token Efficiency
- No redundant instructions between global and project files
- Use file hierarchy: global → project → directory
- Extract detailed sections to linked modules
- Every line should earn its place

---

## Recommended Sections

Based on GitHub's analysis of high-performing instruction files:

| Section | Priority | Description |
|---------|----------|-------------|
| Boundaries | High | Always/Ask/Never action tiers |
| Commands | High | Executable commands with flags |
| Tech Stack | High | Versions and key technologies |
| Code Style | Medium | With real code examples |
| Git Workflow | Medium | Branch strategy, commit format |
| Testing | Medium | Framework-specific requirements |
| Project Structure | Low | Directory organization |

---

## Anti-Patterns to Avoid

| Anti-Pattern | Impact | Solution |
|--------------|--------|----------|
| Aggressive language (15+ NEVER/MUST) | Over-cautious AI behavior | Soften with positive framing |
| Rules without "Why" | Poor generalization | Add brief motivation |
| No boundaries section | Unclear action limits | Add Always/Ask/Never |
| Monolithic file (500+ lines) | Token waste, ignored rules | Extract to modules |
| Duplicate instructions | Context dilution | Use hierarchy |
| Vague constraints | Inconsistent behavior | Specific, actionable guidance |
| Static "set and forget" | Outdated guidance | Iterate like production code |

---

## Language Patterns

### Aggressive → Softer

| Avoid | Use Instead |
|-------|-------------|
| "NEVER push to master" | "Direct pushes blocked by pre-push hook" |
| "CRITICAL: NEVER assume" | "Verify in browser/console before diagnosing" |
| "ALWAYS use X" | "X is the default approach" |
| "YOU MUST run tests" | "Run tests before commits" |
| "MANDATORY" | "Required" or state consequence |

### Adding "Why" Context

| Rule Only | With Motivation |
|-----------|-----------------|
| "Server Components default" | "...reduces bundle, improves SEO, enables streaming" |
| "No `any` types" | "...catches bugs at compile time, enables autocomplete" |
| "Use semantic tokens" | "...enables theme consistency, simplifies updates" |
| "Use `getUser()`" | "...returns null safely, handles expired sessions" |

---

## Research Log

### 2026-01-15 - Initial Compilation
**Sources consulted:**
- Anthropic Claude Code best practices blog
- GitHub's "How to write a great agents.md" (2,500+ repos)
- Arize AI optimization research
- Cursor documentation
- Community patterns (GitHub issues, blog posts)

**Key findings:**
- Three-tier boundaries (Always/Ask/Never) significantly improve behavior
- Aggressive language causes over-triggering in Opus 4.5
- "Why" context improves generalization
- Under 300 lines optimal for attention
- One example > multiple paragraphs

---

## Update Instructions

When updating this document:
1. **Add new findings** to relevant sections
2. **Don't remove** existing guidance unless contradicted
3. **Flag contradictions** for human review
4. **Add entry** to Research Log with date and sources
5. **Update** the Last Updated date in header
