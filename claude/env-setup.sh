#!/bin/bash
# Claude Code Environment Setup
# Source this file via CLAUDE_ENV_FILE for persistent environment across all Bash commands
#
# Usage:
#   export CLAUDE_ENV_FILE=/path/to/this/env-setup.sh
#   claude
#
# This file is sourced before each Bash command in Claude Code, making
# environment variables and shell configurations persistent.

# -------------------------------------------------------------------
# Python Environment
# -------------------------------------------------------------------

# Activate virtual environment (uncomment and modify as needed)
# source /path/to/venv/bin/activate
# conda activate myenv

# Python optimizations (reduce startup time, disable bytecode)
export PYTHONOPTIMIZE=2
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1
export PYTHONPATH="${PYTHONPATH}${PYTHONPATH:+:}."

# Prefer uv for Python package management
if command -v uv &> /dev/null; then
    alias pip="uv pip"
fi

# -------------------------------------------------------------------
# Node.js Environment
# -------------------------------------------------------------------

# Prefer bun for JavaScript tasks
if command -v bun &> /dev/null; then
    export npm_config_prefer_offline=true
fi

# -------------------------------------------------------------------
# Tool Preferences
# -------------------------------------------------------------------

# Prefer modern CLI tools
if command -v rg &> /dev/null; then
    alias grep="rg"
fi

if command -v fd &> /dev/null; then
    alias find="fd"
fi

if command -v bat &> /dev/null; then
    alias cat="bat --paging=never"
fi

if command -v eza &> /dev/null; then
    alias ls="eza"
fi

# -------------------------------------------------------------------
# Git Configuration
# -------------------------------------------------------------------

# Set default branch name for new repos
export GIT_DEFAULT_BRANCH="${GIT_DEFAULT_BRANCH:-main}"

# -------------------------------------------------------------------
# Project-Specific Variables
# -------------------------------------------------------------------

# Add your project-specific environment variables below
# export MY_API_KEY="your-api-key"
# export DATABASE_URL="your-database-url"

# -------------------------------------------------------------------
# Custom Functions
# -------------------------------------------------------------------

# Add project-specific shell functions here
# function deploy() { ... }

# -------------------------------------------------------------------
# Path Additions
# -------------------------------------------------------------------

# Add custom paths (uncomment and modify as needed)
# export PATH="$HOME/.local/bin:$PATH"
# export PATH="./node_modules/.bin:$PATH"
