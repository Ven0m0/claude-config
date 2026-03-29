---
name: python-best-practices
description: Apply Python best practices including type hints, error handling, and modern tooling. Use when writing or reviewing Python code.
---

# Python Best Practices

## Type Hints

Always use type hints for function signatures:

```python
def process_data(items: list[dict[str, Any]]) -> dict[str, int]:
    ...
```

Use:
- `list[T]` instead of `List[T]` (Python 3.9+)
- `dict[K, V]` instead of `Dict[K, V]`
- `|` for unions instead of `Union` (Python 3.10+)

## Error Handling

Use specific exceptions and avoid bare except:

```python
# Good
try:
    result = process()
except ValueError as e:
    logger.error(f"Invalid value: {e}")
    raise

# Bad
try:
    result = process()
except:  # Too broad
    pass
```

## Tooling

**Ruff** - Modern Python linter and formatter:
```bash
ruff check .
ruff format .
```

**uv** - Fast Python package manager:
```bash
uv sync --dev
uv run pytest
```

**BasedPyright** - Type checker:
```bash
basedpyright
```

## Project Structure

```
my-project/
├── src/
│   └── my_package/
│       ├── __init__.py
│       └── module.py
├── tests/
│   ├── __init__.py
│   └── test_module.py
├── pyproject.toml
└── README.md
```

## pyproject.toml Essentials

```toml
[project]
name = "my-project"
version = "0.1.0"
dependencies = []

[project.optional-dependencies]
dev = ["pytest", "ruff", "basedpyright"]

[tool.ruff]
line-length = 88

[tool.ruff.lint]
select = ["E", "F", "I", "UP"]
```

## Testing

Use pytest with descriptive test names:

```python
def test_process_data_returns_expected_result() -> None:
    # Arrange
    data = {"key": "value"}
    
    # Act
    result = process_data(data)
    
    # Assert
    assert result == expected
```
