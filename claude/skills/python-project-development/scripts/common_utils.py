#!/usr/bin/env python3
"""Common utility functions for file operations and data processing."""

import os
import subprocess as sp
from pathlib import Path


def find_files_fd(
    root: Path,
    extensions: frozenset[str],
    max_depth: int | None = None,
) -> list[Path]:
    """Find files using fd command (fast).

    Args:
      root: Root directory to search
      extensions: Set of extensions (e.g., {'.py', '.txt'})
      max_depth: Maximum search depth

    Returns:
      List of matching file paths, or empty list if fd not available
    """
    import shutil

    if not shutil.which("fd"):
        return []

    cmd = ["fd", "--type", "f", "--absolute-path"]

    if max_depth is not None:
        cmd.extend(["--max-depth", str(max_depth)])

    for ext in extensions:
        cmd.extend(["-e", ext.lstrip(".")])

    cmd.extend([".", str(root)])

    try:
        result = sp.run(
            cmd,
            capture_output=True,
            text=True,
            check=True,
        )
        return [Path(p) for p in result.stdout.strip().split("\n") if p]
    except sp.CalledProcessError:
        return []


def find_files_walk(
    root: Path,
    extensions: frozenset[str],
    max_depth: int | None = None,
) -> list[Path]:
    """Find files using os.walk (fallback).

    Args:
      root: Root directory to search
      extensions: Set of extensions (e.g., {'.py', '.txt'})
      max_depth: Maximum search depth (None = unlimited)

    Returns:
      List of matching file paths
    """
    files: list[Path] = []
    root_depth = len(root.parts)

    for dirpath, _, filenames in os.walk(root):
        current_path = Path(dirpath)

        if max_depth is not None:
            depth = len(current_path.parts) - root_depth
            if depth > max_depth:
                continue

        for filename in filenames:
            filepath = current_path / filename
            if filepath.suffix.lower() in extensions:
                files.append(filepath)

    return files


def find_files(
    root: Path,
    extensions: frozenset[str],
    max_depth: int | None = None,
) -> list[Path]:
    """Find files with automatic fallback (fd -> os.walk).

    Args:
      root: Root directory to search
      extensions: Set of extensions (e.g., {'.py', '.txt'})
      max_depth: Maximum search depth

    Returns:
      List of matching file paths
    """
    files = find_files_fd(root, extensions, max_depth)
    if not files:
        files = find_files_walk(root, extensions, max_depth)
    return files


def safe_read(path: Path, encoding: str = "utf-8") -> str | None:
    """Read file safely, returning None on error.

    Args:
      path: File path to read
      encoding: Text encoding

    Returns:
      File contents or None on error
    """
    try:
        return path.read_text(encoding=encoding)
    except (FileNotFoundError, PermissionError, UnicodeDecodeError):
        return None


def safe_write(path: Path, content: str, encoding: str = "utf-8") -> bool:
    """Write file safely, creating parent directories.

    Args:
      path: File path to write
      content: Content to write
      encoding: Text encoding

    Returns:
      True on success, False on error
    """
    try:
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding=encoding)
        return True
    except (PermissionError, OSError):
        return False


def human_size(size_bytes: int) -> str:
    """Convert bytes to human-readable size.

    Args:
      size_bytes: Size in bytes

    Returns:
      Human-readable string (e.g., "1.5 MB")
    """
    for unit in ["B", "KB", "MB", "GB", "TB"]:
        if size_bytes < 1024.0:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024.0
    return f"{size_bytes:.1f} PB"


def get_file_size(path: Path) -> int:
    """Get file size safely, returning 0 on error.

    Args:
      path: File path

    Returns:
      Size in bytes, or 0 on error
    """
    try:
        return path.stat().st_size
    except (FileNotFoundError, PermissionError):
        return 0


def is_binary(path: Path, sample_size: int = 8192) -> bool:
    """Check if file is binary by sampling.

    Args:
      path: File path to check
      sample_size: Bytes to sample

    Returns:
      True if likely binary
    """
    try:
        with path.open("rb") as f:
            chunk = f.read(sample_size)
        return b"\x00" in chunk
    except (FileNotFoundError, PermissionError):
        return False
