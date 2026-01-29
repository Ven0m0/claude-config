# Subagent Rules

## When to Use Subagents

### DO Use Subagents For:

- **Research tasks** that read many files
- **Code analysis** that fills context
- **Independent parallel work** streams
- **Keeping main context clean**
- **Specialized review** (security, performance)

### DON'T Use Subagents For:

- Simple single-file operations
- Sequential dependent tasks
- When you need to maintain conversation state
- Trivial lookups

## Subagent Configuration

### Define in `.claude/agents/`

```markdown
# .claude/agents/security-reviewer.md
---
name: security-reviewer
description: Reviews code for security vulnerabilities
allowed-tools: Read, Grep, Glob, Bash
model: opus
---

You are a senior security engineer. Review code for:
- Injection vulnerabilities (SQL, XSS, command injection)
- Authentication and authorization flaws
- Secrets or credentials in code
- Insecure data handling

Provide specific line references and suggested fixes.
```

### Tool Restrictions

Limit tools to minimum necessary:

```yaml
allowed-tools: Read, Grep, Glob     # Read-only research
allowed-tools: Read, Grep, Edit     # Research + modifications
allowed-tools: Read, Bash           # Research + commands
```

### Model Selection

```yaml
model: haiku   # Fast, cost-effective for simple tasks
model: sonnet  # Balanced for most work
model: opus    # Complex reasoning, architecture decisions
```

## Invocation Patterns

### Explicit Delegation

```markdown
Use the security-reviewer agent to analyze src/auth/
```

### Parallel Subagents

```markdown
Launch 3 agents in parallel:
1. Security analysis of auth module
2. Performance review of cache system  
3. Type checking of utils
```

### With Task Tool

```markdown
Task("Analyze auth module for vulnerabilities", 
     tools=["Read", "Grep"],
     model="opus")
```

## Communication Patterns

### Clear Scoping

```markdown
# GOOD: Specific scope
"Review src/api/handlers/*.py for input validation issues"

# BAD: Vague scope
"Look at the code for problems"
```

### Expected Output Format

```markdown
"Return findings as:
1. File path and line number
2. Vulnerability type
3. Risk level (high/medium/low)
4. Suggested fix"
```

### Result Integration

```markdown
# Subagent returns summary
# Main agent acts on findings

Based on security review findings:
- Fix critical issue in auth.py:45
- Add input validation to handlers
```

## Built-in Agents

| Agent | Purpose | Use Case |
|-------|---------|----------|
| `planner` | Implementation planning | Complex features |
| `architect` | System design | Architecture decisions |
| `code-reviewer` | Code review | After writing code |
| `security-reviewer` | Security analysis | Before commits |
| `tdd-guide` | Test-driven development | New features |

## Multi-Agent Workflows

### Writer/Reviewer Pattern

```markdown
Agent 1 (Writer): Implement rate limiter
Agent 2 (Reviewer): Review implementation
Agent 1: Address review feedback
```

### Research/Implement Pattern

```markdown
Agent 1: Research existing patterns in codebase
Main: Implement using discovered patterns
Agent 2: Verify implementation follows patterns
```

### Parallel Analysis

```markdown
Spawn simultaneously:
- Agent 1: Analyze performance implications
- Agent 2: Check security considerations
- Agent 3: Verify API compatibility

Synthesize results before proceeding.
```

## Best Practices

### Keep Subagent Context Clean

```markdown
# GOOD: Fresh context
Each subagent starts with clean context
Focused on single task

# BAD: Shared state
Trying to pass complex state between agents
```

### Define Clear Boundaries

```markdown
# GOOD: Clear scope
"Analyze ONLY files in src/auth/"

# BAD: Unbounded
"Look through the codebase"
```

### Handle Failures Gracefully

```markdown
If subagent fails or times out:
1. Capture partial results
2. Note failure in main context
3. Decide: retry, manual intervention, or proceed without
```

### Cost Awareness

```markdown
# Haiku: 90% Sonnet capability, 3x cheaper
Use for:
- File exploration
- Pattern matching
- Simple analysis

# Opus: Maximum reasoning
Use for:
- Complex architectural decisions
- Security-critical reviews
- Difficult debugging
```

## Troubleshooting

### Subagent Not Finding Results

1. Check tool permissions
2. Verify file paths are accessible
3. Ensure search scope is correct

### Subagent Timeout

1. Reduce scope of task
2. Split into smaller tasks
3. Increase timeout if necessary

### Poor Quality Results

1. Be more specific in instructions
2. Provide examples of expected output
3. Consider using higher-capability model
