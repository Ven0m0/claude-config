#!/usr/bin/env bash
set -euo pipefail

# This script provides context to Claude at session start about the block-dotfiles plugin.
# It informs Claude proactively about sensitive files that are blocked for security reasons.
# Uses JSON format with additionalContext to inject context into Claude's session.

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "SECURITY: DOTFILES BLOCKED\n\nSensitive files are BLOCKED for security (credentials/API keys):\n\nShell configs: .bashrc, .zshrc, .bash_profile, .zsh_profile, .profile\nEnvironment files: .env, .env.local, .env.production, .env.development, .env.staging, .env.test\nCredential stores: .ssh/, .aws/, .npmrc, .pypirc, .gitconfig, .netrc, .docker/, .dockercfg, .kube/, .config/gcloud/\n\nDO NOT attempt to read, grep, glob, or access these files.\nThey contain credentials and secrets that must not be exposed.\n\nIf you need environment configuration, ask the user to provide it explicitly."
  }
}
EOF
