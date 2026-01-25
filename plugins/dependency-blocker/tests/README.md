# Testing Guide

This directory contains BATS (Bash Automated Testing System) tests for the dependency-blocker plugin hooks.

## Prerequisites

You need to have BATS installed to run the tests.

### Installing BATS

**macOS (using Homebrew):**

```bash
brew install bats-core
```

**Ubuntu/Debian:**

```bash
sudo apt-get install bats
```

**Using npm:**

```bash
bun install -g bats
```

**From source:**

```bash
git clone https://github.com/bats-core/bats-core.git
cd bats-core
sudo ./install.sh /usr/local
```

## Running Tests

### Run all tests:

```bash
bats tests/*.bats
```

### Run specific test suite:

```bash
bats tests/test-bash-validate.bats
bats tests/test-read-validate.bats
bats tests/test-glob-validate.bats
bats tests/test-grep-validate.bats
```

### Run from the plugin root directory:

```bash
cd plugins/dependency-blocker
bats tests/*.bats
```

### Verbose output:

```bash
bats --tap tests/test-bash-validate.bats
```

### Run specific test by pattern:

```bash
bats tests/test-bash-validate.bats --filter "node_modules"
```

## Test Structure

The test suite consists of four test files plus a shared helper file:

### Shared Helpers: **test_helper.bash**

Common testing utilities used by all test files:

- `assert_blocked()` - Assert exit code 2 and "Blocked" in output
- `assert_allowed()` - Assert exit code 0
- `test_bash_command()` / `test_bash_json_command()` - Test bash commands
- `test_read_path()` / `test_read_json_path()` - Test file paths
- `test_glob_pattern()` - Test glob patterns
- `test_grep_path()` - Test grep search paths
- `create_json()` - Generate JSON payloads for hook mode testing

### 1. **test-bash-validate.bats** (20 tests)

Tests for `bash-validate.sh` - validates Bash tool commands

- Blocks: Direct access to `node_modules`, `.git`, `dist`, `build`, `vendor`, `target`, `.venv`, `venv`
- Allows: Trusted tool invocations (npm, yarn, cargo, make, etc.)
- Allows: Safe navigation commands (cd, pwd, pushd, popd) when not targeting excluded dirs
- Tests command chains with `&&`, `||`, and `;` separators
- Tests both CLI mode and JSON/hook mode

### 2. **test-read-validate.bats** (8 tests)

Tests for `read-validate.sh` - validates Read tool file paths

- Blocks: File paths containing excluded directories
- Allows: Normal file paths in safe directories
- Tests both CLI mode and JSON/hook mode

### 3. **test-glob-validate.bats** (6 tests)

Tests for `glob-validate.sh` - validates Glob tool patterns

- Blocks: Glob patterns targeting excluded directories
- Allows: Normal glob patterns in safe directories

### 4. **test-grep-validate.bats** (4 tests)

Tests for `grep-validate.sh` - validates Grep tool patterns

- Blocks: Grep operations in excluded directories
- Allows: Normal grep operations in safe directories

### Edge Cases Covered

- Similar directory names (e.g., `node_module` vs `node_modules`)
- Files vs directories (e.g., `.gitignore` vs `.git/`)
- Partial matches (e.g., `builds.ts` vs `build/`)
- Nested paths (e.g., `src/node_modules/package.json`)

**Total: 38 tests**

## Expected Output

When all tests pass, you'll see output like:

```
# Running all test suites
1..38
 ✓ blocks ls on excluded directories
 ✓ blocks find in excluded directories
 ✓ blocks cat from excluded directories
 ...
 ✓ JSON mode: allows safe file paths

38 tests, 0 failures
```

## Adding New Tests

The refactored test suite uses data-driven testing with helper functions. To add new tests:

### Adding to an existing test group:

Simply add your command to the relevant array:

```bash
@test "blocks ls on excluded directories" {
    local -a commands=(
        "ls node_modules"
        "ls vendor"
        "ls dist"
        "ls your_new_excluded_dir"  # Add here
    )

    for cmd in "${commands[@]}"; do
        test_command "$cmd"
        assert_blocked || {
            echo "Failed to block: $cmd" >&2
            return 1
        }
    done
}
```

### Creating a new test:

Use the helper functions for consistency:

```bash
@test "your test description" {
    test_command "your command here"
    assert_blocked  # or assert_allowed
}
```

### Available helpers (from test_helper.bash):

**Assertions:**

- `assert_blocked` - Assert exit code 2 and "Blocked" in output
- `assert_allowed` - Assert exit code 0

**Bash testing:**

- `test_bash_command "cmd"` - Test bash command in CLI mode
- `test_bash_json_command "cmd"` - Test bash command in JSON/hook mode

**Read testing:**

- `test_read_path "path"` - Test file path in CLI mode
- `test_read_json_path "path"` - Test file path in JSON/hook mode

**Glob testing:**

- `test_glob_pattern "pattern" ["path"]` - Test glob pattern

**Grep testing:**

- `test_grep_path "path"` - Test grep search path

**JSON generation:**

- `create_json "tool_name" "param_name" "value"` - Generate JSON payload

## Continuous Integration

To run these tests in CI, ensure BATS is installed and add to your CI config:

```yaml
# Example GitHub Actions
- name: Install BATS
  run: bun install -g bats

- name: Run tests
  run: bats plugins/dependency-blocker/tests/*.bats
```

## Troubleshooting

**Tests fail with "permission denied":**

```bash
chmod +x plugins/dependency-blocker/scripts/*.sh
```

**BATS command not found:**
Make sure BATS is installed and in your PATH. Try reinstalling using one of the methods above.

**Test fails but no specific command shown:**
The data-driven tests will show which command failed in the error output. Look for the "Failed to block:" or "Failed to allow:" message.
