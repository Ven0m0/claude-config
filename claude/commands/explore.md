---
description: Explore local and remote codebases using Repomix. Pack code for analysis or explore structure and patterns.
category: exploration-analysis
allowed-tools: Read, Write, Bash, Grep, Glob
---

<task>
Explore local or remote codebases using Repomix for analysis and understanding.
</task>

<instructions>

## Usage

`/explore [target] [mode] [options]` where:
- target: local path, owner/repo, or full URL
- mode: `pack` (default), `analyze`, or `explore`
- options: additional Repomix options

## Workflow

<steps>
1. Pack with Repomix: `npx repomix@latest` with specified options
2. Optional analysis: launch `code-explorer` agent for architecture, patterns, dependencies
3. Output processing: creates compressed .repomix output
</steps>

## Available Options

| Option | Purpose |
|--------|---------|
| `--style xml\|markdown\|json` | Output format |
| `--include` | Filter patterns (`"src/**/*.ts"`) |
| `--ignore` | Exclude patterns (`"node_modules/**"`) |
| `--compress` | Token reduction via tree-sitter |
| `--output` | Custom location |
| `--copy` | Clipboard copy |

## Examples

```bash
# Local exploration
/explore-local ./src --compress

# Remote repository
/explore-remote owner/repo --compress

# Specific patterns
/explore-local . --include "auth/**,**/login/**" --compress

# Code review
/explore-remote owner/repo --compress
# Then: /code-explorer "Analyze security patterns"
```

</instructions>
