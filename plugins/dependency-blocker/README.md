# Dependency Blocker Plugin

Prevents Claude from accessing dependency directories to save tokens and improve performance.

## Overview

The Dependency Blocker plugin automatically blocks Claude Code from reading or executing bash commands that access common dependency and build directories. This prevents token waste when Claude attempts to search through large directories like `node_modules`, `.git`, `dist`, or `build`.

## Features

### Core Validation Hooks

- **Bash Command Validation**: Intelligent bash command validation with trusted tools, safe commands, and comprehensive checks
- **Read Validation**: Prevents file reads from excluded directories
- **Glob Validation**: Blocks glob patterns that target excluded directories
- **Grep Validation**: Blocks grep searches in excluded directories

### Advanced Bash Validation Features

- **Trusted Tools**: Allows package managers and build tools (npm, yarn, cargo, make, pip, etc.) to manage their own directories
- **Safe Navigation**: Permits navigation commands (pwd, pushd, popd) while blocking `cd` into excluded directories
- **Command Checking**: Validates file access commands (ls, cat, grep, find, head, tail, tree, du, etc.) for excluded directory references
- **Chain Analysis**: Validates command chains using `&&`, `||`, `;`, and `|` operators
- **Shell Feature Protection**: Blocks dangerous features that could bypass validation:
  - Command substitution (`$(...)` or backticks)
  - Process substitution (`<(...)` or `>(...)`)
  - Brace expansion with excluded directories
  - Variable assignments to excluded directories
- **Redirection Checking**: Validates redirection operators (`>`, `<`, `>>`, `<<`)
- **Smart Path Matching**: Detects excluded directories as complete path components with wildcard support

### General Features

- **Proactive Context Provision**: SessionStart hook informs Claude about limitations upfront
- **Configurable**: Easy to customize excluded directory patterns
- **Token Efficient**: Saves significant tokens by preventing unnecessary directory access
- **Comprehensive Testing**: 56 BATS tests ensuring reliable validation

## Installation

### From Marketplace

```shell
/plugin install dependency-blocker@wombat9000-marketplace
```

## Blocked Directories

By default, the following directories are blocked (critical bloat offenders that cause massive token waste):

### JavaScript/Node.js

- `node_modules` - Can contain 100k+ dependency files

### Version Control

- `.git` - Entire repository history

### Multi-Language Dependencies

- `vendor` - PHP/Go/Ruby dependencies (like node_modules)

### Build Outputs

- `target` - Rust/Java compiled artifacts
- `dist` - Minified/compiled/bundled output
- `build` - Compiled artifacts and assets

### Python

- `.venv` - Python virtual environment (entire stdlib + packages)
- `venv` - Python virtual environment (alternate name)

## Command Categories

### Trusted Tools (Always Allowed)

These package managers and build tools are trusted to manage their own directories:

- **JavaScript/Node.js**: npm, yarn, pnpm
- **Rust**: cargo
- **Go**: go
- **Python**: python, pip
- **Ruby**: ruby
- **Java**: java, gradle, maven
- **Build**: make

### Safe Navigation Commands

- pwd - Print working directory
- pushd - Push directory onto stack
- popd - Pop directory from stack
- cd - Change directory (allowed except when navigating TO excluded directories)

### Checked Commands

These file access commands are validated for excluded directory references:

- **Listing**: ls, tree
- **Reading**: cat, head, tail, less, more
- **Searching**: grep, find, rg (ripgrep), ag (silver searcher), ack
- **Analysis**: du, stat, file, wc, diff
- **Processing**: sort, uniq, cut, awk, sed

## Customization

### Adding Excluded Directories

To add more directories to the exclusion list, edit the `EXCLUDED_DIRS` array in all validation scripts:

**scripts/bash-validate.sh**, **scripts/read-validate.sh**, **scripts/glob-validate.sh**, and **scripts/grep-validate.sh**:

```bash
EXCLUDED_DIRS=(
    "node_modules"
    ".git"
    "vendor"
    "target"
    ".venv"
    "venv"
    "dist"
    "build"
    # Add your own directories here:
    # "__pycache__"
    # ".pytest_cache"
    # "coverage"
)
```

### Customizing Bash Validation

In **scripts/bash-validate.sh**, you can also customize:

**Trusted Tools** (always allowed):

```bash
TRUSTED_TOOLS=(
    "npm" "yarn" "pnpm" "cargo" "make"
    "python" "go" "ruby" "java" "gradle" "maven" "pip"
    # Add your build tools here
)
```

**Checked Commands** (validated for excluded directories):

```bash
CHECKED_COMMANDS=(
    "ls" "cat" "grep" "find" "head" "tail"
    "less" "more" "tree" "du" "stat" "file"
    "wc" "diff" "sort" "uniq" "cut" "awk" "sed"
    "rg" "ag" "ack"
    # Add commands to validate here
)
```

## How It Works

The plugin uses a SessionStart hook for proactive context provision and four PreToolUse validation hooks that intercept operations before tool execution:

### 0. SessionStart Hook

Provides upfront context to Claude about the plugin's limitations:

