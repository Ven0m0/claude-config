# CLAUDE.md Scoring Rubric (100 Points)

Use this rubric to evaluate CLAUDE.md files. Some criteria can be scored mechanically (marked with 🔧), others require AI judgment (marked with 🧠).

---

## Structure & Organization (25 pts)

| Criterion | Points | Scoring | Type |
|-----------|--------|---------|------|
| Length optimization | 5 | <250 lines: 5, 250-300: 4, 300-400: 3, 400-500: 2, >500: 1 | 🔧 |
| XML tag usage | 5 | 4+ semantic tags: 5, 2-3: 3, 1: 2, 0: 0 | 🔧 |
| Section hierarchy | 5 | Clear headers, logical flow, good grouping | 🧠 |
| Modular references | 5 | Links to external files for detailed content | 🔧 |
| Scanability | 5 | Tables/bullets vs prose ratio, visual clarity | 🧠 |

**Mechanical calculation:**
```
lengthScore = lineCount < 250 ? 5 : lineCount < 300 ? 4 : lineCount < 400 ? 3 : lineCount < 500 ? 2 : 1
xmlScore = xmlTags.length >= 4 ? 5 : xmlTags.length >= 2 ? 3 : xmlTags.length >= 1 ? 2 : 0
modularScore = links.length >= 3 ? 5 : links.length >= 1 ? 3 : 0
```

---

## Content Quality (25 pts)

| Criterion | Points | Scoring | Type |
|-----------|--------|---------|------|
| Concrete examples | 5 | Code blocks with real patterns | 🔧/🧠 |
| Commands with flags | 5 | Complete, executable commands | 🧠 |
| Version specificity | 5 | Explicit tech versions present | 🔧 |
| "Why" context | 5 | Motivation phrases (count heuristic + judgment) | 🔧/🧠 |
| Decision guidance | 5 | Decision matrices, quick reference tables | 🧠 |

**Mechanical hints:**
```
exampleScore = codeBlocks >= 3 ? 5 : codeBlocks >= 1 ? 3 : 0
whyScore = whyContextCount >= 5 ? 5 : whyContextCount >= 2 ? 3 : whyContextCount >= 1 ? 2 : 0
```

---

## Boundary Definition (20 pts)

| Criterion | Points | Scoring | Type |
|-----------|--------|---------|------|
| Always/Ask/Never tiers | 10 | Explicit section with all three tiers | 🔧/🧠 |
| Protected areas | 5 | Files/paths with clear restrictions | 🧠 |
| Workflow gates | 5 | Required checkpoints (pre-commit, etc.) | 🧠 |

**Mechanical hints:**
```
boundariesScore = hasBoundariesSection ? 7 : hasProtectedAreas ? 4 : 0
// Add 3 points via AI judgment for quality of boundaries
```

---

## Claude 4.5 Optimization (15 pts)

| Criterion | Points | Scoring | Type |
|-----------|--------|---------|------|
| Avoiding aggressive triggers | 5 | 0 instances: 5, 1-3: 4, 4-7: 3, 8-12: 2, 13+: 1 | 🔧 |
| Positive framing | 5 | "Do X" over "Don't do Y" | 🧠 |
| Context for motivation | 5 | Rules include reasoning | 🧠 |

**Mechanical calculation:**
```
aggressiveScore = count == 0 ? 5 : count <= 3 ? 4 : count <= 7 ? 3 : count <= 12 ? 2 : 1
```

---

## Token Efficiency (15 pts)

| Criterion | Points | Scoring | Type |
|-----------|--------|---------|------|
| No redundancy | 5 | No repeated instructions | 🧠 |
| Essential content only | 5 | No nice-to-haves, every line earns its place | 🧠 |
| Hierarchy utilization | 5 | Proper global vs project vs directory split | 🧠 |

---

## Star Rating

| Score | Rating | Description |
|-------|--------|-------------|
| 90-100 | ⭐⭐⭐⭐⭐ | Excellent - follows all best practices |
| 80-89 | ⭐⭐⭐⭐☆ | Good - minor improvements possible |
| 70-79 | ⭐⭐⭐☆☆ | Adequate - several areas need work |
| 60-69 | ⭐⭐☆☆☆ | Needs Work - significant issues |
| <60 | ⭐☆☆☆☆ | Poor - major restructuring needed |

---

## Scoring Worksheet

```markdown
## [File Name] - Scoring Worksheet

### Mechanical Scores (from analyzer)
- Line count: ___ → Length score: __/5
- XML tags: ___ → XML score: __/5
- External links: ___ → Modular score: __/5
- Code blocks: ___ → Example score: __/5
- "Why" phrases: ___ → Why score: __/5
- Boundaries section: ___ → Boundaries base: __/7
- Aggressive count: ___ → Aggressive score: __/5

### AI Judgment Scores
- Section hierarchy: __/5
- Scanability: __/5
- Commands quality: __/5
- Decision guidance: __/5
- Boundaries quality: __/3 (added to base)
- Protected areas: __/5
- Workflow gates: __/5
- Positive framing: __/5
- Context motivation: __/5
- No redundancy: __/5
- Essential content: __/5
- Hierarchy use: __/5

### Totals
- Structure: __/25
- Content: __/25
- Boundaries: __/20
- Claude 4.5: __/15
- Efficiency: __/15
- **TOTAL: __/100**

### Rating: ⭐⭐⭐☆☆
```
