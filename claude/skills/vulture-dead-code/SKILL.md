---
model: haiku
name: vulture-dead-code
description: |
  Vulture and deadcode tools for detecting unused Python code (functions, classes, variables, imports).
  Use when cleaning up codebases, removing unused code, or enforcing code hygiene in CI.
  Triggered by: vulture, deadcode, dead code detection, unused code, code cleanup, remove unused.
---

# Vulture and deadcode - Dead Code Detection

Tools for finding unused Python code including functions, classes, variables, imports, and attributes.

## Quick Reference (30 seconds)

### Tool Comparison
| Feature | Vulture | deadcode |
|---------|---------|----------|
| **Approach** | Static analysis + confidence scores | AST-based detection |
| **Accuracy** | Confidence scores (60-100%) | High accuracy, fewer false positives |
| **Best For** | Large codebases, gradual cleanup | New projects, strict enforcement |

### Installation
```bash
uv add --dev vulture deadcode  # Install both
```

### Basic Commands
```bash
# Vulture - confidence-based
vulture --min-confidence 80 .
vulture --make-whitelist > vulture_whitelist.py

# deadcode - AST-based
deadcode .
deadcode --show-unreachable .
```

---

## Implementation Guide (5 minutes)

### Vulture Configuration

**pyproject.toml:**
```toml
[tool.vulture]
min_confidence = 80
paths = ["src", "tests"]
exclude = ["**/migrations/*", "**/__pycache__/*", ".venv/*"]
ignore_decorators = ["@app.route", "@pytest.fixture", "@property", "@staticmethod", "@classmethod"]
ignore_names = ["test_*", "setUp*", "tearDown*"]
```

**Whitelist pattern** (`vulture_whitelist.py`):
```python
# Used by external code
_.used_by_external_lib  # confidence: 60%
# Framework magic
class Meta: pass  # Django/Flask metadata
# Plugin system
def plugin_hook(): pass  # Called by plugin system
```

### deadcode Configuration

**pyproject.toml:**
```toml
[tool.deadcode]
paths = ["src"]
exclude = ["tests/*", "migrations/*"]
ignore_decorators = ["app.route", "pytest.fixture", "property"]
ignore_names = ["test_*", "*Factory", "*Schema"]
```

### Understanding Confidence Scores
| Score | Meaning | Action |
|-------|---------|--------|
| 100% | Definitely unused | Safe to remove |
| 80% | Likely unused | Review before removing |
| 60% | Possibly unused | Might be dynamic/external |

---

## Common Patterns

### Unused Imports
```python
import sys  # FOUND: confidence 100%
import logging  # USED: logger = logging.getLogger(__name__)
```

### Unused Functions
```python
def unused_helper(): pass  # FOUND: never called
def used_helper(): pass    # USED: result = used_helper()
```

### False Positive Handling
```python
# Dynamic access - whitelist needed
obj = getattr(module, 'dynamic_function')

# Framework callbacks - ignore decorator
@app.route('/api/endpoint')
def api_handler(): pass

# Test utilities - ignore pattern
def create_test_user(): pass  # test_*
```

---

## CI Integration

### GitHub Actions
```yaml
name: Dead Code Check
on: [push, pull_request]
jobs:
  deadcode:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v2
      - run: uv python install 3.12
      - run: uv sync --all-extras --dev
      - run: uv run vulture . --min-confidence 80 vulture_whitelist.py
      - run: uv run deadcode .
```

### Pre-commit Hook
```yaml
repos:
  - repo: https://github.com/jendrikseipp/vulture
    rev: v2.11
    hooks:
      - id: vulture
        args: ['--min-confidence', '80']
        files: ^src/
  - repo: https://github.com/albertas/deadcode
    rev: v2.0.0
    hooks:
      - id: deadcode
        files: ^src/
```

---

## Best Practices

1. **Start with high confidence** (90%), gradually lower to 80%, then 70%
2. **Use whitelists** for framework callbacks, plugin hooks, dynamic access
3. **Document whitelist reasons** - explain WHY each item is whitelisted
4. **Integrate into CI** - catch dead code on every PR
5. **Review before removing** - verify no dynamic/external usage

### When to Choose
| Use Vulture | Use deadcode |
|-------------|--------------|
| Large/mature codebases | New projects |
| Gradual cleanup | Strict enforcement |
| Complex dynamics (getattr, exec) | AST accuracy needed |
| Need whitelist management | Unreachable code detection |

### Hybrid Approach
```bash
vulture --min-confidence 80 .  # Broad detection
deadcode .                      # Precise detection
# Compare results, whitelist false positives
```

---

## Works Well With

**Tools**: ruff (unused imports), mypy (type checking), pytest-cov (coverage)
**Skills**: python-optimization, linter-autofix, code-antipatterns-analysis
**Agents**: janitor, code-simplifier

---

## Reference

- [Vulture docs](https://github.com/jendrikseipp/vulture)
- [deadcode docs](https://github.com/albertas/deadcode)
- [Full configuration examples](reference.md)
