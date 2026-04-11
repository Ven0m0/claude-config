# Code Style Rules

Enforced by `.editorconfig`, `pyproject.toml [tool.ruff]`, `biome.json`, and `tsconfig.json`.

## Indentation

- Python: 4 spaces (enforced by Ruff, line length 88)
- JS/TS/JSON/YAML/Markdown: 2 spaces (enforced by Biome, line length 120)
- Makefile and `*.mk`: tabs only
- Shell: 2 spaces (editorconfig)

## Encoding and Line Endings

- All files: UTF-8, LF line endings, trailing newline required
- Exception: `*.patch`, `*.diff` — no trailing newline, no trimmed whitespace

## Quotes

- Python: double quotes (Ruff default)
- JS/TS: single quotes (Biome config)
- YAML: double quotes where ambiguous

## Naming

- Python functions/variables: `snake_case`; classes: `PascalCase`; constants: `UPPER_SNAKE_CASE`
- JS/TS functions/variables: `camelCase`; classes/components: `PascalCase`
- Agent files: `hyphenated-name.md`
- Skill directories: `hyphenated-name/`
- Python modules: `snake_case.py`
- Plugin directories: `kebab-case/`

## Forbidden Patterns

- Trailing whitespace in any source file (except `.patch`, `.diff`, Markdown)
- Wildcard imports (`from x import *` in Python, `import * from` in JS/TS)
- `eval()` in any language
- Magic numbers without named constants
- Files longer than 800 lines without documented justification
