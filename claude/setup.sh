#!/bin/bash

# Make git comnands faster and less verbose to save tokens
git config --global --add safe.directory "$(realpath .)"
git config --global index.version 4
git config --global index.threads 0
git config --global http.version "HTTP/1.1"
git config --global protocol.version 2
git config --global core.compression 9
git config --global core.preloadindex true
git config --global diff.context 3
git config --global diff.suppressBlankEmpty true
git config --global diff.compactionHeuristic true
git config --global diff.ignoreSubmodules true
git config --global diff.algorithm histogram
git config --global merge.conflictStyle zdiff3
git config --global fetch.parallel 0
git config --global pack.threads 0
git config --global status.short true
git config --global commit.verbose false
git config --global feature.manyFiles true

command -v uv || wget -qO- https://astral.sh/uv/install.sh | sh

mkdir -p "$HOME/.claude/tweakcc"
export TWEAKCC_CONFIG_DIR="$HOME/.claude/tweakcc" TWEAKCC_CC_INSTALLATION_PATH="/opt/claude-code/bin/claude"
sudo bunx tweakcc --apply

# bunx get-shit-done-cc --global
# bunx cclsp@latest setup --user

claude plugin marketplace update
