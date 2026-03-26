#!/usr/bin/env bash
# Linter Autofix Detection and Execution Script
# Auto-detects project linters and runs appropriate autofix commands.
# Usage: bash detect-and-fix.sh [--check-only] [path]
#
# Replaces manual project type detection + linter selection with one call.
# Outputs structured results showing what was fixed.

set -uo pipefail

CHECK_ONLY=false
TARGET_PATH="."

for arg in "$@"; do
  case "$arg" in
    --check-only) CHECK_ONLY=true ;;
    *) TARGET_PATH="$arg" ;;
  esac
done

cd -- "$TARGET_PATH"

echo "=== LINTER DETECTION ==="

declare -a DETECTED_LINTERS=()

# JavaScript/TypeScript: Biome
if [ -f "biome.json" ] || [ -f "biome.jsonc" ]; then
  DETECTED_LINTERS+=("biome")
fi

# JavaScript/TypeScript: ESLint
if [ -f ".eslintrc" ] || [ -f ".eslintrc.js" ] || [ -f ".eslintrc.json" ] || [ -f "eslint.config.js" ] || [ -f "eslint.config.mjs" ]; then
  DETECTED_LINTERS+=("eslint")
fi

# JavaScript/TypeScript: Prettier (formatter only)
if [ -f ".prettierrc" ] || [ -f ".prettierrc.json" ] || [ -f "prettier.config.js" ] || [ -f "prettier.config.mjs" ]; then
  DETECTED_LINTERS+=("prettier")
fi

# Python: Ruff
if [ -f "ruff.toml" ] || [ -f ".ruff.toml" ] || ([ -f "pyproject.toml" ] && grep -q "\[tool.ruff\]" pyproject.toml 2>/dev/null); then
  DETECTED_LINTERS+=("ruff")
fi

# Python: Black (if no ruff)
if [ -f "pyproject.toml" ] && grep -q "\[tool.black\]" pyproject.toml 2>/dev/null && ! printf '%s\n' "${DETECTED_LINTERS[@]}" | grep -q "ruff"; then
  DETECTED_LINTERS+=("black")
fi

# Python: isort (if no ruff)
if [ -f "pyproject.toml" ] && grep -q "\[tool.isort\]" pyproject.toml 2>/dev/null && ! printf '%s\n' "${DETECTED_LINTERS[@]}" | grep -q "ruff"; then
  DETECTED_LINTERS+=("isort")
fi

# Rust: Clippy + rustfmt
if [ -f "Cargo.toml" ]; then
  DETECTED_LINTERS+=("clippy")
  DETECTED_LINTERS+=("rustfmt")
fi

# Go: gofmt + go vet
if [ -f "go.mod" ]; then
  DETECTED_LINTERS+=("gofmt")
  DETECTED_LINTERS+=("govet")
fi

# Go: golangci-lint
if [ -f ".golangci.yml" ] || [ -f ".golangci.yaml" ]; then
  DETECTED_LINTERS+=("golangci-lint")
fi

# Shell: ShellCheck (check-only, no autofix)
if command -v shellcheck >/dev/null 2>&1; then
  sh_files=$(find . -maxdepth 3 -name "*.sh" ! -path "*/node_modules/*" ! -path "*/.git/*" 2>/dev/null | head -1)
  if [ -n "$sh_files" ]; then
    DETECTED_LINTERS+=("shellcheck")
  fi
fi

# Report detection results
echo "DETECTED: ${DETECTED_LINTERS[*]:-none}"
echo ""

