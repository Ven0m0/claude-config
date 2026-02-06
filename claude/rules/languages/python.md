---
paths:
  - "**/*.py"
  - "**/pyproject.toml"
  - "**/requirements*.txt"
---

# Python Rules

Version: Python 3.12+

## Package Management - UV ONLY

**MANDATORY: Use `uv` for ALL Python package operations. NEVER use `pip` directly.**

```bash
uv pip install package-name
uv pip install -r requirements.txt
uv run python script.py
uv run pytest
```

**If you type `pip`:** STOP. Use `uv pip` instead.

## Tooling

| Tool | Purpose | Command |
|------|---------|---------|
| ruff | Linting + formatting (replaces flake8, isort, black) | `ruff check . --fix && ruff format .` |
| basedpyright | Type checking (strict mode) | `basedpyright src` |
| pytest | Testing (>=80% coverage) | `uv run pytest -q` |
| bandit | Security scanning | `bandit -r src/` |

## Ruff Configuration

```toml
# pyproject.toml
[tool.ruff]
line-length = 88
select = ["E", "F", "I", "B", "ANN", "S"]  # errors, pyflakes, isort, bugbear, annotations, security

[tool.ruff.lint.per-file-ignores]
"tests/*" = ["S101"]  # allow assert in tests
```

## Testing - Minimal Output

**Always use minimal output flags to avoid context bloat.**

```bash
uv run pytest -q                                    # Quiet mode (preferred)
uv run pytest -q --tb=short                         # Short tracebacks on failure
uv run pytest -q --cov=src --cov-fail-under=80     # Coverage with quiet mode
uv run pytest -q -m unit                            # Unit only, quiet
```

Avoid `-v`, `--verbose`, `-vv`, `-s` unless actively debugging a specific test.

## Code Style

- **Type hints**: Required on all public function signatures
- **Docstrings**: One-line for most functions; multi-line only for complex logic
- **Imports**: stdlib -> third-party -> local (ruff auto-sorts with `ruff check . --fix`)
- **Comments**: Self-documenting code; comments only for complex algorithms or workarounds

## Best Practices

- Use Pydantic v2 with model_validator for cross-field validation
- Use SQLAlchemy 2.0 async patterns with create_async_engine
- Use pytest-asyncio with asyncio_mode="auto"
- Use `@pytest.mark.unit` and `@pytest.mark.integration` markers
- Dependencies in `pyproject.toml` (not requirements.txt)

## Verification Checklist

Before completing Python work:

- [ ] Used `uv` for all package operations
- [ ] Tests pass: `uv run pytest -q`
- [ ] Code formatted: `ruff format .`
- [ ] Linting clean: `ruff check .`
- [ ] Type checking: `basedpyright src`
- [ ] Coverage >= 80%

## Quick Reference

| Task | Command |
|------|---------|
| Install package | `uv pip install package-name` |
| Run tests | `uv run pytest -q` |
| Coverage | `uv run pytest --cov=src` |
| Format | `ruff format .` |
| Lint + fix | `ruff check . --fix` |
| Type check | `basedpyright src` |
| Security scan | `ruff check --select S && bandit -r src/` |
| Run script | `uv run python script.py` |

## Related skills

- Use skills under `claude/skills/` for detailed patterns (python-optimization, python-project-development).
