#!/bin/bash

mkdir -p "${HOME}/.claude/tweakcc"
export TWEAKCC_CONFIG_DIR="${HOME}/.claude/tweakcc" TWEAKCC_CC_INSTALLATION_PATH="/opt/claude-code/bin/claude"
sudo TWEAKCC_CC_INSTALLATION_PATH="/opt/claude-code/bin/claude" bunx tweakcc

bunx get-shit-done-cc --global

bunx cclsp@latest setup --user

claude plugin marketplace update
