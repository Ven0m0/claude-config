# Optimization Patterns: Context Reduction Methodology

**Purpose**: Systematic approaches for reducing token consumption in Claude Code projects
**Achievement**: 28-33% context reduction through 9 optimization phases

---

## Overview

This document records the patterns we used to reduce bloat in the claude-night-market project, saving approximately 70,772 tokens.

We optimize by adhering to basic engineering principles: separating concerns, not repeating ourselves (DRY), and revealing complexity only when necessary (progressive disclosure). We also prioritize backward compatibility so improvements don't break existing workflows.

---

## Pattern 1: Archive Cleanup

**When to Use**: Project has accumulated historical artifacts
**Savings Potential**: High (33,400 tokens in our case)

### Process

1. **Identify Archives**
   ```bash
   find . -name ".worktree*" -type d
   find . -name "*-old.md" -o -name "*-archive.md"
   ```
2. **Categorize Content**
   - Delete: Duplicate information, outdated decisions
   - Review: Historical context that might be referenced
   - Migrate: Valuable content buried in archives
3. **Execute Cleanup**
   ```bash
   git rm -r .worktrees/old-branch-*
   git commit -m "chore: remove archived worktrees"
   ```

### Example Results
- Deleted 15 archived files
- Removed obsolete documentation
- Cleaned historical decision records
- **Savings**: ~33,400 tokens

---

## Pattern 2: Documentation Refactoring (Hub-and-Spoke)

**When to Use**: Monolithic docs exceed recommended limits (500 lines for reference, 1000 for tutorials)
**Savings Potential**: Medium-High (10,500 tokens)

### Hub-and-Spoke Structure
```
# Before: Monolithic
complete-guide.md (2,000 lines)

# After: Hub-and-Spoke
README.md (150 lines)          ← Hub
├→ getting-started.md (300)
├→ core-concepts.md (400)
├→ advanced-topics.md (500)
└→ api-reference.md (400)
```

### Implementation
1. **Create Hub Document**: High-level overview, navigation to sub-documents, quick-start essentials, cross-references
2. **Split by Concern**: Each sub-doc has single topic, progressive depth (basic → advanced), self-contained but linked
3. **Maintain Discoverability**: Clear navigation in hub, breadcrumbs in sub-docs, cross-references where relevant

### Directory-Specific Limits

| Directory | Limit | Purpose |
|-----------|-------|---------|
| `docs/` | 500 lines | Strict reference material |
| `book/` | 1000 lines | Lenient tutorials |
| `examples/` | 800 lines | Focused examples |
| `skills/` | 300 lines | Concise instructions |

---

## Pattern 3: Data Extraction

**When to Use**: Scripts contain >100 lines of embedded data
**Savings Potential**: Very High (10,192 tokens from 4 scripts)

See [Data Extraction Pattern Guide](./guides/data-extraction-pattern.md) for details.

### Quick Summary
```python
# Before: Embedded data (830 lines)
def _topics():
    return [Topic(...), Topic(...), ...]  # Hundreds of lines

# After: Load from YAML
def load_topics():
    with open("data/seed_topics.yaml") as f:
        return [Topic.from_dict(t) for t in yaml.safe_load(f)["topics"]]
```

**Results**: 75% average code reduction

---

## Pattern 4: Shared Utilities Abstraction

**When to Use**: Code duplication across multiple scripts/skills
**Savings Potential**: Medium (2,400 tokens)

### Process
1. **Identify Duplication**
   ```bash
   grep -r "def extract_snippet" plugins/*/scripts/
   ```
2. **Create Shared Module**
   ```python
   # plugins/pensive/utils/content_parser.py
   def extract_code_snippet(file_path: str, start: int, end: int) -> str:
       """Reusable snippet extraction."""
   ```
3. **Update Consumers**
   ```python
   # Before: Duplicated in 4 files (50 lines each)
   def _extract_snippet(self, ...): ...
   
   # After: Import from utils
   from pensive.utils import extract_code_snippet
   ```

### Example: Pensive Review Skills
**Created**: `content_parser.py`, `severity_mapper.py`, `report_generator.py`
**Enhanced**: `BaseReviewSkill` with shared helper methods
**Results**: ~400 lines of utilities replace ~800 lines of duplicates, 4 review skills now share common code

---

## Pattern 5: Examples Repository

**When to Use**: Large example files inflate plugin context
**Savings Potential**: Medium (5,540 tokens)

### Strategy
1. **Create Centralized Location**
   ```
   examples/
   └── attune/
       ├── microservices-example.md (726 lines)
       └── library-example.md (699 lines)
   ```
2. **Replace with Stubs**
   ```markdown
   # Microservices Example (Stub)
   Full example: `/examples/attune/microservices-example.md`
   **Quick Summary**: This example demonstrates...
   [View Full Example](../../../examples/attune/microservices-example.md)
   ```
3. **Keep Essential Examples**: Quick-start stays in plugin, detailed worked examples move to `/examples/`, threshold: <400 lines stays, >600 lines moves

### Results
- 1,425 lines moved to `/examples/`
- 38 lines of stubs remain in plugin
- **Savings**: ~1,385 lines = ~5,540 tokens

---

## Pattern 6: Progressive Disclosure

