---
name: python-project-development
description: Builds and refactors production-ready Python CLI tools and packages with modern pyproject layouts, uv workflows, and robust testing.
compatibility: Designed for Claude Code
allowed-tools: Read, Grep, Glob, Bash
user-invocable: false
---

# Python Project Development (Lean)

## Use this skill when

- creating Python CLIs or packages
- setting up `pyproject.toml`
- preparing build/publish workflows
- tightening packaging, linting, and test gates

## Defaults

- Prefer `uv` for dependency and run workflows.
- Keep package layout `src/<package_name>/`.
- Use typed function signatures and explicit exit codes.
- Treat `ruff` + tests as baseline quality gates.

## Core workflow

1. Choose project type: CLI, library, or hybrid.
2. Scaffold minimal `pyproject.toml` and package layout.
3. Implement entry point and core module.
4. Add tests and lint config.
5. Validate build/install locally.

## Minimal commands

```bash
# Install project deps
uv sync

# Lint and format
uv run ruff check .
uv run ruff format .

# Test
uv run pytest

# Build artifacts
uv run python -m build
```

## Constraints

- No hardcoded secrets/paths.
- Avoid heavy dependencies without clear payoff.
- Keep packaging metadata accurate and minimal.

## References

- `references/reference.md`
- `references/examples.md`
- `references/patterns.md`
- `references/stdlib_perf.md`
