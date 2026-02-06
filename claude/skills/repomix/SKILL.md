---
name: packaging-repos-with-repomix
description: Packages entire repositories into single AI-friendly files using Repomix with multiple output formats. Use when packaging codebases for LLM analysis, creating repository snapshots, or preparing security audits. Triggers include "repomix", "package codebase", "AI-friendly", or "LLM context".
allowed-tools: Bash, Read, Glob
user-invocable: true
---

# Repomix Skill

Repomix packs entire repositories into single, AI-friendly files. Perfect for feeding codebases to LLMs like Claude, ChatGPT, and Gemini.

## When to Use

Use when:

- Packaging codebases for AI analysis
- Creating repository snapshots for LLM context
- Analyzing third-party libraries
- Preparing for security audits
- Generating documentation context
- Investigating bugs across large codebases
- Creating AI-friendly code representations

## Quick Start

### Check Installation

```bash
repomix --version
```

### Install

```bash
# npm
bun install -g repomix

# Homebrew (macOS/Linux)
brew install repomix
```

### Basic Usage

```bash
# Package current directory (generates repomix-output.xml)
repomix

# Specify output format
repomix --style markdown
repomix --style json

# Package remote repository
bunx repomix --remote owner/repo

# Custom output with filters
repomix --include "src/**/*.ts" --remove-comments -o output.md
```

## Core Capabilities

### Repository Packaging

- AI-optimized formatting with clear separators
- Multiple output formats: XML, Markdown, JSON, Plain text
- Git-aware processing (respects .gitignore)
- Token counting for LLM context management
- Security checks for sensitive information

### Remote Repository Support

Process remote repositories without cloning:

```bash
# Shorthand
bunx repomix --remote yamadashy/repomix

# Full URL
bunx repomix --remote https://github.com/owner/repo

# Specific commit
bunx repomix --remote https://github.com/owner/repo/commit/hash
```

### Comment Removal

Strip comments from supported languages (HTML, CSS, JavaScript, TypeScript, Vue, Svelte, Python, PHP, Ruby, C, C#, Java, Go, Rust, Swift, Kotlin, Dart, Shell, YAML):

```bash
repomix --remove-comments
```

## Common Use Cases

### Code Review Preparation

```bash
# Package feature branch for AI review
repomix --include "src/**/*.ts" --remove-comments -o review.md --style markdown
```

### Security Audit

```bash
# Package third-party library
bunx repomix --remote vendor/library --style xml -o audit.xml
```

### Documentation Generation

```bash
# Package with docs and code
repomix --include "src/**,docs/**,*.md" --style markdown -o context.md
```

### Bug Investigation

```bash
# Package specific modules
repomix --include "src/auth/**,src/api/**" -o debug-context.xml
```

### Implementation Planning

```bash
# Full codebase context
repomix --remove-comments --copy
```

## Command Line Reference

### File Selection

```bash
# Include specific patterns
repomix --include "src/**/*.ts,*.md"

# Ignore additional patterns
repomix -i "tests/**,*.test.js"

# Disable .gitignore rules
repomix --no-gitignore
```

### Output Options

```bash
# Output format
repomix --style markdown  # or xml, json, plain

# Output file path
repomix -o output.md

# Remove comments
repomix --remove-comments

# Copy to clipboard
repomix --copy
```

### Configuration

```bash
# Use custom config file
repomix -c custom-config.json

# Initialize new config
repomix --init  # creates repomix.config.json
```

## Token Management

Repomix automatically counts tokens for individual files, total repository, and per-format output.

Typical LLM context limits:

- Claude Sonnet 4.5: ~200K tokens
- GPT-4: ~128K tokens
- GPT-3.5: ~16K tokens

## Security Considerations

Repomix uses Secretlint to detect sensitive data (API keys, passwords, credentials, private keys, AWS secrets).

Best practices:

1. Always review output before sharing
1. Use `.repomixignore` for sensitive files
1. Enable security checks for unknown codebases
1. Avoid packaging `.env` files
1. Check for hardcoded credentials

Disable security checks if needed:

```bash
repomix --no-security-check
```

## Implementation Workflow

When user requests repository packaging:

1. **Assess Requirements**

   - Identify target repository (local/remote)
   - Determine output format needed
   - Check for sensitive data concerns

1. **Configure Filters**

   - Set include patterns for relevant files
   - Add ignore patterns for unnecessary files
   - Enable/disable comment removal

1. **Execute Packaging**

   - Run repomix with appropriate options
   - Monitor token counts
   - Verify security checks

1. **Validate Output**

   - Review generated file
   - Confirm no sensitive data
   - Check token limits for target LLM

1. **Deliver Context**

   - Provide packaged file to user
   - Include token count summary
   - Note any warnings or issues

## Reference Documentation

For detailed information, see:

- [Configuration Reference](./references/configuration.md) - Config files, include/exclude patterns, output formats, advanced options
- [Usage Patterns](./references/usage-patterns.md) - AI analysis workflows, security audit preparation, documentation generation, library evaluation

## Exploration and Analysis

After packing, analyze the output incrementally - never read the entire output file at once.

```bash
# Search for patterns in output
rg -i "export.*function|class " repomix-output.xml

# Read sections incrementally
Read("repomix-output.xml", offset=0, limit=500)

# Common searches
rg -i "auth|login|jwt|token" repomix-output.xml
rg -i "router|route|endpoint" repomix-output.xml
rg -i "config|Config" repomix-output.xml
```

Report findings: file count, token metrics, structure overview, pattern matches with file references.

## Additional Resources

- GitHub: https://github.com/yamadashy/repomix
- Documentation: https://repomix.com/guide/
- MCP Server: Available for AI assistant integration
