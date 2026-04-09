# Testing Rules

## Test Runner by Plugin

| Plugin | Runner | Command |
|--------|--------|---------|
| `plugins/conserve/` | pytest | `uv run pytest plugins/conserve/tests/ -v` |
| `plugins/prompt-improver/` | pytest | `uv run pytest plugins/prompt-improver/tests/ -v` |
| `plugins/dependency-blocker/` | bats | `bats plugins/dependency-blocker/tests/*.bats` |
| `plugins/plugin-validator/` | node | `node plugins/plugin-validator/test.js` |

## Scope Rules

- Run the narrowest test target that covers the changed code
- Never run the full suite when only one plugin changed
- Single test: `uv run pytest path/to/test_file.py::test_name -v`
- Pattern match: `uv run pytest plugins/conserve/tests/ -k "pattern" -v`

## Mocking Policy

- Do not mock filesystem operations in integration tests — use real temp dirs (`tmp_path` fixture)
- Do not mock subprocess calls unless the subprocess modifies system state
- Mock only at system boundaries (network calls, external APIs)

## Test File Placement

- Unit tests: `plugins/<name>/tests/unit/`
- Integration tests: `plugins/<name>/tests/integration/`
- Test filenames: `test_<module>.py` for pytest, `test-<name>.bats` for bats

## Coverage Expectations

- New public functions in plugins must have at least one happy-path test
- Error paths for input validation must be tested
- Do not add tests that only verify Python/JS syntax (type-checkers handle that)
