#!/usr/bin/env bash
set -euo pipefail
shopt -s nullglob globstar

bun update -g -r --latest --trust --linker=hoisted
bun i -g --trust --latest @google/gemini-cli@preview @github/copilot@prerelease
gemini extensions update --all; claude plugin marketplace update

CLAUDE_DIR="${HOME}/.claude"
mkdir -p "${CLAUDE_DIR}/tweakcc"
export TWEAKCC_CONFIG_DIR="${CLAUDE_DIR}/tweakcc" TWEAKCC_CC_INSTALLATION_PATH="/opt/claude-code/bin/claude"
sudo -E bunx --bun tweakcc --apply

