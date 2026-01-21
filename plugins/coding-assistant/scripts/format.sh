#!/bin/bash
# Auto-format script for coding-assistant plugin
# This script automatically formats code files after they are written or edited

FILE="$1"

# Check if file exists
if [ ! -f "$FILE" ]; then
    echo "File not found: $FILE"
    exit 0
fi

# Get file extension
EXT="${FILE##*.}"

# Format based on file type
case "$EXT" in
    js|jsx|ts|tsx|json)
        # Check if prettier is available
        if command -v prettier &> /dev/null; then
            prettier --write "$FILE" 2>/dev/null
            echo "✓ Formatted with Prettier: $FILE"
        fi
        ;;
    py)
        # Check if black is available
        if command -v black &> /dev/null; then
            black "$FILE" 2>/dev/null
            echo "✓ Formatted with Black: $FILE"
        elif command -v autopep8 &> /dev/null; then
            autopep8 --in-place "$FILE" 2>/dev/null
            echo "✓ Formatted with autopep8: $FILE"
        fi
        ;;
    go)
        # Check if gofmt is available
        if command -v gofmt &> /dev/null; then
            gofmt -w "$FILE" 2>/dev/null
            echo "✓ Formatted with gofmt: $FILE"
        fi
        ;;
    rs)
        # Check if rustfmt is available
        if command -v rustfmt &> /dev/null; then
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
