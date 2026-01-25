# Contributing

Thanks for contributing. This repository contains Claude Code plugins, skills, and documentation.

## Quick Start

1. Create a feature branch for your changes.
1. Keep changes focused and small.
1. Update documentation when behavior changes.
1. Run relevant tests or validation scripts.

## Guidelines

- Follow the repository tooling rules in `claude/CLAUDE.md`.
- Use ASCII text in documentation where possible.
- Avoid adding unnecessary dependencies or large binaries.
- Keep SKILL.md files under 500 lines when possible.

## Validation

If you change skills, run the validation helpers:

```bash
python3 /workspace/claude/scripts/fix-all-skills.py --dry-run --path /workspace
```

## Submit a Pull Request

Include a clear summary and a brief test plan.