if [ ${#DETECTED_LINTERS[@]} -eq 0 ]; then
  echo "NO_LINTERS_FOUND=true"
  echo "HINT: No linter configuration files detected in this project."
  echo "=== DONE ==="
  exit 0
fi

# Execute
echo "=== EXECUTION ==="

exit_code=0
for i in "${!DETECTED_LINTERS[@]}"; do
  linter="${DETECTED_LINTERS[$i]}"
  echo "--- ${linter} ---"

  {
    if [ "$CHECK_ONLY" = true ]; then
      case "$linter" in
        biome)
          echo "CMD: npx @biomejs/biome check --reporter=github --max-diagnostics=20 ."
          npx @biomejs/biome check --reporter=github --max-diagnostics=20 .
          ;;
        eslint)
          echo "CMD: npx eslint --format=unix --max-warnings=0 ."
          npx eslint --format=unix --max-warnings=0 .
          ;;
        prettier)
          echo "CMD: npx prettier --check ."
          npx prettier --check .
          ;;
        ruff)
          echo "CMD: ruff check --output-format=github . && ruff format --check ."
          ruff check --output-format=github . && ruff format --check .
          ;;
        black)
          echo "CMD: black --check ."
          black --check .
          ;;
        isort)
          echo "CMD: isort --check-only ."
          isort --check-only .
          ;;
        clippy)
          echo "CMD: cargo clippy --message-format=short 2>&1 | tail -20"
          cargo clippy --message-format=short 2>&1 | tail -20
          ;;
        rustfmt)
          echo "CMD: cargo fmt --check"
          cargo fmt --check
          ;;
        gofmt)
          echo "CMD: gofmt -l ."
          gofmt -l .
          ;;
        govet)
          echo "CMD: go vet ./..."
          go vet ./...
          ;;
        golangci-lint)
          echo "CMD: golangci-lint run ./..."
          golangci-lint run ./...
          ;;
        shellcheck)
          echo "CMD: find . -maxdepth 3 -name '*.sh' ! -path '*/node_modules/*' -exec shellcheck -f gcc {} + 2>/dev/null | head -20"
          find . -maxdepth 3 -name '*.sh' ! -path '*/node_modules/*' -exec shellcheck -f gcc {} + 2>/dev/null | head -20
          ;;
      esac
    else
      case "$linter" in
        biome)
          echo "CMD: npx @biomejs/biome check --write ."
          npx @biomejs/biome check --write .
          ;;
        eslint)
          echo "CMD: npx eslint --fix ."
          npx eslint --fix .
          ;;
        prettier)
          echo "CMD: npx prettier --write ."
          npx prettier --write .
          ;;
        ruff)
          echo "CMD: ruff check --fix . && ruff format ."
          ruff check --fix . && ruff format .
          ;;
        black)
          echo "CMD: black ."
          black .
          ;;
        isort)
          echo "CMD: isort ."
          isort .
          ;;
        clippy)
          echo "CMD: cargo clippy --fix --allow-dirty --allow-staged 2>&1 | tail -20"
          cargo clippy --fix --allow-dirty --allow-staged 2>&1 | tail -20
          ;;
        rustfmt)
          echo "CMD: cargo fmt"
          cargo fmt
          ;;
        gofmt)
          echo "CMD: gofmt -w ."
          gofmt -w .
          ;;
        govet)
          echo "CMD: go vet ./..."
          go vet ./...
          ;;
        golangci-lint)
          echo "CMD: golangci-lint run --fix ./..."
          golangci-lint run --fix ./...
          ;;
        shellcheck)
          echo "CMD: shellcheck: no autofix available (check-only)"
          echo 'shellcheck: no autofix available (check-only)'
          ;;
      esac
    fi
  } 2>&1 | head -30

  cmd_exit=$?
  echo "EXIT: $cmd_exit"
  [ $cmd_exit -ne 0 ] && exit_code=$cmd_exit
  echo ""
done

echo "=== RESULTS ==="
echo "OVERALL_EXIT=$exit_code"

# Show what files changed (if fixing)
if [ "$CHECK_ONLY" = false ]; then
  changed=$(git diff --name-only 2>/dev/null | head -20)
  if [ -n "$changed" ]; then
    echo "FILES_MODIFIED:"
    echo "$changed" | sed 's/^/  - /'
  else
    echo "FILES_MODIFIED: none"
  fi
fi

echo "=== DONE ==="
exit $exit_code
