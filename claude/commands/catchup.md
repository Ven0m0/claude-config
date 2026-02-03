---
description: Read all uncommitted changes back into context after /clear
category: workflow
allowed-tools: Bash(git *), Read, Glob
---

# Catchup - Reload Work in Progress

**Use case**: After running `/clear`, reload your current work-in-progress back into context.

**Common pattern**: `/clear` → `/catchup` → continue working

## Task 1: Get Uncommitted Changes

```bash
git status --short
```

Show the user what will be loaded.

## Task 2: Read Changed Files

**For each modified or new file** from git status:

1. **Skip binary files** - Check file extension (.png, .jpg, .pdf, .zip, etc.)
2. **Skip large files** - If file > 10k lines, ask user if they want to load it
3. **Read the file** - Use Read tool to load content

**Implementation**:
```bash
# Get list of changed files (exclude deleted)
git diff --name-only HEAD
git ls-files --others --exclude-standard
```

For each file:
- Skip if binary or too large
- Use Read tool to load into context

## Task 3: Summary

After loading all files, provide summary:

```
📥 Catchup Complete

Loaded into context:
- src/auth.ts (234 lines, +45 -12)
- tests/auth.test.ts (89 lines, +23 -5)
- docs/api.md (+34 -0, new file)

Total: 3 files, 357 lines
Skipped: 0 files

Ready to continue where you left off.
```

## Guidelines

- **Be selective**: Only load text files that are part of current work
- **Skip noise**: Don't load lock files, build artifacts, or generated code
- **Ask before loading large files**: Files > 10k lines should require confirmation
- **Provide context**: Show what was loaded so user knows what's in context

---

**Sources:**
- [How I Use Every Claude Code Feature](https://blog.sshh.io/p/how-i-use-every-claude-code-feature)
- [Claude Code Custom Commands: 3 Practical Examples](https://www.aiengineering.report/p/claude-code-custom-commands-3-practical)
