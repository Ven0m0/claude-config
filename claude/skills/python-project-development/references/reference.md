# Python Packaging Reference (Compact)

## Recommended structure

```text
project/
  pyproject.toml
  src/<package_name>/
  tests/
```

## pyproject essentials

- `build-system`
- `project` (`name`, `version`, `requires-python`, `dependencies`)
- optional: `project.scripts` for CLI entry points

## Validation checklist

1. `uv run ruff check .`
2. `uv run pytest`
3. `uv run python -m build`
4. install built wheel in clean env before release

## Canonical docs

- Packaging guide: https://packaging.python.org/
- uv docs: https://docs.astral.sh/uv/
- Ruff docs: https://docs.astral.sh/ruff/
