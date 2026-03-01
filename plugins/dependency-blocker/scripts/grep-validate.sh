#!/usr/bin/env bash
set -euo pipefail

# This script validates Grep operations before execution.
# It blocks grep operations that search in excluded directories to avoid token bloat.

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
  PATH_ARG="$1"
else
  # Check if jq is available
  if ! command -v jq &> /dev/null; then
    echo "Error: jq is required for JSON parsing but not found." >&2
    exit 1
  fi

  # No arguments, read JSON from stdin (Claude Code hook mode)
  INPUT=$(cat)
  # Extract path from JSON: {"tool_input": {"path": "...", "pattern": "..."}}
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
  #   - "dir" alone (for searching in directory)
  if [[ $text =~ (^|/)${dir}(/|$) ]] || [[ $text =~ ^${dir}/ ]] || [[ $text == "$dir" ]]; then
    return 0 # Found
  fi
  return 1 # Not found
}

# If no path specified, default to current directory (allow)
if [[ -z $PATH_ARG ]]; then
  exit 0
fi

# Check path for excluded directories
for dir in "${EXCLUDED_DIRS[@]}"; do
  if contains_excluded_dir "$PATH_ARG" "$dir"; then
    echo "Blocked: Cannot grep in path '$PATH_ARG' - it's inside excluded directory '$dir'. Grepping dependency/build directories wastes tokens on minified/generated code. Use tool commands (npm search, go doc, etc.) or grep specific files outside these directories." >&2
    exit 2
  fi
done

# All checks passed
exit 0
