# Gemini Delegation Plugin

> A Claude Code plugin that provides a specialized subagent for delegating research and web search tasks to Google's Gemini AI via CLI

## Overview

The **gemini-delegation** plugin adds a new subagent to Claude Code that enables context-segregated delegation to Gemini AI for:

- Web research and real-time information gathering
- Fact-checking current events
- Information beyond Claude's knowledge cutoff
- Cross-verification with a second AI perspective

## Key Features

### 🤖 Dedicated Subagent

A specialized `gemini` subagent that:

- Runs in **isolated context** for clean delegation
- Has access only to the **Bash tool** (minimal surface area)
- Invokes Gemini CLI with structured JSON output
- Returns parsed findings to the main Claude instance

### 🔄 Context Segregation

The subagent architecture provides:

- **No context pollution** - research happens in a separate conversation
- **Focused execution** - subagent has a single purpose
- **Efficient token usage** - only findings return to main context
- **Clean handoff** - explicit delegation boundary

### 📡 SessionStart Hook

Automatically informs Claude at session start about:

- When to use the Gemini subagent
- How to invoke it via the Task tool
- Best practices for delegation

## Prerequisites

You must have the [Gemini CLI](https://github.com/google/generative-ai-cli) installed and configured:

```bash
# Install Gemini CLI
npm install -g @google/generative-ai-cli

# Configure with your API key
gemini auth login
```

Verify installation:

```bash
gemini -p "Hello" -o text
```

## Installation

### Option 1: From Marketplace (if published)

```bash
/plugin install gemini-delegation@wombat9000-marketplace
```

### Option 2: Local Development

```bash
# Clone this repository
cd ~/.claude/plugins/
ln -s /path/to/claude-plugins/plugins/gemini-delegation gemini-delegation

# Restart Claude Code or reload plugins
```

## Usage

### Automatic Delegation

When you ask Claude about current events or recent information, it will automatically delegate to the Gemini subagent:

**Example conversation:**

```
User: What are the latest security vulnerabilities in Python 3.13?

Claude: Let me research this using the Gemini subagent since it has access
        to current information.

[Claude uses Task tool with subagent_type="gemini"]

Claude: Based on Gemini's research, here are the latest vulnerabilities...
```

### Manual Invocation

You can also explicitly ask Claude to use the Gemini subagent:

```
User: Use the Gemini subagent to research the latest developments in quantum computing.
```

## How It Works

### 1. Main Claude Instance

When a research task is identified:

```python
Task(
  subagent_type="gemini",
  description="Research latest Python vulnerabilities",
  prompt="What are the latest security vulnerabilities discovered in Python 3.13?",
  model="haiku"  # Fast and cost-effective for delegation
)
```

### 2. Gemini Subagent Execution

The subagent (running in isolated context):

1. Receives the research prompt
1. Invokes Gemini CLI:
   ```bash
   gemini -p "research query" -o json -y 2>/dev/null
   ```
1. Parses the JSON response:
   ```json
   {
     "response": "Gemini's findings...",
     "stats": { ... }
   }
   ```
1. Returns findings in a structured format

### 3. Main Claude Synthesis

Claude receives the subagent's report and:

- Integrates findings with its own knowledge
- Provides additional analysis or context
- Formats the final response for the user

## Architecture

```
plugins/gemini-delegation/
├── .claude-plugin/
│   └── plugin.json              # Plugin descriptor with SessionStart hook
├── agents/
│   └── gemini.md                # Subagent definition (YAML + system prompt)
├── scripts/
│   └── session-context.sh       # Informs Claude about subagent availability
└── README.md                    # This file
```

### Subagent Definition

[agents/gemini.md](agents/gemini.md) contains:

```yaml
---
name: gemini
description: Specialized subagent for web research via Gemini AI CLI
tools: Bash
model: haiku
---

[System prompt instructing how to delegate to Gemini CLI]
```

## Configuration

### Change the Model

Edit [agents/gemini.md](agents/gemini.md) to use a different Gemini model:

```bash
gemini -p "query" -o json -m gemini-2.5-pro 2>/dev/null
```

### Restrict Auto-Approval

Remove the `-y` flag if you want Gemini to prompt for action approval:

```bash
gemini -p "query" -o json 2>/dev/null
```

### Tool Restrictions

Add `--allowed-tools` to limit Gemini's capabilities:

```bash
gemini -p "query" -o json --allowed-tools web_search 2>/dev/null
```

## Benefits of the Subagent Pattern

### vs. Direct Gemini Invocation

| Approach         | Context               | Flexibility | Token Efficiency |
| ---------------- | --------------------- | ----------- | ---------------- |
| Direct Bash call | Pollutes main context | Low         | Poor             |
| Slash command    | Main context          | Medium      | Poor             |
| **Subagent**     | **Isolated**          | **High**    | **Excellent**    |

### Context Segregation Example

**Without Subagent (Direct Call):**

```json
[Main context: 50k tokens]
+ Gemini CLI output: 5k tokens
+ Research artifacts: 3k tokens
= 58k tokens in main context
```

**With Subagent:**

```json
[Main context: 50k tokens]
[Subagent context: 8k tokens - separate]
+ Subagent summary: 500 tokens returned
= 50.5k tokens in main context
```

## When to Use Gemini Delegation

### Good Use Cases ✅

1. **Current Events**

   - "What happened in the latest SpaceX launch?"
   - "What are today's top tech news stories?"

1. **Recent Software Releases**

   - "What's new in Python 3.13?"
   - "Has Rust 1.75 been released?"

1. **Real-Time Data**

   - "Current Bitcoin price and market trends"
   - "Latest npm package versions for React"

1. **Fact-Checking**

   - "Verify if the Bun 1.0 release includes native TypeScript support"

1. **Web Research**

   - "Compare the latest benchmarks for LLM inference frameworks"

### Not Ideal For ❌

1. **Code Generation** - Claude excels at this
1. **Local File Operations** - Use Claude's file tools
1. **Historical Information** - Within Claude's knowledge cutoff
1. **Complex Multi-Step Tasks** - Better handled by Claude directly

## Advanced Usage

### Parallel Research

Claude can launch multiple Gemini subagents in parallel:

```
User: Compare Python 3.13, Ruby 3.3, and Go 1.22 latest features

Claude: Let me research all three in parallel using Gemini subagents...
[Launches 3 Task calls with subagent_type="gemini" concurrently]
```

### Chained Delegation

```
User: Research quantum computing advances, then explain the findings using simple analogies

Claude:
1. [Uses Gemini subagent for research]
2. [Synthesizes findings with analogies from own knowledge]
```

## Troubleshooting

### Subagent Not Available

Check if the plugin is installed:

```bash
/agents list
# Should show "gemini" in the list
```

### "gemini: command not found"

Ensure Gemini CLI is installed:

```bash
which gemini
npm install -g @google/generative-ai-cli
```

### Authentication Errors

Re-authenticate with Gemini:

```bash
gemini auth login
```

### Subagent Returns Errors

Test Gemini CLI directly:

```bash
gemini -p "test query" -o json 2>/dev/null
```

### Context Hook Not Showing

Verify the hook executes:

```bash
./plugins/gemini-delegation/scripts/session-context.sh
```

## Development

### Viewing the Subagent Definition

```bash
cat plugins/gemini-delegation/agents/gemini.md
```

### Testing the Session Hook

```bash
bash plugins/gemini-delegation/scripts/session-context.sh
```

### Editing the Subagent Prompt

Edit [agents/gemini.md](agents/gemini.md) to customize:

- System instructions
- Gemini CLI flags
- Output formatting
- Error handling

### Adding More Subagents

Create additional `.md` files in `agents/`:

```bash
# Example: gemini-code-review.md
---
name: gemini-code-review
description: Delegate code review to Gemini AI
tools: Bash, Read
model: haiku
---

[System prompt for code review delegation]
```

## Contributing

Contributions welcome! Potential enhancements:

1. **Additional Subagents**

   - `gemini-summarize` - URL/document summarization
   - `gemini-debug` - Debug assistance with web research
   - `gemini-benchmark` - Performance comparison research

1. **PreToolUse Hooks**

   - Auto-suggest Gemini when Claude uses WebSearch/WebFetch
   - Transparent delegation for web-related tools

1. **Output Formatters**

   - Helper scripts to parse Gemini JSON into specific formats
   - Structured data extraction utilities

1. **Test Suite**

   - BATS tests for subagent invocation
   - Mock Gemini CLI for CI/CD testing

## Related Resources

- [Gemini CLI Documentation](https://github.com/google/generative-ai-cli)
- [Claude Code Subagents Guide](https://code.claude.com/docs/en/sub-agents.md)
- [Claude Code Plugin Development](https://code.claude.com/docs/en/plugins.md)
- [Other Plugins in This Marketplace](../../README.md)

## License

[Your License Here]

______________________________________________________________________

**Note:** This plugin requires an active Gemini API key and the Gemini CLI to be installed. Costs incurred from Gemini API usage are separate from Claude Code usage.
