#!/bin/bash

# Claude Code Auto-Formatting Hook
# Automatically formats source code files after Claude edits them

# Read JSON input from stdin
json_input=$(cat 2>/dev/null)

# Try to extract file path using jq if available, otherwise use grep/sed
if command -v jq &>/dev/null; then
  file_path=$(echo "$json_input" | jq -r '.tool_input.file_path // empty')
else
  # TODO: replace grep with ripgrep
  # Fallback: extract file_path using grep and sed
  file_path=$(echo "$json_input" | grep -o '"file_path"[[:space:]]*:[[:space:]]*"[^"]*"' | sed 's/.*"file_path"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/')
fi
# Exit silently if no file path found or file doesn't exist
if [[ -z "$file_path" ]] || [[ ! -f "$file_path" ]]; then
  exit 0
fi
# Get file extension and basename
extension="${file_path##*.}"
basename="${file_path##*/}"

# TODO: add shfmt, json, yaml, toml, css, html, etc...
# Format based on file extension
case "$extension" in
  js|jsx|ts|tsx)
    if command -v biome &>/dev/null; then
      biome format --write "$file_path" &>/dev/null
    elif command -v prettier &>/dev/null; then
      prettier --write "$file_path" &>/dev/null
    fi ;;
    py) command -v uv &>/dev/null && uv tool run ruff format "$file_path" &>/dev/null
    md) command -v prettier &>/dev/null && prettier --write "$file_path" &>/dev/null
    go)
      command -v goimports &>/dev/null && goimports -w "$file_path" &>/dev/null
      command -v go &>/dev/null && go fmt "$file_path" &>/dev/null ;;
    kt|kts)
      if command -v ktlint &>/dev/null; then
        ktlint --format "$file_path" &>/dev/null
      elif command -v ktfmt &>/dev/null; then
        ktfmt "$file_path" &>/dev/null
      fi ;;
esac

# Always exit successfully to avoid blocking Claude's operations
exit 0
