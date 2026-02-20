# Context Management Rules

<fundamental_constraint>
Context window fills up fast. Performance degrades as it fills. Managing context is the most important optimization.
</fundamental_constraint>

## Context Hygiene

### Clear Between Unrelated Tasks

Use `/clear` between unrelated tasks to prevent context pollution.

### Use Subagents for Research

Offload research that reads many files to subagents. They return summaries, keeping main context clean.

## File Reading Strategy

<reading_rules>

### Read What You Need

Use targeted reads with line ranges for large files. Never read entire large files when you only need a section.

```markdown
Read(file.py, offset=100, limit=50)  # Specific section only
```

### Search Before Reading

Find relevant files first with Grep/Glob, then read only what's needed.

### Avoid Redundant Reads

Reference previously read content rather than reading the same file twice.

</reading_rules>

## Context Window Zones

| Zone | Usage | Strategy |
|------|-------|----------|
| Safe (0-70%) | Normal operations | Full reads acceptable, exploration allowed |
| Caution (70-85%) | Be selective | Use subagents for research, consider manual compaction |
| Danger (85-100%) | Critical only | Complete current task, `/clear` soon |

## Compaction Strategy

### Manual Compaction

```markdown
/compact Focus on the API changes and ignore test exploration
```

### Pre-Compaction Cleanup

Before compaction triggers:
- Complete current task to logical checkpoint
- Commit work in progress
- Note important context in conversation

## Reducing Token Usage

<token_efficiency>
- Write concise prompts: direct instructions over verbose descriptions
- Use Grep over full file reads
- Avoid re-reading already-loaded files
- Use line ranges for files > 500 lines
- Delegate research to subagents
</token_efficiency>

## Session Management

| Action | When |
|--------|------|
| `/clear` | Between unrelated tasks |
| `--continue` | Resume recent session |
| `--resume` | Pick specific session |
| `/compact` | At logical boundaries |

## Emergency Recovery

If context is full and performance degrades:
1. Commit any pending changes
2. Note critical context (error messages, file paths)
3. `/clear`
4. Resume with focused prompt including saved context
