#!/usr/bin/env python3
"""Bash formatting logic using Prettier."""

import subprocess
from pathlib import Path


def format_bash_with_prettier(temp_dir: Path) -> None:
    """Format Bash files in a temporary directory with prettier-plugin-sh.

    Args:
        temp_dir (Path): Directory containing extracted Bash blocks.
    """
    try:
        result = subprocess.run(
            "npx prettier --write --print-width 120 --plugin=$(npm root -g)/prettier-plugin-sh/lib/index.cjs ./**/*.sh",
            shell=True,
            capture_output=True,
            text=True,
            cwd=temp_dir,
        )
        if result.returncode != 0:
            print(f"ERROR running prettier-plugin-sh ❌ {result.stderr}")
        else:
            print("Completed bash formatting ✅")
    except Exception as exc:
        print(f"ERROR running prettier-plugin-sh ❌ {exc}")
