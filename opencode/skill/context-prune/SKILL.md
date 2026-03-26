---
name: context-prune
description: Prune context to reduce token waste while preserving important information. Use when context is growing large or token limits are approaching.
---

# Context Pruning

Reduce context size by identifying and removing low-value content while preserving critical information.

## When to Use

- Context approaching token limits
- Repeated similar errors or warnings
- Long dependency lists already analyzed
- Stale imports no longer used
- Duplicated documentation

## Pruning Strategy

### High Priority (Keep)
- Current task-relevant code
- Recent changes (last 5 commits)
- Active function/class definitions
- Configuration affecting behavior
- Error messages requiring action

### Medium Priority (Review)
- Comments explaining why (keep)
- Test files for modified code
- Documentation referenced in code
- Import statements (check for stale)

### Low Priority (Remove)
- Empty lines and whitespace
- Fully commented-out code blocks
- Duplicate error messages
- Historical changelog entries
- Package-lock.json contents
- node_modules references

## Commands

### Analyze Context Size
```bash
# Count lines and estimate tokens
git diff --cached | wc -l
git diff HEAD~1 | wc -l
```

### Find Large Files in Context
```bash
# Files over 500 lines that are mostly boilerplate
find . -name "*.json" -o -name "*.lock" | xargs wc -l 2>/dev/null | sort -rn
```

### Identify Duplicates
```bash
# Find repeated error patterns
git diff | grep -E "^[+-].*error|Exception|FAILED" | sort | uniq -c | sort -rn
```

## Implementation Notes

- Use `ctx_batch_execute` to run multiple analysis commands
- Preserve file paths and line numbers when reporting removals
- Always confirm before auto-removing from files

## Notes/Inspiration

Inspired by [`@tuanhung303/opencode-acp`](https://www.npmjs.com/package/@tuanhung303/opencode-acp) - Context pruning plugin for OpenCode.
