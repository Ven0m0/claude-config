---
name: building-python-cli-tools
description: Builds production-ready Python CLI tools with strict typing, performance optimization, and stdlib-only dependencies. Use when creating CLI tools, automation scripts, or utilities. Triggers include "CLI tool", "Python utility", "argparse", "click", or "command-line script".
---

# Python CLI Builder

Build efficient, typed, production-ready Python scripts following strict standards.

## Core Template

Every script starts with this foundation:

```python
#!/usr/bin/env python3
"""Brief description of what this script does."""
import sys
from pathlib import Path
from dataclasses import dataclass
from typing import Final

# Use scripts/cli_template.py as the starting point
```

## Standards Applied

- **Types**: All functions typed (`-> ReturnType`), `dataclass(slots=True)` for data
- **Performance**: O(n) algorithms, frozenset for lookups, generators for large data
- **Stdlib-first**: Zero external deps unless justified (see references/stdlib_perf.md)
- **Exit codes**: 0=success, 1=error, 2+=specific failures
- **Error handling**: Catch specific exceptions, fail fast, clear messages

## Reusable Components

Use these battle-tested components from `scripts/`:

- `cli_template.py` - Production CLI scaffold with argparse + examples
- `log_component.py` - ANSI colored logging (info/ok/warn/err/progress)
- `subprocess_helpers.py` - Safe subprocess wrappers with retry/timeout
- `common_utils.py` - has(), find_files(), safe file ops

## Performance Optimization

Consult `references/stdlib_perf.md` for:

- File scanning: `fd` subprocess vs `os.walk` vs `Path.glob`
- Data structures: `frozenset` vs `set`, `dict` lookups vs linear search
- String ops: `str.translate` vs regex, precompile patterns
- Memory: generators vs lists, `sys.stdin.read()` for large input
- External tools: When to shell out to fd/rg/parallel

## Workflow

1. **Start with template**: Copy `scripts/cli_template.py` as baseline
1. **Add components**: Import from `log_component.py`, `subprocess_helpers.py` as needed
1. **Optimize**: Check `references/stdlib_perf.md` for bottlenecks
1. **Verify**: Type check, test exit codes, validate error paths

## Project Structure Pattern

```python
@dataclass(frozen=True, slots=True)
class Config:
  """Immutable configuration."""
  input_dir: Path
  max_size: int = 1000
  verbose: bool = False

def main() -> int:
  """Entry point. Returns exit code."""
  try:
    # Parse args
    # Validate input
    # Process
    return 0
  except ValueError as e:
    print(f"Error: {e}", file=sys.stderr)
    return 1

if __name__ == "__main__":
  sys.exit(main())
```

## Security Checklist

- [ ] No hardcoded secrets/paths
- [ ] Validate all user input (paths, patterns)
- [ ] Use `Path.resolve()` to prevent traversal
- [ ] Catch `PermissionError`, `FileNotFoundError`
- [ ] Timeout on subprocess calls
- [ ] No `eval()`, `exec()`, `__import__()`
