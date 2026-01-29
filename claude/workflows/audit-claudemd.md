# Audit CLAUDE.md Workflow

## Objective

Score an existing CLAUDE.md file against the quality rubric (100 points total)
and provide actionable improvement recommendations.

## Process

### Step 1: File Collection and Level Detection

Ask user for path to CLAUDE.md file.

Detect level:

- `~/.claude/CLAUDE.md` → **USER-LEVEL** (<60 lines, cross-project universal)
- `./CLAUDE.md` → **PROJECT-LEVEL** (<300 lines, project-universal)

### Step 2: Run Mechanical Analysis

If analyzer script available:

```bash
npx ts-node ./scripts/analyze.ts <path-to-claudemd>
```

Otherwise, manually count:

- Line count
- XML tags present
- Code blocks
- Aggressive language (NEVER, MUST, CRITICAL, ALWAYS, MANDATORY)
- External file references

### Step 3: Score Each Category

**For USER-LEVEL files:**

- Enforce <60 lines target
- Enforcement section auto-scores 20/20 (not applicable at user-level)
- All content must be cross-project universal

**For PROJECT-LEVEL files, score all 7 categories:**

| Category                            | Max Points | Key Questions                                       |
| ----------------------------------- | ---------- | --------------------------------------------------- |
| Hierarchy & Universal Applicability | 20         | Line count? % universal? Task-specific extracted?   |
| Format Effectiveness                | 20         | % high-efficiency formats? Code examples? XML tags? |
| Instruction Budget                  | 15         | Count <100-150? Redundancy?                         |
| Enforcement Mechanisms              | 20         | Hooks? Managed settings? CI?                        |
| Specificity & Clarity               | 10         | Must/Should markers? Specific paths?                |
| Protected Boundaries                | 10         | Protected areas section? Consequences listed?       |
| Progressive Disclosure              | 5          | Task-specific reference files?                      |

### Step 4: Calculate Total and Grade

| Score  | Grade     | Description                           |
| ------ | --------- | ------------------------------------- |
| 90-100 | Excellent | Production-ready with enforcement     |
| 75-89  | Good      | Solid foundation, minor improvements  |
| 60-74  | Fair      | Functional, missing key optimizations |
| <60    | Poor      | Requires significant restructuring    |

### Step 5: Generate Report

Use this structure:

```markdown
## CLAUDE.md Audit Report

**File**: [path] **Level**: [User/Project] **Date**: [date] **Total Score**:
[X]/100 ([Grade])

### Category Breakdown

| Category                  | Score   | Notes      |
| ------------------------- | ------- | ---------- |
| Hierarchy & Applicability | \_\_/20 | [findings] |
| Format Effectiveness      | \_\_/20 | [findings] |
| Instruction Budget        | \_\_/15 | [findings] |
| Enforcement Mechanisms    | \_\_/20 | [findings] |
| Specificity & Clarity     | \_\_/10 | [findings] |
| Protected Boundaries      | \_\_/10 | [findings] |
| Progressive Disclosure    | \_\_/5  | [findings] |

### Top 3 Priority Improvements

1. **[Issue]** (Impact: High, Effort: Low)
   - Current: [problem]
   - Recommended: [solution]
   - Expected improvement: +[X] points

2. **[Issue]** (Impact: High, Effort: Medium) ...

3. **[Issue]** (Impact: Medium, Effort: Low) ...

### Warning Signs

[Any red flags requiring immediate attention]

### Next Steps

- [ ] [Action 1]
- [ ] [Action 2]
- [ ] [Action 3]
```

### Step 6: Offer Follow-up

Ask user:

- "Would you like me to implement the top priority improvements?"
- "Should I run the Optimize workflow to apply all recommendations?"

## Success Criteria

Audit is complete when:

- All categories scored with justification
- Total score calculated with grade
- Top 3-5 priority actions identified
- Specific line numbers/sections referenced
- User understands clear next steps
