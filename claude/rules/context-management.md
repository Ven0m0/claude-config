# Context Management Rules

## The Fundamental Constraint

**Context window fills up fast. Performance degrades as it fills.**

Every file read, command output, and conversation turn consumes tokens. Managing context is the most important optimization.

## Context Hygiene

### Clear Between Unrelated Tasks

```markdown
# WRONG: Mixed context
Task 1: Fix auth bug
Task 2: Implement new feature  # Context polluted with auth debugging
Task 3: Review PR              # Even more pollution

# CORRECT: Clear context
Task 1: Fix auth bug
/clear
Task 2: Implement new feature
/clear
Task 3: Review PR
```

### Use Subagents for Research

```markdown
# WRONG: Main context bloated
Read 50 files to understand codebase
Then implement feature  # Context full of exploration

# CORRECT: Isolated research
Task("Research codebase structure", return_summary=true)
Then implement feature  # Clean context with just the summary
```

## File Reading Strategy

### Read What You Need

```markdown
# WRONG: Read everything
Read(file1.py)  # 500 lines
Read(file2.py)  # 800 lines  
Read(file3.py)  # 300 lines
# 1600 lines in context for small change

# CORRECT: Targeted reads
Read(file1.py, 50, 100)  # Just relevant section
Grep("function_name")    # Find specific code
```

### Use Line Ranges for Large Files

```markdown
# For files > 500 lines
Read(path, offset=100, limit=50)  # Read specific section
```

### Search Before Reading

```markdown
# Find relevant files first
Grep("pattern")  # Identify locations
Glob("*.test.py")  # Find test files

# Then read only needed files
Read(identified_file.py)
```

## Compaction Strategy

### Automatic Compaction

Claude auto-compacts when approaching limits. Customize what's preserved:

```markdown
# In CLAUDE.md
When compacting, preserve:
- Modified file list
- Test commands and results
- Error messages being debugged
- Key architectural decisions
```

### Manual Compaction

```markdown
/compact Focus on the API changes and ignore test exploration
```

### Pre-Compaction Cleanup

Before compaction triggers:
- Complete current task to logical checkpoint
- Commit work in progress
- Note important context in conversation

## Session Management

### Start Fresh for New Tasks

```markdown
# Complex debugging session
/clear

# New feature implementation
/clear

# Code review
/clear
```

### Resume Strategically

```bash
claude --continue    # Resume recent session (with context)
claude --resume      # Pick specific session
```

### Name Sessions

```markdown
/rename oauth-migration
/rename memory-leak-debug
```

## Reducing Token Usage

### Concise Prompts

```markdown
# WRONG: Verbose
Could you please take a look at the authentication system and analyze 
how it handles user sessions, paying particular attention to token refresh...

# CORRECT: Direct
Analyze session handling in src/auth/, focus on token refresh flow.
```

### Avoid Redundant Reads

```markdown
# WRONG: Re-reading
Read(file.py)  # First read
# ...discussion...
Read(file.py)  # Same file again

# CORRECT: Reference previous read
# Refer to file.py content from earlier
```

### Use Grep Over Full Reads

```markdown
# WRONG: Read all files to find pattern
Read(file1.py)
Read(file2.py)
Read(file3.py)
# Search through all content

# CORRECT: Search first
Grep("pattern")  # Returns just relevant lines
```

## Context Window Zones

### Safe Zone (0-70%)
- Normal operations
- Full file reads acceptable
- Exploration allowed

### Caution Zone (70-85%)
- Be selective with reads
- Use subagents for research
- Consider manual compaction

### Danger Zone (85-100%)
- Critical context only
- Complete current task
- `/clear` soon
- Auto-compaction imminent

## Multi-Task Sessions

### Pipeline Pattern

```markdown
Task 1: Research → Summary
/clear (or let compact)
Task 2: Implement using summary
/clear
Task 3: Test and verify
```

### Checkpoint Pattern

```markdown
Implement feature
git commit -m "WIP: feature foundation"
/compact preserve commit and decisions
Continue implementation
git commit -m "Complete feature"
```

## Emergency Recovery

### Context Overflow

If context is full and performance degraded:

1. Commit any pending changes
2. Note critical context (error messages, file paths)
3. `/clear`
4. Resume with focused prompt including saved context

### Lost Context

If important context was lost:

```markdown
# Recover from git
git log --oneline -10
git diff HEAD~1

# Recover from session
claude --resume  # Find previous session
```
