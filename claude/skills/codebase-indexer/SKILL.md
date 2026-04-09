---
name: codebase-indexer
description: Build a token-efficient codebase index before deep analysis or handoff. Use when you need a reusable map of symbols, files, and packed context for large repositories.
allowed-tools: Bash, Read, Grep, Glob
user-invocable: false
---

# Codebase Indexer

Create a compact index that separates structural discovery from full-content reads.

## Use this skill when

- a repo is too large for naive full-file reads
- you need a symbol or file inventory before planning changes
- you want a reusable handoff artifact for another model or agent
- you need token-aware codebase context instead of ad hoc search results

## Pipeline

1. **Scan structure first**
   - Prefer Serena symbol tools when available.
   - Otherwise use `ast-grep` plus `tree-sitter`-style structural extraction to map files, symbols, and stable anchors.
2. **Build the index**
   - Record file paths, symbol names, line ranges, ownership hints, and high-value entry points.
   - Keep this pass structural; do not dump full files unless the file is small or critical.
3. **Pack selected slices**
   - Use the repo's `repomix` workflow to bundle only the relevant subtrees or filtered files.
   - Keep the packed output scoped to the feature, subsystem, or question being studied.
4. **Shape the output**
   - Convert repeated records, inventories, or symbol tables into TOON-style summaries when token budget matters.
   - Keep prose short and let the structured output carry the detail.
5. **Persist only when useful**
   - Default to ephemeral session output.
   - For repeat work, store the index in SQLite locally or Turso remotely so later sessions can query file and symbol metadata without rebuilding everything.

## Minimal command set

```bash
# Structural scan
ast-grep --lang ts -p 'class $NAME { $$$BODY }' src/
tree-sitter tags src/**/*.ts

# Filtered pack
repomix --include "src/**,docs/**" --style markdown -o index-pack.md

# Output shaping
cat index-pack.md | toon
```

## Output contract

Return:

1. top-level file map
2. important symbols with file and range
3. packed artifact path or scope
4. compressed summary format used
5. persistence choice, if any

## Reference-only inputs

- `token-pilot` is a useful external MCP pattern for AST-aware lazy reads and token-budget reduction.
- Do not add it to tracked repo settings by default; use it as design input for the indexing workflow instead.

## Notes

- Favor symbol indexes over raw dumps.
- Rebuild only the changed slice after edits.
- Keep handoff artifacts small enough for the next model to consume directly.
