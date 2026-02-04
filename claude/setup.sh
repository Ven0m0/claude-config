#!/bin/bash

mkdir -p "${HOME}/.claude/tweakcc"
export TWEAKCC_CONFIG_DIR="${HOME}/.claude/tweakcc"
bunx tweakcc --apply

bunx get-shit-done-cc --global

bunx cclsp@latest setup --user
