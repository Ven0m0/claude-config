---
name: ast-grep-search
description: Performs structural code search and safe rewrite planning with ast-grep. Use when pattern matching must follow AST structure instead of plain text.
compatibility: Designed for Claude Code
allowed-tools: Read, Grep, Glob, Bash
user-invocable: false
---

# ast-grep Search and Refactor

## Use this skill when

- regex/`rg` matching is too fragile
- refactors need placeholder captures (`$VAR`, `$$$ARGS`)
- you need language-aware code pattern detection

## Decision rule

- Literal text search -> `rg`
- Syntax tree structure search -> `ast-grep`

## Core workflow

1. Define a minimal structural pattern.
2. Run search scoped to target paths/language.
3. Review match set before rewrite.
4. Apply rewrite interactively or with update-all if safe.
5. Re-run tests/lints after rewrite.

## Minimal command set

```bash
# Search
ast-grep -p 'pattern' --lang ts src/

# Preview rewrite
ast-grep -p 'old($$$ARGS)' -r 'new($$$ARGS)' --lang ts src/

# Interactive rewrite
ast-grep -p 'old($$$ARGS)' -r 'new($$$ARGS)' --lang ts -i src/

# Apply all rewrites
ast-grep -p 'old($$$ARGS)' -r 'new($$$ARGS)' --lang ts -U src/
```

## Constraints

- Always limit path scope.
- Prefer interactive mode for large rewrites.
- Never run destructive rewrites without a preview.

## References

- `reference.md`
- `examples.md`
- `rules/` (ready-to-use scan rules)
