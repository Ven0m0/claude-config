# Subagent Rules

## When to Use Subagents

<use_subagents>
- Research tasks that read many files
- Code analysis that fills context
- Independent parallel work streams
- Keeping main context clean
- Specialized review (security, performance)
</use_subagents>

<avoid_subagents>
- Simple single-file operations
- Sequential dependent tasks
- When you need to maintain conversation state
- Trivial lookups
</avoid_subagents>

## Configuration

### Agent Definitions

Define in `.claude/agents/` with frontmatter:

```yaml
---
name: security-reviewer
description: Reviews code for security vulnerabilities
allowed-tools: Read, Grep, Glob, Bash
model: opus
---
```

### Model Selection

| Model | Use For | Cost |
|-------|---------|------|
| haiku | Fast tasks, file exploration, pattern matching | Lowest |
| sonnet | Most work, balanced capability | Medium |
| opus | Complex reasoning, architecture decisions, security-critical | Highest |

## Invocation Patterns

### Scoped Tasks

Good: `"Review src/api/handlers/*.py for input validation issues"`
Bad: `"Look at the code for problems"`

### Parallel Agents

Launch simultaneously for independent analysis:
- Agent 1: performance implications
- Agent 2: security considerations
- Agent 3: API compatibility

Synthesize results before proceeding.

### Expected Output Format

Define what you want back:
```
"Return findings as:
1. File path and line number
2. Issue type
3. Risk level (high/medium/low)
4. Suggested fix"
```

## Best Practices

<guidelines>
- Each subagent starts with clean context focused on a single task
- Define clear scope boundaries ("analyze ONLY files in src/auth/")
- Limit tools to the minimum necessary
- Handle failures gracefully: capture partial results, note failures, decide retry vs proceed
- Use haiku for simple tasks, opus only for complex reasoning
</guidelines>
