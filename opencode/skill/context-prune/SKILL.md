---
name: context-prune
description: Prune context to reduce token waste while preserving important information. Use when context is growing large or token limits are approaching.
---

# Context Pruning

## Priority Tiers

**Keep:** Current task code, recent changes, active definitions, configs affecting behavior, actionable errors.

**Review:** Why-comments, tests for modified code, referenced docs, imports (check for stale).

**Remove:** Commented-out code blocks, duplicate errors, changelog entries, package-lock contents, node_modules references, empty lines in large blocks.

## Analysis Commands

```bash
# Estimate context size
git diff HEAD~1 | wc -l

# Find large boilerplate files
find . -name "*.json" -o -name "*.lock" | xargs wc -l 2>/dev/null | sort -rn | head -10

# Find repeated error patterns
git diff | grep -E "^[+-].*(error|Exception|FAILED)" | sort | uniq -c | sort -rn
```

## Rules

- Preserve file paths and line numbers when reporting removals
- Always confirm before removing content from files
- Prioritize removing output/log noise over source code
