# Hooks TODO

Future hook ideas for this repo:

- Session end cleanup (e.g. temp files, cache)
- Quality gate (e.g. lint/type-check before commit)
- Post-tool: AST-grep or pattern scan
- Post-tool: code formatter (Prettier, ruff, etc.)
- Post-tool: linter
- Pre-compact: save context or state if needed
- Atomic write helper for hook scripts

Implement in `claude/hooks/` or `claude/hooks/scripts/` as needed.
