#!/usr/bin/env python3
"""Shared utility functions for hooks scripts."""

import shutil
import subprocess


def check_prettier_version() -> bool:
    """Check if prettier is installed and warn if version differs from 3.6.2."""
    if not shutil.which("npx"):
        return False
    try:
        result = subprocess.run(["npx", "prettier", "--version"],
                                capture_output=True, text=True, check=False, timeout=5)
        if result.returncode == 0:
            version = result.stdout.strip()
            if EXPECTED_PRETTIER_VERSION not in version:
                print(f"⚠️  Prettier version mismatch: expected {EXPECTED_PRETTIER_VERSION}, found {version}")
            return True
    except Exception:
        pass
    return False
