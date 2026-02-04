#!/usr/bin/env python3
"""
PreToolUse hook: Quality gate for git commit operations.
Runs lint and type checks before allowing git commits.

Implements TODO item: "Quality gate (e.g. lint/type-check before commit)"
"""

import json
import os
import shutil
import subprocess
import sys
from pathlib import Path


def get_staged_files(cwd: str) -> list[str]:
    """Get list of staged files from git."""
    try:
        result = subprocess.run(
            ["git", "diff", "--cached", "--name-only", "--diff-filter=ACMR"],
            capture_output=True,
            text=True,
            cwd=cwd,
        )
        if result.returncode == 0:
            return [f.strip() for f in result.stdout.strip().split("\n") if f.strip()]
    except Exception:
        pass
    return []


def check_python_lint(files: list[str], cwd: str) -> tuple[bool, str]:
    """Run ruff check on Python files."""
    py_files = [f for f in files if f.endswith(".py")]
    if not py_files or not shutil.which("ruff"):
        return True, ""

    result = subprocess.run(
        ["ruff", "check", "--select", "E,F,I,UP"] + py_files,
        capture_output=True,
        text=True,
        cwd=cwd,
    )

    if result.returncode != 0:
        return False, result.stdout.strip() or result.stderr.strip()
    return True, ""


def check_python_types(files: list[str], cwd: str) -> tuple[bool, str]:
    """Run pyright or mypy on Python files if available."""
    py_files = [f for f in files if f.endswith(".py")]
    if not py_files:
        return True, ""

    # Try pyright first, then mypy
    for tool in ["pyright", "mypy"]:
        if shutil.which(tool):
            result = subprocess.run(
                [tool] + py_files,
                capture_output=True,
                text=True,
                cwd=cwd,
            )
            if result.returncode != 0:
                errors = result.stdout.strip() or result.stderr.strip()
                # Only fail on actual errors, not warnings
                if "error:" in errors.lower():
                    return False, f"{tool}: {errors}"
            return True, ""

    return True, ""  # No type checker available


def check_js_ts_lint(files: list[str], cwd: str) -> tuple[bool, str]:
    """Run biome or eslint on JS/TS files."""
    js_files = [f for f in files if f.endswith((".js", ".jsx", ".ts", ".tsx"))]
    if not js_files:
        return True, ""

    # Try biome first
    if shutil.which("biome"):
        result = subprocess.run(
            ["biome", "check", "--diagnostic-level=error"] + js_files,
            capture_output=True,
            text=True,
            cwd=cwd,
        )
        if result.returncode != 0:
            return False, result.stdout.strip() or result.stderr.strip()
        return True, ""

    # Fall back to eslint
    if shutil.which("eslint"):
        result = subprocess.run(
            ["eslint", "--quiet"] + js_files,
            capture_output=True,
            text=True,
            cwd=cwd,
        )
        if result.returncode != 0:
            return False, result.stdout.strip() or result.stderr.strip()

    return True, ""


def main():
    try:
        data = json.load(sys.stdin)
        tool_name = data.get("tool_name", "")
        tool_input = data.get("tool_input", {})

        # Only intercept Bash tool with git commit commands
        if tool_name != "Bash":
            sys.exit(0)

        command = tool_input.get("command", "")

        # Check if this is a git commit command
        if "git commit" not in command and "git stash" not in command:
            sys.exit(0)

        # Skip if --no-verify flag is present (user explicitly wants to skip checks)
        if "--no-verify" in command:
            sys.exit(0)

        cwd = os.environ.get("CLAUDE_PROJECT_DIR", os.getcwd())
        staged_files = get_staged_files(cwd)

        if not staged_files:
            sys.exit(0)  # No staged files, nothing to check

        errors = []

        # Run Python lint checks
        lint_ok, lint_err = check_python_lint(staged_files, cwd)
        if not lint_ok:
            errors.append(f"Python lint errors:\n{lint_err}")

        # Run Python type checks (optional - only if type checker is installed)
        type_ok, type_err = check_python_types(staged_files, cwd)
        if not type_ok:
            errors.append(f"Type check errors:\n{type_err}")

        # Run JS/TS lint checks
        js_ok, js_err = check_js_ts_lint(staged_files, cwd)
        if not js_ok:
            errors.append(f"JS/TS lint errors:\n{js_err}")

        if errors:
            error_msg = "Quality gate failed:\n" + "\n\n".join(errors)
            output = {
                "decision": "block",
                "reason": error_msg,
            }
            print(json.dumps(output))
            sys.exit(0)

    except json.JSONDecodeError:
        # No valid input, allow the operation
        pass
    except Exception as e:
        # Log error but don't block on hook failures
        print(f"Quality gate hook error: {e}", file=sys.stderr)

    sys.exit(0)


if __name__ == "__main__":
    main()
