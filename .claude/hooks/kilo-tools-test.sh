#!/usr/bin/env bash
# PostToolUse: after an edit to kilo-tools TypeScript, run the package tests and feed failures
# back to Claude (exit 2 + stderr). The suite takes about a second.
set -euo pipefail

file="$(jq -r '.tool_input.file_path // empty')"
[[ "$file" =~ kilo-tools[/\\].*\.ts$ ]] || exit 0

cd "${CLAUDE_PROJECT_DIR:-.}"
if ! out="$(bun test kilo-tools 2>&1)"; then
  printf 'kilo-tools tests failed after editing %s:\n%s\n' "$file" "$(printf '%s\n' "$out" | tail -40)" >&2
  exit 2
fi
