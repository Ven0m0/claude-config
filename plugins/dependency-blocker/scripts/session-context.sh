#!/bin/bash

# This script provides context to Claude at session start about the dependency blocker plugin.
# It informs Claude proactively about blocked directories and allowed tools.
# Uses JSON format with additionalContext to inject context into Claude's session.

cat <<'EOF'
{
  "hookSpecificOutput": {
    "hookEventName": "SessionStart",
    "additionalContext": "DEPENDENCY BLOCKER PLUGIN ACTIVE\n\nBlocked Directories (DO NOT use Read/Glob/Grep/file access commands on these):\n- node_modules, .git, vendor, target, .venv, venv, dist, build\n\nAllowed Tools (these CAN operate on blocked directories):\n- npm, yarn, pnpm, cargo, make, pip, go, ruby, java, gradle, maven, python\n\nRationale: These directories contain 100k+ generated/dependency files that waste tokens.\n\nRecommended approach: Use package manager commands instead of file access commands."
  }
}
EOF
