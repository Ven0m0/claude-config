#!/usr/bin/env bash
# Pre-release checklist for claude/ config pack.
# Usage: from repo root: bash claude/scripts/check-release.sh
# Exits 0 if all checks pass, non-zero otherwise.

set -e
REPO_ROOT="${REPO_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
CLAUDE="${REPO_ROOT}/claude"
FAIL=0

check_file() {
  if [[ -f "$1" ]]; then
    echo "  OK $1"
  else
    echo "  MISSING $1"
    FAIL=1
  fi
}

check_dir() {
  if [[ -d "$1" ]]; then
    echo "  OK $1"
  else
    echo "  MISSING $1"
    FAIL=1
  fi
}

echo "=== Required files ==="
check_file "${CLAUDE}/AGENTS.md"
check_file "${CLAUDE}/CLAUDE.md"
check_file "${CLAUDE}/hooks/hooks.json"
check_file "${CLAUDE}/settings.json"

echo "=== In-scope docs ==="
check_file "${CLAUDE}/docs/progressive-disclosure.md"
check_file "${CLAUDE}/docs/prompt-caching.md"
check_file "${CLAUDE}/docs/prompt-best-practices.md"
check_file "${CLAUDE}/docs/skills-guide.md"
check_file "${CLAUDE}/docs/skills-ref.md"
check_file "${CLAUDE}/docs/tools-reference.md"
check_file "${CLAUDE}/docs/toon.md"

echo "=== In-scope skills ==="
check_dir "${CLAUDE}/skills/manage-markdown-docs"
check_dir "${CLAUDE}/skills/llm-tuning-patterns"
check_dir "${CLAUDE}/skills/llm-docs-optimizer"
check_dir "${CLAUDE}/skills/modern-tool-substitution"
check_dir "${CLAUDE}/skills/hooks-configuration"
check_dir "${CLAUDE}/skills/ref-toon-format"
check_dir "${CLAUDE}/skills/skill-optimizer"

if [[ $FAIL -eq 0 ]]; then
  echo "=== All checks passed ==="
  exit 0
else
  echo "=== Some checks failed ==="
  exit 1
fi