**When to Use**: Documentation must serve both beginners and experts
**Savings Potential**: Medium (3,200 tokens from 8 files)

### Technique
```markdown
# Hub Document (200 lines)
## Quick Start
Essential information for 80% of users.
## Core Concepts
Mid-level details with links to deep dives.
See: [Advanced Topics](./advanced.md)
```

### Application Example
**Before**: Single `error-handling-complete.md` (1,500 lines)
**After**:
- `error-handling.md` (400 lines) - Core concepts
- `error-patterns.md` (500 lines) - Common patterns
- `error-recovery.md` (400 lines) - Advanced recovery
- `error-reference.md` (200 lines) - API reference

**Result**: Same content, better organization, easier to navigate

---

## Pattern 7: TODO Audit

**When to Use**: Periodic maintenance (quarterly recommended)
**Savings Potential**: Low-Medium (130 tokens)

### Process
```bash
rg "TODO|FIXME|HACK|XXX" --type py --type md
# Categorize: Remove (completed/obsolete), Track (move to issues), Keep (short-term reminders)
```

### Results
- Confirmed excellent hygiene (minimal cleanup needed)
- Removed false positives
- Low savings but good maintenance practice

---

## Pattern 8: Anti-Pattern Removal

**When to Use**: Identify common anti-patterns during review
**Savings Potential**: Medium (5,410 tokens)

### Common Anti-Patterns

#### "Complete Guide" Files
**Problem**: Monolithic files that try to cover everything
**Solution**: Split into modular guides
```
❌ rust-complete-guide.md (2,500 lines)
✅ rust/
  ├── README.md (hub)
  ├── getting-started.md
  ├── ownership-guide.md
  ├── concurrency-guide.md
  └── best-practices.md
```

#### Verbose Examples
**Problem**: Examples with too much explanation
**Solution**: Show, don't tell

❌ **Before (150 lines):** Long prose explaining every step...
✅ **After (30 lines):**
```python
from mylib import Client
client = Client(api_key="...")
result = client.process(data)
```

#### Redundant Documentation
**Problem**: Same content in multiple places
**Solution**: Single source of truth with references: `See: [Feature Guide](./guides/feature-guide.md)`

---

## Optimization Workflow

### Phase-Based Approach

| Phase | Actions |
|-------|---------|
| 1: Discovery | Run `/conserve:bloat-scan`, identify large files (>500 lines docs, >800 code), duplicates, archives |
| 2: Analysis | Measure size, identify opportunity, estimate savings, assess effort, calculate ROI |
| 3: Planning | Prioritize by ROI (quick wins), impact (large savings), risk (easy validation), strategic value |
| 4: Execution | Create backup branch, apply pattern, validate functionality, document, commit |
| 5: Validation | Run tests, measure before/after, calculate token savings (~4 tokens/line) |

---

## Metrics and Measurement

### Token Estimation
- Conservative: 1 line = 3 tokens
- Average: 1 line = 4 tokens
- Complex: 1 line = 5 tokens

### Success Criteria
Optimization succeeds when we reduce size while passing all tests. We must update related documentation and keep the git history clean. The goal is measurable token savings without breaking the system.

### Tracking Template
```markdown
## Phase N: [Name]
**Before**: File X: Y lines, File Z: W lines, Total: N lines
**After**: File X: Y' lines, File Z: W' lines, Total: N' lines
**Savings**: (N - N') lines × 4 = ~T tokens
```

---

## Real-World Results

### Phase-by-Phase Breakdown

| Phase | Focus | Tokens Saved |
|-------|-------|--------------|
| 1: Archive Cleanup | Historical artifacts | 33,400 |
| 2: Doc Refactoring | Hub-and-spoke | 10,500 |
| 3: TODO Audit | Code hygiene | 130 |
| 4: Anti-Pattern Removal | Complete-guide files | 5,410 |
| 5: Progressive Disclosure | Documentation standards | 3,200 |
| 6: Shared Utilities | Code deduplication | 2,400 |
| 7: Tutorial Split | (Deferred) | 0 |
| 8: Examples Repo | Centralized examples | 5,540 |
| 9: Data Extraction | YAML configuration | 10,192 |
| **Total** | | **~70,772** |

### Impact Summary
- **Context Reduction**: 28-33%
- **Files Deleted**: 19
- **Files Refactored**: 19
- **Data Files Created**: 8 (YAML)
- **Utility Modules Created**: 4

---

## Best Practices

1. **Incremental Changes**: One pattern at a time
2. **Systematic**: Scan, analyze, execute, validate, document
3. **Preserve Functionality**: Tests must pass
4. **Document**: Record how you did it
5. **Avoid Scope Creep**: Good enough is fine

## When to Apply

| Priority | Triggers |
|----------|----------|
| High | Context limits exceeded, slow performance, high costs |
| Medium | Approaching limits, technical debt cleanup |
| Low | Minor cleanups |

---

## Future Opportunities

**Automation**: Refactoring tools, size limits, CI scanning
**Configuration**: Centralized config, lazy loading
**Pattern Library**: Reusable templates

## See Also

- [Data Extraction Pattern](./guides/data-extraction-pattern.md)
- [Conserve Plugin](../plugins/conserve/README.md)
