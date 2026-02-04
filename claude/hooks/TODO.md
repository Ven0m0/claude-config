# Hooks TODO

Future hook ideas for this repo:

- Session end cleanup (e.g. temp files, cache)
- ~~Quality gate (e.g. lint/type-check before commit)~~ - Done: `scripts/quality_gate.py`
- Post-tool: AST-grep or pattern scan
- ~~Post-tool: code formatter (Prettier, ruff, etc.)~~ - Done: `scripts/prettier_formatting.py`, `scripts/bash_formatting.py`, etc.
- ~~Post-tool: linter~~ - Done: `scripts/python_code_quality.py`
- Pre-compact: save context or state if needed
- Atomic write helper for hook scripts

Implement in `claude/hooks/` or `claude/hooks/scripts/` as needed.
