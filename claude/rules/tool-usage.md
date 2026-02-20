# Tool Usage Rules

## Mandatory Tool Preferences

<tool_rules>

### File Operations

| Operation | Use | Avoid |
|-----------|-----|-------|
| Read file | `Read` | `cat`, `head`, `tail` |
| Search content | `Grep` | `grep`, shell pipes |
| Find files | `Glob` | `find` |
| Edit file | `Edit`, `MultiEdit` | `sed`, `awk`, heredocs |
| Create file | `Write` | `echo >`, `cat >` |

Shell commands are for actual system commands only: git, npm, cargo, uv, etc.

### Read Before Edit

Always read a file before editing. Never edit blindly based on assumptions.

1. `Read(path)` - understand current state
2. Plan changes - identify what to modify
3. `Edit(path, old, new)` - make precise changes

</tool_rules>

## Edit Precision Rules

<edit_guidelines>

### Include Enough Context

Match strings must be unique in the file. Include surrounding lines if needed.

### Preserve Exact Formatting

Match exact whitespace - tabs vs spaces matter.

### Use MultiEdit for Multiple Changes

Batch related edits into a single MultiEdit call rather than sequential Edit calls.

</edit_guidelines>

## Bash Command Rules

<bash_rules>
- Always quote paths containing spaces: `cd "/path/with spaces/"`
- Avoid long-running processes (npm run dev, http servers); use tmux for those
- Check before destructive operations: `ls directory/` before `rm -rf directory/`
</bash_rules>

## Parallel Tool Usage

<parallel_rules>
Independent operations should run in parallel:
- Multiple file reads
- Multiple search queries
- Independent analysis tasks

Sequential when dependencies exist:
1. Read file (need content first)
2. Edit file (then modify)
3. Verify (then check)
</parallel_rules>

## Subagent Usage

Use subagents for:
- Independent research tasks
- Code analysis that reads many files
- Keeping main context clean
- Parallel work streams

Subagent tasks should be specific and scoped:
- Good: "Analyze auth module for security issues"
- Bad: "Look around the codebase"

## Verification Requirements

After code changes:
1. Lint check: `ruff check` / `biome lint`
2. Type check: `tsc` / `pyright`
3. Test run: `npm test` / `pytest`

Never skip verification for "small" changes.
