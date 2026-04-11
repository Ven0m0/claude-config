#!/usr/bin/env python3
"""Collect TODO/FIXME/HACK/NOTE/OPTIMIZE/SECURITY/DEBT comments from a source tree.

Outputs a JSON array of raw items to stdout or --output path.
Each item includes file, line, marker, text, and ±5-line context.

Usage:
    python3 collect.py <root> [--include GLOB ...] [--output raw.json]
    python3 collect.py . --include "*.py" "*.ts" --output /tmp/raw.json
"""

from __future__ import annotations

import argparse
import fnmatch
import json
import re
import sys
from pathlib import Path


MARKERS = ("TODO", "FIXME", "HACK", "NOTE", "OPTIMIZE", "SECURITY", "DEBT")

# Matches a comment marker anywhere in a line, capturing the marker and the rest.
_PATTERN = re.compile(
    r"(?:#|//|/\*|--)\s*(" + "|".join(MARKERS) + r")[\s:]*(.*)$",
    re.IGNORECASE,
)

CONTEXT_LINES = 5

# Files and directories to skip unconditionally.
_SKIP_DIRS = {
    ".git",
    ".hg",
    ".svn",
    "node_modules",
    "__pycache__",
    ".mypy_cache",
    ".ruff_cache",
    "dist",
    "build",
    ".venv",
    "venv",
}
_SKIP_EXTENSIONS = {
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".svg",
    ".ico",
    ".woff",
    ".woff2",
    ".ttf",
    ".eot",
    ".pdf",
    ".zip",
    ".gz",
    ".tar",
    ".lock",
    ".sum",
}


def _should_skip(path: Path) -> bool:
    for part in path.parts:
        if part in _SKIP_DIRS:
            return True
    return path.suffix.lower() in _SKIP_EXTENSIONS


def _matches_includes(path: Path, includes: list[str]) -> bool:
    if not includes:
        return True
    name = path.name
    return any(fnmatch.fnmatch(name, pat) for pat in includes)


def _collect_file(path: Path, root: Path) -> list[dict]:
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return []

    lines = text.splitlines()
    results: list[dict] = []

    for i, line in enumerate(lines):
        m = _PATTERN.search(line)
        if not m:
            continue

        marker = m.group(1).upper()
        comment_text = m.group(2).strip()

        start = max(0, i - CONTEXT_LINES)
        end = min(len(lines), i + CONTEXT_LINES + 1)
        context_lines = [
            {"offset": j - i, "text": lines[j]}
            for j in range(start, end)
        ]

        results.append(
            {
                "file": str(path.relative_to(root)),
                "line": i + 1,
                "marker": marker,
                "text": comment_text,
                "context": context_lines,
            }
        )

    return results


def collect(root: Path, includes: list[str]) -> list[dict]:
    items: list[dict] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue
        if _should_skip(path.relative_to(root)):
            continue
        if not _matches_includes(path, includes):
            continue
        items.extend(_collect_file(path, root))
    return items


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("root", type=Path, help="Repository root directory")
    parser.add_argument(
        "--include",
        nargs="+",
        metavar="GLOB",
        default=[],
        help="Filename glob patterns to include (e.g. '*.py' '*.ts'). Matches all files if omitted.",
    )
    parser.add_argument(
        "--output",
        "-o",
        type=Path,
        default=None,
        help="Write JSON output to this file instead of stdout.",
    )
    args = parser.parse_args()

    root = args.root.resolve()
    if not root.is_dir():
        print(f"error: {root} is not a directory", file=sys.stderr)
        sys.exit(1)

    items = collect(root, args.include)

    payload = json.dumps(items, indent=2, ensure_ascii=False)

    if args.output:
        args.output.write_text(payload, encoding="utf-8")
        print(f"Collected {len(items)} items -> {args.output}", file=sys.stderr)
    else:
        print(payload)


if __name__ == "__main__":
    main()
