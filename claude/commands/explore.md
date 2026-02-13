---
description: Explore local and remote codebases using Repomix. Pack code for analysis or just explore structure and patterns.
category: exploration-analysis
allowed-tools: Read, Write, Bash, Grep, Glob
---

# Explore Codebase

Explore local or remote codebases using Repomix for analysis and understanding.

## Usage

`/explore [target] [mode] [options]` where:
- target: local path, owner/repo, or full URL
- mode: `pack` (default), `analyze`, or `explore`
- options: Additional Repomix options

### Local Exploration
```bash
# Current directory (default)
/explore-local ./src --compress

# Specific directory
/explore-local ./src/components

# Find all auth-related code
/explore-local . - --include "auth/**,**/login/**" --compress

# Analyze with output
/explore-local ./src --style json --copy
```

### Remote Exploration
```bash
# Public repository
/explore-remote owner/repo --compress

# Private repository
/explore-remote https://github.com/owner/repo.git

# Specific branch
/explore-remote owner/repo --branch develop

# Multiple repositories
/explore-remote owner1/repo1 owner2/repo2 --compress
```

## Workflow

### 1. Pack with Repomix
Runs `npx repomix@latest` with specified options:
- `--style <format>`: Output format (xml, markdown, json, plain)
- `--include <patterns>`: Only include matching files
- `--ignore <patterns>`: Exclude patterns
- `--compress`: Tree-sitter compression for token efficiency
- `--output <path>`: Custom output location

### 2. Optional Analysis
If analysis requested (`analyze` or `explore` mode):
- Launch `code-explorer` agent
- Focus on specific areas: architecture, patterns, dependencies
- Provide interactive exploration with targeted queries

### 3. Output Processing
- Packing: Creates compressed .repomix output
- Analysis: Agent provides structured insights
- Copy option: Places results in clipboard

## Available Options

| Option | Purpose | Example |
|---------|---------|---------|
| `--style xml` | Structured output | `--style xml` |
| `--style markdown` | Readable format | `--style markdown` |
| `--style json` | Machine readable | `--style json` |
| `--include` | Filter patterns | `--include "src/**/*.ts"` |
| `--ignore` | Exclude patterns | `--ignore "node_modules/**"` |
| `--compress` | Token reduction | `--compress` |
| `--output` | Custom location | `--output /tmp/output` |
| `--copy` | Clipboard copy | `--copy` |

## Mode Examples

### Pack Mode (default)
```bash
# Pack current directory
/explore-local . --compress
```

### Analyze Mode
```bash
# Pack and analyze architecture
/explore-local ./src --style markdown --copy
```

### Explore Mode
```bash
# Pack and explore interactively
/explore-local . --compress
# Then use agent to explore:
/code-explorer "Show me the main architectural patterns"
```

## Use Cases

### Code Review
```bash
/explore-remote owner/repo --compress
/code-explorer "Analyze security patterns and vulnerabilities"
```

### Learning
```bash
/explore-local ./src --include "**/*.md" --compress
/code-explorer "Extract coding patterns and best practices"
```

### Migration
```bash
/explore-remote old-project/main --compress
/explore-remote new-project/main --compress
# Compare structures and patterns
```

### Dependency Analysis
```bash
/explore-local . --include "package.json,Cargo.toml,pyproject.toml" --compress
/code-explorer "Analyze dependency patterns and vulnerabilities"
```

## Quality Assurance

### File Validation
- Verify target exists and is accessible
- Check git repository status
- Validate network connectivity for remote repos

### Output Verification
- Ensure .repomix output is created successfully
- Check file size for reasonableness
- Verify compression doesn't break functionality

### Analysis Standards
When using analysis mode:
- Focus on specific, actionable insights
- Provide concrete examples and patterns
- Note architectural decisions and tradeoffs
- Identify potential improvements or risks