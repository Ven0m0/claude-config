---
description: Pack and/or explore a remote GitHub repository using Repomix
---

Fetch a remote GitHub repository using Repomix and optionally analyze it with a sub-agent.

## Usage

```
/explore-remote owner/repo [options]
/explore-remote https://github.com/facebook/react --compress
/explore-remote microsoft/vscode - show me the main architecture
```

Accepts: `owner/repo`, full GitHub URL, or URL with branch/commit. Add analysis focus after `-` separator.

## Workflow

1. **Pack**: Run `npx repomix@latest --remote <repo> [options]`
2. **Analyze** (if user wants exploration): Launch code-explorer agent to analyze the output incrementally using Grep and Read tools

If the user only wants to pack (no analysis), stop after step 1.

## Available Options

| Option | Purpose |
|--------|---------|
| `--style <format>` | Output format: xml (default), markdown, json, plain |
| `--include <patterns>` | Include only matching patterns |
| `--ignore <patterns>` | Additional ignore patterns |
| `--compress` | Tree-sitter compression (~70% token reduction) |
| `--output <path>` | Custom output path |
| `--copy` | Copy output to clipboard |

## Analysis

**DO NOT** read the entire output file directly. Launch a sub-agent to analyze incrementally:
- Use `code-explorer` agent (preferred) or `general-purpose` agent
- Agent should use Grep and Read tools on the output file
- Provide any specific focus areas from the user's request
