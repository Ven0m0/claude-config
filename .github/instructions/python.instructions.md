---
applyTo: "**/*.py"
---

Python in this repository targets `>=3.14`. All tooling runs through `uv`.

- Run Python commands as `uv run <cmd>`, never bare `python` or `pip`.
- Format and lint with `uv run ruff format <path>` and `uv run ruff check <path>`.
- Type-check changed files with `uv tool run basedpyright <path>` or `uv tool run ty check <path>`.
- Add type hints to all changed public functions and non-trivial helpers.
- Follow Ruff config in `pyproject.toml`: line length 88, 4-space indent, double quotes.
- Run tests with `uv run pytest <target>` scoped to the changed area.
- Prefer absolute imports when the package layout supports them.
- Never use bare `except:` — always catch a specific exception type.
