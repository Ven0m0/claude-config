#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob globstar

gemini extensions update --all
claude plugin marketplace update

CLAUDE_DIR="${HOME}/.claude"
mkdir -p "${CLAUDE_DIR}/tweakcc"
export TWEAKCC_CONFIG_DIR="${CLAUDE_DIR}/tweakcc" TWEAKCC_CC_INSTALLATION_PATH="/opt/claude-code/bin/claude"
sudo bunx tweakcc --apply

