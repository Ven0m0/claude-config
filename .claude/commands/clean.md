---
description: Clean up code, artifacts, branches, context, and comments. Consolidates technical debt removal, branch management, and context optimization.
category: utilities-maintenance
allowed-tools: Read, Edit, Bash(git *), Bash(rm *), Grep, Glob
---

<task>
Comprehensive cleanup for code, artifacts, git workflow, context, and comments.
</task>

<instructions>

## Usage

`/clean [mode]` where mode is:
- `code` or no args: clean technical debt
- `artifacts`: clean development artifacts
- `branches`: clean git branches
- `context`: optimize memory bank and context
- `comments`: remove redundant comments
- `all`: all of the above

## Code Cleanup

<targets>
1. TODO, FIXME, HACK, XXX comments
2. Commented-out code blocks (older than 3 months)
3. Unused imports/variables
4. Dead/unreachable code
5. Deprecated API usage
6. Debug statements (console.log, print)
</targets>

Consolidate duplication, extract common functionality, unify error handling, organize imports.

## Artifacts Cleanup

- Temporary files: `*.log`, `*.tmp`, `*~`
- Build artifacts: `dist/`, `build/`, `node_modules/.cache`
- Protected: `.claude`, `.git`, `node_modules`, `vendor`

## Branch Cleanup

```bash
git fetch --prune
git branch --merged | xargs -n 1 git branch -d
```

## Comment Cleanup

<preserve>Comments that explain WHY, document complex business logic, contain TODOs/FIXMEs, warn about non-obvious behavior.</preserve>
<remove>Comments that restate what code does, add no value, state the obvious, duplicate adjacent comments.</remove>

## Safety

1. Create git checkpoint before cleanup
2. Run tests after each change type
3. Keep refactoring commits separate
4. Document why code was removed

</instructions>

<output_format>
- Summary by category
- Lines/files removed
- Risk assessment
- Follow-up tasks
</output_format>
