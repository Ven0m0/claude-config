#!/usr/bin/env bash
# Usage: llm-tmux.sh <claude|opencode|kilo>
set -euo pipefail

app="${1:?Usage: llm-tmux.sh <claude|opencode|kilo>}"
session_name="${app}"

if ! tmux has-session -t "${session_name}" 2>/dev/null; then
  tmux new-session -d -s "${session_name}" "${app}"
  tmux set-option -t "${session_name}" history-limit 10000
fi

tmux attach -t "${session_name}"
