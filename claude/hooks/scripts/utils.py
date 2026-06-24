#!/usr/bin/env -S uv run --script
"""Shared utility functions for hooks scripts."""

import json
import shutil
import subprocess
import sys


def check_prettier_version() -> bool:
    """Check if prettier is installed and warn if version differs from 3.6.2."""
    if not shutil.which("npx"):
        return False
    try:
        result = subprocess.run(
            ["npx", "prettier", "--version"],
            capture_output=True,
            text=True,
            check=False,
            timeout=5,
        )
        if result.returncode == 0:
            version = result.stdout.strip()
            if EXPECTED_PRETTIER_VERSION not in version:
                pass
            return True
    except Exception:
        pass
    return False


def read_stdin_payload() -> dict | None:
    """Read and parse the JSON payload from stdin.

    Returns:
        (dict | None): Parsed JSON data or None if invalid/empty.

    """
    try:
        return json.load(sys.stdin)
    except Exception:
        return None
