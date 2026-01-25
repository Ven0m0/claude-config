# Block Dotfiles Plugin - Test Suite

Comprehensive test suite for the block-dotfiles plugin validation scripts.

## Test Structure

The test suite uses [BATS (Bash Automated Testing System)](https://github.com/bats-core/bats-core) to verify that all validation scripts correctly block access to sensitive dotfiles while allowing normal operations.

### Test Files

- **test-bash-validate.bats** - Tests for Bash command validation
- **test-read-validate.bats** - Tests for Read operation validation
- **test-glob-validate.bats** - Tests for Glob pattern validation
- **test-grep-validate.bats** - Tests for Grep search validation

## Running Tests

### Prerequisites

Install BATS:

```bash
# macOS
brew install bats-core

# Ubuntu/Debian
sudo apt-get install bats

# npm
npm install -g bats
```

### Run All Tests

```bash
# From plugin root directory
make test

# Or directly with bats
bats tests/*.bats
```

### Run Individual Test Suites

```bash
bats tests/test-bash-validate.bats
bats tests/test-read-validate.bats
bats tests/test-glob-validate.bats
bats tests/test-grep-validate.bats
```

## Test Coverage

Each test suite covers:

### 1. Blocking Scenarios

Tests that verify the script blocks access to sensitive files:

- `.bashrc`, `.zshrc`, `.bash_profile`, `.zsh_profile`
- `.env`, `.env.local`, `.env.production`, `.env.development`
- `.ssh/` directory and SSH keys
- `.aws/` directory and AWS credentials
- `.npmrc`, `.pypirc`, `.gitconfig`
- `.docker/` directory and Docker credentials
- Absolute and relative paths
- Nested paths

### 2. Allowing Scenarios

Tests that verify the script allows normal operations:

- Regular source files
- Configuration directories
- Files with similar names (e.g., `environment.js` vs `.env`)
- Standard project files

### 3. Input Modes

Each validation script is tested with:

- **Command-line arguments** - Direct testing mode
- **JSON input via stdin** - Production hook mode

### 4. Edge Cases

- Empty inputs
- Missing parameters
- Malformed JSON
- Graceful handling of unexpected inputs

## Test Statistics

- **test-bash-validate.bats**: 26 tests
- **test-read-validate.bats**: 28 tests
- **test-glob-validate.bats**: 26 tests
- **test-grep-validate.bats**: 24 tests

**Total: 104 tests**

## Example Test Output

```
✓ blocks read from .bashrc
✓ blocks read from .zshrc
✓ blocks read from .env
✓ blocks read from .env.local
✓ blocks read from .ssh directory
✓ allows read from regular file
✓ allows read from README.md
✓ JSON: blocks read from .env
✓ JSON: allows read from regular file
✓ handles empty input gracefully

104 tests, 0 failures
```

## Writing New Tests

When adding new sensitive files to block:

1. Add the file to `SENSITIVE_FILES` array in all validation scripts
1. Add blocking tests for both command-line and JSON modes
1. Add tests for both simple filename and nested paths
1. Verify edge cases (similar names that should be allowed)

Example test structure:

```bash
@test "blocks read from .newsensitivefile" {
    run "$SCRIPT" ".newsensitivefile"
    [ "$status" -eq 2 ]
    [[ "$output" =~ "Blocked" ]]
}

@test "allows read from newsensitivefile.js" {
    run "$SCRIPT" "newsensitivefile.js"
    [ "$status" -eq 0 ]
}
```

## Exit Codes

- `0` - Success, operation allowed
- `2` - Blocked, operation targets sensitive file
- Other codes indicate script errors

## Continuous Integration

To integrate with CI/CD:

```yaml
# Example GitHub Actions workflow
- name: Run tests
  run: |
    sudo apt-get install bats
    cd plugins/block-dotfiles
    make test
```
