#!/usr/bin/env bash
set -euo pipefail
# Auto-format script for coding-assistant plugin
# This script automatically formats code files after they are written or edited

FILE="$1"

# Check if file exists
if [[ ! -f $FILE ]]; then
  echo "File not found: $FILE"
  exit 0
fi

# Get file extension
EXT="${FILE##*.}"

# Format based on file type
case "$EXT" in
  js | jsx | ts | tsx | json)
    # Check if biome is available
    if command -v npx &>/dev/null; then
      npx @biomejs/biome format --write "$FILE" 2>/dev/null
      echo "✓ Formatted with Biome: $FILE"
    fi
    ;;
  py)
    # Check if ruff is available (prefer uvx for auto-install)
    if command -v uvx &>/dev/null; then
      uvx ruff format "$FILE" 2>/dev/null
      echo "✓ Formatted with ruff: $FILE"
    elif command -v ruff &>/dev/null; then
      ruff format "$FILE" 2>/dev/null
      echo "✓ Formatted with ruff: $FILE"
    fi
    ;;
  go)
    # Check if gofmt is available
    if command -v gofmt &>/dev/null; then
      gofmt -w "$FILE" 2>/dev/null
      echo "✓ Formatted with gofmt: $FILE"
    fi
    ;;
  rs)
    # Check if rustfmt is available
    if command -v rustfmt &>/dev/null; then
      rustfmt "$FILE" 2>/dev/null
      echo "✓ Formatted with rustfmt: $FILE"
    fi
    ;;
  *)
    # No formatter available for this file type
    exit 0
    ;;
esac

exit 0