- Informs Claude about blocked directories at session start
- Lists allowed package managers and build tools
- Explains rationale for blocking (token savings)
- Recommends using package manager commands instead of file access commands
- Runs once per session, before any tools are executed

### 1. Bash Hook

The bash validation hook uses intelligent command analysis:

- **Allows** trusted tool invocations (npm, yarn, cargo, make, pip, etc.) to manage their own directories
- **Allows** safe navigation commands (pwd, pushd, popd)
- **Checks** file access commands (ls, cat, grep, find, etc.) for excluded directory references
- **Blocks** navigation to excluded directories (`cd node_modules`)
- **Validates** command chains (&&, ||, ;, |) by checking each segment
- **Blocks** shell features that could bypass validation (command/process substitution, brace expansion, variable assignments)
- **Checks** redirection operators to prevent access via `>`, `<`, `>>`, `<<`

### 2. Read Hook

Validates file read operations:

- Parses file_path from tool input (JSON or command-line)
- Checks if path contains any excluded directory as a complete path component
- Blocks reads with informative error messages

### 3. Glob Hook

Validates file pattern matching:

- Checks both the pattern and optional path parameters
- Blocks glob patterns targeting excluded directories
- Prevents massive file list returns

### 4. Grep Hook

Validates content search operations:

- Checks the path parameter for excluded directories
- Allows searches in current directory (no path specified)
- Blocks searches that would waste tokens on minified/generated code

### Validation Process

When Claude attempts to access a blocked directory, the hook will:

1. Parse the tool input (JSON format or command-line arguments)
1. Analyze the command/path/pattern for excluded directory references
1. Block the operation and display an informative message to Claude
1. Return exit code 2 to prevent execution

## Example Usage

### Blocked Operations

**Bash - File access commands:**

```bash
find node_modules -name "*.js"
eza -la .git/objects
cat dist/bundle.min.js
```

Blocked with messages like: `Blocked: Command segment 'find node_modules -name "*.js"' accesses excluded directory 'node_modules'.`

**Bash - Navigation to excluded directories:**

```bash
cd node_modules
cd .venv
```

Blocked with: `Blocked: Cannot navigate to excluded directory 'node_modules'.`

**Bash - Dangerous shell features:**

```bash
echo $(cat node_modules/package.json)
cat <(rg "test" node_modules/)
DIR=node_modules && ls $DIR
```

Blocked with specific messages about command substitution, process substitution, or variable assignments.

**Glob pattern:**

```bash
node_modules/**/*.js
vendor/*/src/*.php
```

Blocked with: `Blocked: Glob pattern 'node_modules/**/*.js' targets excluded directory 'node_modules'.`

**Grep search:**

```bash
rg "import" node_modules/
```

Blocked with: `Blocked: Cannot grep in path 'node_modules/' - it's inside excluded directory 'node_modules'.`

**Read operation:**

```bash
cat node_modules/react/package.json
```

Blocked via Read hook with: `Blocked: Cannot read file 'node_modules/react/package.json' - path contains excluded directory 'node_modules'.`

### Allowed Operations

**Trusted tool invocations:**

```bash
bun install
bun run build
cargo build
make test
uv pip install -r requirements.txt
```

These are always allowed as they manage their own directories internally.

**Safe navigation:**

```bash
pwd
pushd src
popd
```

Navigation commands are allowed (except `cd` to excluded directories).

**Command chains with trusted tools:**

```bash
cd src && bun run build
bun install && bun test
```

Allowed because npm is a trusted tool and cd is navigating to a non-excluded directory.

## Benefits

- **Faster Responses**: Avoid waiting for operations on large directories
- **Token Savings**: Don't waste tokens reading thousands of dependency files
- **Better Focus**: Keep Claude focused on your actual source code
- **Improved Performance**: Reduce unnecessary file system operations

## Testing

This plugin includes a comprehensive test suite using BATS (Bash Automated Testing System).

### Prerequisites

Install BATS:

```bash
# macOS
brew install bats-core

# Ubuntu/Debian
sudo apt-get install bats

# npm
bun install -g bats
```

### Running Tests

```bash
# Run all tests
make test

# Or run individual test suites
bats tests/test-session-context.bats
bats tests/test-bash-validate.bats
bats tests/test-read-validate.bats
bats tests/test-glob-validate.bats
bats tests/test-grep-validate.bats
```

### Test Coverage

The test suite includes 56 tests organized by hook:

- **test-session-context.bats (1 test)**: SessionStart hook execution verification
- **test-bash-validate.bats (37 tests)**: Command-line args, JSON input, security edge cases
- **test-read-validate.bats (7 tests)**: File path validation with command-line and JSON modes
- **test-glob-validate.bats (6 tests)**: Pattern and path parameter validation
- **test-grep-validate.bats (5 tests)**: Search path validation

All validation scripts test all 8 excluded directories with both blocking and allowing scenarios.

See [tests/README.md](tests/README.md) for detailed testing documentation.

## Version

**1.0.0**

## License

MIT

## Support

For issues or questions, please open an issue on the marketplace repository.
