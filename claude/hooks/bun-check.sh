#!/usr/bin/env bash
set -euo pipefail
# Runs bun check and reports errors to Claude
# Skip if disabled via env var
[[ "${BUN_CHECK_DISABLED:-}" = "1" ]] && exit 0
cd "$CLAUDE_PROJECT_DIR"
# Read session_id from hook stdin JSON
INPUT=$(cat -s 2>/dev/null)
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // "default"' 2>/dev/null || echo "default")
# Hard stop after 5 failures to prevent excessive loops (per session)
FAIL_COUNT_FILE="/tmp/bun-check-fails-${SESSION_ID}"
FAIL_COUNT=0
[[ -f "$FAIL_COUNT_FILE" ]] && FAIL_COUNT=$(cat "$FAIL_COUNT_FILE")
[[ "$FAIL_COUNT" -ge 5 ]] && exit 0
# Run bun check
OUTPUT=$(bun check 2>&1) || :
EXIT_CODE=${PIPESTATUS[0]:-$?}
# If bun check passed (exit 0), reset counter and exit silently
[[ "$EXIT_CODE" -eq 0 ]] && { rm -f "$FAIL_COUNT_FILE"; exit 0; }
# Has errors - increment counter and show to Claude
echo $((FAIL_COUNT + 1)) > "$FAIL_COUNT_FILE"
echo "## bun check failed (attempt $((FAIL_COUNT + 1))/5)" >&2
echo "" >&2
echo "$OUTPUT" >&2
exit 2
