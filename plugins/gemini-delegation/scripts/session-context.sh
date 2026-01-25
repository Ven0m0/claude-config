#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
GEMINI SUBAGENT AVAILABLE

The Gemini AI subagent is available for delegation via the Task tool.

## When to Use the Gemini Subagent

Use the Gemini subagent for:
- Web research and current information (Gemini has web access)
- Fact-checking and information gathering
- Questions requiring real-time data or recent information
- Tasks where you want a second AI perspective
- Information beyond your knowledge cutoff date

## How to Invoke

Use the Task tool with subagent_type="gemini":

```
Task(
  subagent_type="gemini",
  description="Research latest Python vulnerabilities",
  prompt="What are the latest security vulnerabilities discovered in Python 3.13?",
  model="haiku"
)
```

The subagent runs in isolated context and will:
1. Invoke Gemini CLI with the query
2. Parse the structured response
3. Return findings to you for synthesis

## Capabilities

- Real-time web search via Gemini's web access
- Access to current events and recent developments
- Structured JSON output parsing
- Isolated context for focused research

## Best Practices

1. **Delegate proactively** when users ask about current events or recent developments
2. **Be specific** in your prompt to the subagent
3. **Synthesize results** - combine Gemini's findings with your analysis
4. **Use for verification** - cross-check time-sensitive facts

## Context Segregation

The subagent runs in a separate context and only has access to the Bash tool. This ensures:
- Clean delegation without context pollution
- Focused research without distraction
- Efficient token usage

The Gemini CLI is invoked via: gemini -p "query" -o json -y 2>/dev/null
EOF

exit 0
