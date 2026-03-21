---
name: codebase-index
description: Index and search the codebase efficiently. Use when needing to understand code structure, find related files, or search across the entire repo.
---

# Codebase Index

Build and query an index of the codebase for efficient searching and understanding.

## When to Use

- Initial codebase exploration
- Finding related code across multiple files
- Understanding imports and dependencies
- Locating specific patterns or functions
- Cross-reference analysis

## Available Tools

### Grep/Search
```bash
# Ripgrep for fast content search
rg "pattern" --type py --type ts -n

# Find files by name
fd "\.test\." --type f
```

### Structure Analysis
```bash
# Tree view
find . -type f -name "*.py" | head -50

# Import graph
rg "^import|^from" --type py -n | head -100
```

### Language-Specific Index
```bash
# Python
pip install pydeps 2>/dev/null && pydeps . --max-depth 2

# TypeScript/JavaScript
npx mrml . 2>/dev/null || true
```

## Indexing Strategy

### Step 1: Structure Map
```bash
# Get file tree (exclude deps)
fd --type f --exclude "node_modules" --exclude "__pycache__" --exclude "*.pyc" | head -200
```

### Step 2: Language Breakdown
```bash
# Count by language
fd --type f -e py -e ts -e js -e go -e rs | wc -l
```

### Step 3: Key Files
```bash
# Entry points and configs
fd --type f -e json -e yaml -e toml -e ini -e env | grep -v node_modules
```

## Query Patterns

### Find Function Definition
```bash
rg "^def |^function |^class " --type py --type ts -n
```

### Find Imports
```bash
rg "^import |^from |require\(|import\( " --type py --type js -n
```

### Find Tests for File
```bash
# Match test files to source
fd "test_.*\.py$|.*_test\.go$|.*\.spec\.\(ts\|js\)$"
```

## Caching

Keep index results for the session:
- File structure (one-time)
- Import relationships (update on changes)
- Search results (fresh each time)

## Notes/Inspiration

Inspired by [`opencode-codebase-index`](https://www.npmjs.com/package/opencode-codebase-index) - Codebase indexer for OpenCode.
