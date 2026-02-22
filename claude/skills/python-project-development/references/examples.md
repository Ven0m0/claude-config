# Python Project Examples (Compact)

## CLI entry point

```python
import argparse
import sys

def main() -> int:
    parser = argparse.ArgumentParser(prog="my-tool")
    parser.add_argument("--name", required=True)
    args = parser.parse_args()
    print(f"hello {args.name}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
```

## pyproject snippet

```toml
[build-system]
requires = ["setuptools>=68"]
build-backend = "setuptools.build_meta"

[project]
name = "my-tool"
version = "0.1.0"
requires-python = ">=3.11"
dependencies = []

[project.scripts]
my-tool = "my_tool.cli:main"
```

## Development commands

```bash
uv sync
uv run ruff check .
uv run pytest
```
