# Optimize CLAUDE.md Workflow

## Objective

Apply research-backed best practices to improve an existing CLAUDE.md file's
effectiveness and score.

## Process

### Step 1: Initial Assessment

1. Read the existing file
2. Run audit workflow (quick score) or estimate current state
3. Identify major optimization opportunities

### Step 2: Apply Core Optimizations

#### 2.1 Length Optimization

| Current    | Target   | Action                           |
| ---------- | -------- | -------------------------------- |
| >500 lines | <300     | Aggressive extraction to modules |
| 300-500    | <300     | Moderate extraction              |
| <300       | Maintain | Focus on other improvements      |

**Extraction targets:**

- Detailed command documentation → `agent_docs/commands.md`
- API documentation → `agent_docs/api-reference.md`
- Testing guides → `agent_docs/testing.md`
- Architecture details → `agent_docs/architecture.md`

#### 2.2 Format Conversion

Convert prose to high-efficiency formats:

| From                   | To            | Efficiency Gain |
| ---------------------- | ------------- | --------------- |
| Comparison paragraphs  | Tables        | 5x              |
| Explanation paragraphs | Bullets       | 3x              |
| Pattern descriptions   | Code examples | 10x             |
| Critical rules         | XML tags      | 10x + parsing   |

#### 2.3 Add XML Tags for Critical Sections

```markdown
<system_context> [Tech stack, versions] </system_context>

<coding_guidelines> [Core coding rules] </coding_guidelines>

<boundaries>
[Protected areas, restrictions]
</boundaries>
```

#### 2.4 Add Boundaries Section

If missing, create Always/Ask/Never structure:

```markdown
## Boundaries

### Always Do

- [Required action with reason]

### Ask First

- [Protected action] — [why confirmation needed]

### Avoid

- [Action to avoid] (consequence)
```

### Step 3: Language Optimization (Opus 4.5+)

Replace aggressive triggers:

| Find                 | Replace      |
| -------------------- | ------------ |
| `CRITICAL: You MUST` | `Must`       |
| `ALWAYS call`        | `Call`       |
| `NEVER skip`         | `Don't skip` |
| `YOU MUST`           | `Must`       |
| `MANDATORY`          | `Required`   |

### Step 4: Add Over-Engineering Prevention

If not present, add:

```markdown
<coding_guidelines>

- Avoid over-engineering. Only make changes directly requested or clearly
  necessary
- Don't add features, refactor code, or make "improvements" beyond what was
  asked
- Don't add error handling for scenarios that can't happen
- Don't create abstractions for one-time operations </coding_guidelines>
```

### Step 5: Add Code Exploration Requirements

If not present, add:

```markdown
<code_exploration> Read and understand relevant files before proposing code
edits. Don't speculate about code you haven't inspected. If referencing a
specific file/path, inspect it before explaining or proposing fixes.
</code_exploration>
```

### Step 6: Verify Constraints

Checklist:

- [ ] Line count <300 (ideally <200)
- [ ] Instruction count <100-150
- [ ] 80%+ high-efficiency formats
- [ ] All instructions project-universal
- [ ] Critical context in first 30 lines
- [ ] Must/Should markers consistent
- [ ] No ALL CAPS emphasis

### Step 7: Write Optimized File

Apply all changes and save.

### Step 8: Generate Optimization Report

```markdown
## Optimization Report

**File**: [path] **Date**: [date]

### Changes Applied

| Change              | Before | After |
| ------------------- | ------ | ----- |
| Line count          | [X]    | [Y]   |
| XML tags            | [X]    | [Y]   |
| Aggressive language | [X]    | 0     |
| Format efficiency   | [X%]   | [Y%]  |

### Sections Added/Modified

- [List of changes]

### Estimated Score Improvement

Before: ~[X]/100 → After: ~[Y]/100

### Recommended Next Steps

1. Setup enforcement (run Setup workflow)
2. Test with real coding task
3. Re-audit in 1 week
```

### Step 9: Offer Follow-up

Ask user:

- "Would you like me to setup enforcement mechanisms?"
- "Should I create the progressive disclosure file structure?"

## Success Criteria

Optimization is complete when:

- File <300 lines
- 80%+ high-efficiency formats
- All aggressive language softened
- Over-engineering prevention present
- Code exploration requirements present
- User satisfied with changes
