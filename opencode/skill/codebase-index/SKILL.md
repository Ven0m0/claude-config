---
name: codebase-index
description: Index and search the codebase efficiently. Use when needing to understand code structure, find related files, or search across the entire repo.
---

# Codebase Index

## When to Use

- Initial codebase exploration
- Finding related code across multiple files
- Understanding imports and dependencies
- Locating specific patterns or functions

## Strategy

### 1. Structure Map

```bash
fd --type f --exclude "node_modules" --exclude "__pycache__" | head -200
```

### 2. Content Search

```bash
# Find definitions
rg "^def |^function |^class " --type py --type ts -n

# Find imports
rg "^import |^from |require\(" --type py --type js -n

# Find by pattern
rg "pattern" --type ts -n
```

### 3. Key Files

```bash
# Entry points and configs
fd --type f -e json -e yaml -e toml | grep -v node_modules | head -50
```

### 4. Related Tests

```bash
fd "test_.*\.py$|.*_test\.go$|.*\.spec\.(ts|js)$"
```

## Notes

- File structure: one-time per session
- Search results: fresh each time
