# LSP Tools Integration Guide

This document provides an overview of the LSP (Language Server Protocol) tools integration in the Claude configuration, based on features from [zircote/lsp-tools](https://github.com/zircote/lsp-tools).

## Overview

The LSP tools integration enforces semantic code navigation through Language Server Protocol, delivering IDE-like precision for code operations. It ensures safe, informed code navigation and modification practices through mandatory pre-edit checks, impact analysis, and post-edit diagnostics verification.

## The Three Iron Laws

These behavioral constraints are enforced for all code operations:

```
1. NO MODIFYING UNFAMILIAR CODE WITHOUT goToDefinition FIRST
2. NO REFACTORING WITHOUT findReferences IMPACT ANALYSIS FIRST
3. NO CLAIMING CODE WORKS WITHOUT LSP DIAGNOSTICS VERIFICATION
```

**Rationale:** Violating these laws wastes tokens, introduces bugs, and produces incomplete changes.

## Available Features

### 1. LSP-Enable Skill (`/lsp-enable`)

**Location:** `claude/skills/lsp-enable/`

The core skill that enforces LSP-first semantic code intelligence. It provides:

- **Navigation Operations:** goToDefinition, findReferences, goToImplementation
- **Understanding Operations:** hover (type info & docs), documentSymbol (file structure)
- **Analysis Operations:** incomingCalls (who calls this), outgoingCalls (what this calls)
- **Search Operations:** workspaceSymbol (search across codebase)

**When to Use:**
- Navigating unfamiliar code
- Understanding function implementations
- Finding all references before refactoring
- Tracing call hierarchies
- Analyzing code dependencies

**Reference Documentation:**
- `references/lsp-operations-guide.md` - Complete guide to all LSP operations
- `references/lsp-enforcement-protocol.md` - Enforcement rules and protocols
- `references/lsp-decision-matrix.md` - When to use LSP vs grep/glob
- `references/lsp-setup-verification.md` - Verification procedures

### 2. LSP-Setup Command (`/lsp-setup`)

**Location:** `claude/commands/lsp-setup.md`

Automated Language Server Protocol toolchain setup for projects.

**What It Does:**
1. Detects languages used in the project (auto or explicit)
2. Checks system prerequisites (package managers, runtimes)
3. Verifies each required LSP server is installed
4. Prompts to install missing servers
5. Copies appropriate LSP hooks to `.claude/hooks.json`
6. Optionally appends LSP guidance to `CLAUDE.md`

**Usage Examples:**
```bash
/lsp-setup                      # Auto-detect and full setup
/lsp-setup typescript python    # Setup specific languages
/lsp-setup --verify-only        # Check LSP server status
/lsp-setup --skip-install       # Setup hooks only
```

**Supported Languages:** TypeScript/JavaScript, Python, Go, Rust, Java, Kotlin, C/C++, C#, PHP, Ruby, HTML/CSS, LaTeX, Markdown, Terraform

### 3. Language-Specific Hooks

**Location:** `claude/skills/lsp-enable/references/*-hooks.json`

Each supported language has hook configurations for:
- **Format-on-edit:** Automatic code formatting after edits
- **Lint-on-edit:** Validation and linting after edits
- **Type-checking:** Verify types after modifications
- **Pre-commit gates:** Block commits on quality failures

**Available Hook Files:**
- `typescript-hooks.json` - TypeScript/JavaScript hooks
- `python-hooks.json` - Python hooks (ruff, pyright)
- `rust-hooks.json` - Rust hooks (rustfmt, clippy)
- `go-hooks.json` - Go hooks (gofmt, go vet)

### 4. Language-Specific LSP Sections

**Location:** `claude/skills/lsp-enable/references/*-lsp-section.md`

Comprehensive LSP workflow guidance for each language, including:
- Navigation and verification workflows
- Pre-edit checklists
- Language-specific quality gates
- Tool-specific configurations

**Available Sections:**
- TypeScript/JavaScript
- Python
- Rust
- Go
- And more...

## The Nine LSP Operations

| Operation | Purpose | Use Before |
|-----------|---------|------------|
| `goToDefinition` | Jump to where symbol is defined | Modifying unfamiliar code |
| `findReferences` | Find all usages of a symbol | Refactoring, renaming |
| `goToImplementation` | Find interface implementations | Working with polymorphism |
| `hover` | Get type info, docs, signatures | Understanding APIs |
| `documentSymbol` | List all symbols in a file | Understanding large files |
| `workspaceSymbol` | Search symbols across codebase | Finding related code |
| `prepareCallHierarchy` | Get call hierarchy info | Analyzing call graphs |
| `incomingCalls` | Find callers of a function | Impact analysis |
| `outgoingCalls` | Find functions called by target | Dependency tracing |

## Pre-Edit Protocol (Mandatory)

Before modifying ANY unfamiliar code:

```
1. NAVIGATE: LSP goToDefinition → understand implementation
2. ANALYZE: LSP findReferences → assess change impact
3. INSPECT: LSP hover → verify type signatures
4. THEN: Make changes
```

## Post-Edit Verification (Mandatory)

After code changes:

```
1. CHECK: LSP diagnostics for errors/warnings
2. VERIFY: No new type errors introduced
3. CONFIRM: Imports resolve correctly
4. VALIDATE: Interface contracts still satisfied
```

## LSP vs Grep/Glob Decision Tree

```
WHAT DO YOU NEED?
│
├─ Symbol definition or implementation
│  └─ USE LSP: goToDefinition, goToImplementation
│
├─ All usages of a symbol
│  └─ USE LSP: findReferences
│
├─ Type info, docs, or signatures
│  └─ USE LSP: hover
│
├─ File structure or symbol list
│  └─ USE LSP: documentSymbol
│
├─ Call graph or dependencies
│  └─ USE LSP: incomingCalls, outgoingCalls
│
├─ Symbol search across workspace
│  └─ USE LSP: workspaceSymbol
│
├─ Literal text search (TODOs, strings, config)
│  └─ USE: Grep (LSP doesn't do text matching)
│
└─ File discovery by pattern
   └─ USE: Glob
```

## Why LSP Over Grep

| Metric | LSP | Grep |
|--------|-----|------|
| **Speed (large codebase)** | ~50ms | 45+ seconds |
| **Accuracy** | Exact semantic matches | Text patterns (false positives) |
| **Token usage** | ~500 tokens (precise) | Burns tokens on irrelevant matches |
| **Type resolution** | Follows aliases, re-exports | Text only |
| **Scope awareness** | Understands variable scope | Matches all text |

**Example:**
```
Grep "getUserById" → 500+ matches (comments, strings, similar names)
LSP findReferences → 23 matches (exact function usages only)
```

## Environment Setup

LSP operations require the `ENABLE_LSP_TOOL` environment variable:

```bash
# Add to shell profile (~/.bashrc, ~/.zshrc)
export ENABLE_LSP_TOOL=1

# Or add to Claude Code settings.json
{
  "env": {
    "ENABLE_LSP_TOOL": "1"
  }
}
```

## Integration with Existing Setup

The current `.claude/.lsp.json` already includes comprehensive LSP server configurations for:
- Bash, Python, TypeScript, Rust, JSON, YAML, HTML, CSS
- Markdown, Dockerfile, Go, C/C++, Java, Kotlin, Swift
- C#, Ruby, PHP, Elixir, Scala, R, Dart, Fish
- Biome, Ruff, TOML, Typos, Markdown-oxide

The LSP tools integration adds:
- **Enforcement protocols** for safe code modifications
- **Automated hooks** for format/lint/typecheck on edit
- **Language-specific workflows** for optimal LSP usage
- **Setup automation** via `/lsp-setup` command

## Quick Start

1. **Enable LSP:** Set `ENABLE_LSP_TOOL=1` in your environment
2. **Run Setup:** Execute `/lsp-setup` to configure project
3. **Use the Skill:** Invoke `/lsp-enable` when navigating code
4. **Follow Iron Laws:** Always use LSP before modifying code

## References

- Full skill documentation: `claude/skills/lsp-enable/SKILL.md`
- Setup command: `claude/commands/lsp-setup.md`
- Reference materials: `claude/skills/lsp-enable/references/`
- Upstream project: https://github.com/zircote/lsp-tools

## Token Optimization

**LSP is more expensive per-call but cheaper overall:**

| Scenario | Grep Cost | LSP Cost |
|----------|-----------|----------|
| Find method usages in 100-file project | 2000+ tokens (scanning output) | 500 tokens (exact matches) |
| Navigate to definition | Multiple grep attempts | Single LSP call |
| Understand type signatures | Read multiple files | Single hover call |

**Rule:** When codebase > 20 files, LSP saves tokens vs grep.
