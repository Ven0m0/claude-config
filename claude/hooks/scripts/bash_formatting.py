#!/usr/bin/env -S uv run --script
"""Bash formatting logic using Prettier."""

import subprocess
from pathlib import Path


def format_bash_with_prettier(temp_dir: Path) -> None:
    """Format Bash files in a temporary directory with prettier-plugin-sh.

    Args:
        temp_dir (Path): Directory containing extracted Bash blocks.
    """
    try:
        sh_files = list(temp_dir.rglob("*.sh"))
        if not sh_files:
            return

        npm_root_proc = subprocess.run(
            ["npm", "root", "-g"],
            capture_output=True,
            text=True,
            check=True
        )
        npm_root = npm_root_proc.stdout.strip()
        plugin_path = f"{npm_root}/prettier-plugin-sh/lib/index.cjs"

        cmd = [
            "npx", "prettier", "--write", "--print-width", "120",
            f"--plugin={plugin_path}"
        ] + [str(f.relative_to(temp_dir)) for f in sh_files]

        result = subprocess.run(
            cmd,
            shell=False,
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
