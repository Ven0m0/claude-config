#!/usr/bin/env bash
set -euo pipefail

# This script validates Glob operations before execution.
# It blocks glob patterns that search in excluded directories to avoid token bloat.

# List of excluded directories (critical bloat offenders)
# Each of these can cause massive token waste if accessed
EXCLUDED_DIRS=(
  "node_modules" # JS/Node dependencies - can be 100k+ files
  ".git"         # Git version control history - entire repo history
  "vendor"       # PHP/Go/Ruby dependencies - like node_modules for other languages
  "target"       # Rust/Java build output - compiled artifacts
  ".venv"        # Python virtual environment - entire stdlib + packages
  "venv"         # Python virtual environment (alternate name)
  "dist"         # Build output - minified/compiled/bundled files
  "build"        # Build output - compiled artifacts and assets
)

# Read input - either JSON from stdin or command-line arguments
if [[ $# -gt 0 ]]; then
  # Command-line arguments provided (testing mode)
  PATTERN="$1"
  PATH_ARG="${2:-}"
else
  # Check if jq is available
  if ! command -v jq &> /dev/null; then
    echo "Error: jq is required for JSON parsing but not found." >&2
    exit 1
  fi

  # No arguments, read JSON from stdin (Claude Code hook mode)
  INPUT=$(cat)
  # Extract pattern and path from JSON: {"tool_input": {"pattern": "...", "path": "..."}}
  PATTERN=$(echo "$INPUT" | jq -r ".tool_input.pattern // empty" | tr '\t\r' ' ')
  PATH_ARG=$(echo "$INPUT" | jq -r ".tool_input.path // empty" | tr '\t\r' ' ')
fi

# Function to check if a directory name appears as a complete path component
contains_excluded_dir() {
  local text="$1"
  local dir="$2"

  # Check if directory appears as a complete path component
  # Match patterns:
  #   - "dir" at start with / after
  #   - "/dir/" in the middle
  #   - "/dir" at end
  #   - "dir/" at start (for relative paths)
  if [[ $text =~ (^|/)${dir}(/|$) ]] || [[ $text =~ ^${dir}/ ]]; then
    return 0 # Found
  fi
  return 1 # Not found
}

# Skip check if no pattern was extracted
if [[ -z $PATTERN ]]; then
  exit 0
fi

# Check pattern for excluded directories
for dir in "${EXCLUDED_DIRS[@]}"; do
  if contains_excluded_dir "$PATTERN" "$dir"; then
    echo "Blocked: Glob pattern '$PATTERN' targets excluded directory '$dir'. Globbing dependency/build directories would return massive file lists causing token bloat. Use tool commands to inspect these directories." >&2
    exit 2
  fi
done

# Check path parameter if provided
if [[ -n $PATH_ARG ]]; then
  for dir in "${EXCLUDED_DIRS[@]}"; do
    if contains_excluded_dir "$PATH_ARG" "$dir"; then
      echo "Blocked: Cannot glob in path '$PATH_ARG' - it's inside excluded directory '$dir'. Searching dependency/build directories would return massive file lists. Use tool commands (npm ls, cargo tree, etc.) to inspect dependencies." >&2
      exit 2
    fi
  done
fi

# All checks passed
exit 0
